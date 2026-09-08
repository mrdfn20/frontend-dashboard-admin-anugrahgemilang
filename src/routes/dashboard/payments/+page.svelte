<!-- src/routes/dashboard/payments/+page.svelte -->
<script>
	import { onMount } from 'svelte';
	import {
		paymentActions,
		debts,
		isLoading,
		error,
		hasMore,
		pagination,
		summary,
		filters
	} from '$lib/stores/payments.js';
	import { customerActions, customers } from '$lib/stores/customers.js';
	import { transactionHelpers } from '$lib/stores/transactions.js';
	import PaymentsFilter from '$lib/components/payments/PaymentsFilter.svelte';
	import PaymentsTable from '$lib/components/payments/PaymentsTable.svelte';
	import PayDebtModal from '$lib/components/transactions/PayDebtModal.svelte';
	import { infiniteScroll } from '$lib/actions/infiniteScroll.js';

	let selectedDebt = null;
	let showPayModal = false;

	// 🆕 Driver sekarang boleh bayar hutang langsung (dulu read-only) - tercatat
	// otomatis siapa yang bayar lewat kolom created_by_role & Audit Log.
	const canPay = true;

	onMount(async () => {
		await Promise.all([customerActions.loadCustomers(), paymentActions.loadDebts()]);
	});

	// Join nama pelanggan ke tiap baris (BE gak sertain customer_name di kolom hasil,
	// cuma dipakai internal buat filter server-side)
	$: customersById = $customers.reduce((map, c) => {
		map[c.id] = c.customer_name;
		return map;
	}, {});
	$: joinedDebts = $debts.map((row) => ({ ...row, customer_name: customersById[row.customer_id] }));

	async function handleFilterChange(event) {
		await paymentActions.applyFilters(event.detail);
	}

	async function handleFilterReset() {
		await paymentActions.clearFilters();
	}

	// 🆕 Kartu ringkasan diklik -> pastiin filter Status = "Belum Lunas" (kartu ini emang
	// representasi hutang yang belum lunas) - biar konsisten sama pola kartu klik-buat-filter
	// yang udah ada di halaman Pelanggan - klik lagi pas udah aktif = matiin filter (toggle
	// beneran, bukan cuma "set ke Belum Lunas" - itu bikin klik keliatan gak ngefek sama
	// sekali kalau statusnya emang udah Belum Lunas dari awal, kayak default-nya).
	async function toggleBelumLunas() {
		const newStatus = $filters.status === 'Belum Lunas' ? '' : 'Belum Lunas';
		await paymentActions.applyFilters({ status: newStatus });
	}

	function handlePayDebt(event) {
		const row = event.detail;
		// PayDebtModal butuh field `.id`, bukan `.transaction_id`
		selectedDebt = { ...row, id: row.transaction_id };
		showPayModal = true;
	}

	async function handlePaySuccess() {
		showPayModal = false;
		selectedDebt = null;
		await paymentActions.loadDebts();
	}
</script>

<div class="p-6">
	<div class="mb-6">
		<h1 class="text-2xl font-semibold text-gray-900">Hutang Pelanggan</h1>
		<p class="text-gray-500">Pantau & kelola pelunasan hutang pelanggan lintas semua transaksi</p>
	</div>

	<!-- Summary cards - angkanya dari ringkasan server (SELURUH data yang cocok filter,
	     bukan cuma yang udah ke-load). Diklik -> toggle filter status "Belum Lunas" (klik
	     lagi buat matiin) - pola & warna sama kayak kartu Aktif/Tidak Aktif di halaman
	     Pelanggan, biar konsisten & jelas kelihatan interaktif. -->
	<div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
		<button
			type="button"
			on:click={toggleBelumLunas}
			title="Klik buat nyaring transaksi Belum Lunas, klik lagi buat lihat semua"
			class="rounded-lg border-2 p-4 text-left transition-colors {$filters.status === 'Belum Lunas'
				? 'border-yellow-500 bg-yellow-50'
				: 'border-transparent bg-yellow-50/40 hover:bg-yellow-50'}"
		>
			<p class="text-sm text-yellow-700">Transaksi Belum Lunas</p>
			<p class="text-2xl font-bold text-yellow-800">{$summary.count}</p>
		</button>
		<button
			type="button"
			on:click={toggleBelumLunas}
			title="Klik buat nyaring transaksi Belum Lunas, klik lagi buat lihat semua"
			class="rounded-lg border-2 p-4 text-left transition-colors {$filters.status === 'Belum Lunas'
				? 'border-yellow-500 bg-yellow-50'
				: 'border-transparent bg-yellow-50/40 hover:bg-yellow-50'}"
		>
			<p class="text-sm text-yellow-700">Total Sisa Hutang</p>
			<p class="text-2xl font-bold text-yellow-800">
				{transactionHelpers.formatCurrency($summary.totalRemaining)}
			</p>
		</button>
	</div>

	<PaymentsFilter
		customers={$customers}
		on:filter={handleFilterChange}
		on:reset={handleFilterReset}
	/>

	{#if $isLoading && $debts.length === 0}
		<div class="flex h-64 items-center justify-center">
			<svg class="text-maroon-600 h-10 w-10 animate-spin" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
				></circle>
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				></path>
			</svg>
		</div>
	{:else if $error}
		<div class="border-l-4 border-red-600 bg-red-50 p-4">
			<p class="text-sm text-red-700">{$error}</p>
		</div>
	{:else}
		<PaymentsTable debts={joinedDebts} {canPay} on:payDebt={handlePayDebt} />

		<!-- Infinite scroll footer (server-side pagination) -->
		{#if $debts.length > 0}
			<div
				class="mt-4 rounded-lg border-t border-gray-200 bg-white px-4 py-3 text-center shadow sm:px-6"
			>
				<p class="text-sm text-gray-500">
					Menampilkan <span class="font-medium">{$debts.length}</span> dari
					<span class="font-medium">{$pagination.total}</span> transaksi
				</p>
				{#if $hasMore}
					<div
						use:infiniteScroll={{
							hasMore: $hasMore,
							onLoadMore: () => paymentActions.loadPage()
						}}
						class="mt-2 flex justify-center py-2"
					>
						<svg class="text-maroon-600 h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
					</div>
				{:else}
					<p class="mt-1 text-xs text-gray-400">Semua data sudah dimuat</p>
				{/if}
			</div>
		{/if}
	{/if}
</div>

{#if showPayModal && selectedDebt}
	<PayDebtModal
		transaction={selectedDebt}
		customerName={selectedDebt.customer_name}
		on:success={handlePaySuccess}
		on:cancel={() => (showPayModal = false)}
	/>
{/if}
