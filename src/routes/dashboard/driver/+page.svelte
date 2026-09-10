<!-- src/routes/dashboard/driver/+page.svelte -->
<!-- Dashboard khusus Driver - pengganti Dashboard Admin (yang disembunyikan buat role
     ini). Isinya 3 hal yang beneran relevan buat kerjaan lapangan Driver:
     1. Ringkasan Hari Ini - buat cocokin setoran akhir hari sama uang fisik di tangan.
     2. Prioritas Tagih - pelanggan dengan hutang paling menumpuk, biar tau siapa yang
        paling perlu didatangin duluan.
     3. Belum Transaksi Bulan Ini - pelanggan yang mungkin kelewat/lupa dikunjungi. -->
<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { api } from '$lib/services/api';
	import { auth } from '$lib/stores/auth';
	import { customers, activeCustomerIds, customerActions } from '$lib/stores/customers';

	let summary = null;
	let priorityDebts = [];
	let isLoading = true;
	let errors = []; // 🐛 fix (2026-09-10): dulu pakai Promise.all + 1 variabel `error` -
	// kalau 2 API gagal bersamaan, cuma 1 pesan yang kesimpen (nutupin yang satunya), dan
	// SELURUH halaman diganti banner merah walau data yang lain sebenernya berhasil dimuat.
	// Sekarang pakai Promise.allSettled - tiap panggilan API independen, kegagalan 1
	// gak bikin yang lain ikut gagal, dan semua pesan error ketampung (bukan cuma 1).
	let showAllInactive = false;

	onMount(async () => {
		const [summaryResult, priorityResult, customersResult, activityResult] =
			await Promise.allSettled([
				api.dashboard.getDriverSummary(),
				api.payments.getPriorityDebts(10),
				customerActions.loadCustomers(),
				customerActions.loadActivitySummary()
			]);

		const newErrors = [];

		if (summaryResult.status === 'fulfilled') {
			summary = summaryResult.value;
		} else {
			console.error('Failed to load driver summary:', summaryResult.reason);
			newErrors.push(
				`Ringkasan Hari Ini gagal dimuat: ${summaryResult.reason?.message || 'Terjadi kesalahan'}`
			);
		}

		if (priorityResult.status === 'fulfilled') {
			priorityDebts = priorityResult.value || [];
		} else {
			console.error('Failed to load priority debts:', priorityResult.reason);
			newErrors.push(
				`Prioritas Tagih gagal dimuat: ${priorityResult.reason?.message || 'Terjadi kesalahan'}`
			);
		}

		// customers & activity-summary dua-duanya nyuapin bagian "Belum Transaksi Bulan Ini" -
		// digabung jadi 1 pesan aja kalau salah satu/dua-duanya gagal (jangan 2 pesan
		// identik: itu bikin key `{#each}` bentrok).
		if (customersResult.status === 'rejected' || activityResult.status === 'rejected') {
			const reason =
				customersResult.reason?.message || activityResult.reason?.message || 'Terjadi kesalahan';
			console.error(
				'Failed to load customers/activity summary:',
				customersResult.reason || activityResult.reason
			);
			newErrors.push(`Belum Transaksi Bulan Ini gagal dimuat: ${reason}`);
		}

		errors = newErrors;
		isLoading = false;
	});

	// Pelanggan yang gak ada di daftar "aktif bulan ini" = belum ada transaksi bulan ini.
	$: belumTransaksiBulanIni = $activeCustomerIds
		? $customers.filter((c) => !$activeCustomerIds.includes(c.id))
		: [];
	$: visibleInactive = showAllInactive
		? belumTransaksiBulanIni
		: belumTransaksiBulanIni.slice(0, 8);

	function formatCurrency(amount) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(amount || 0);
	}

	function goToCustomer(id) {
		goto(`/dashboard/customers/${id}`);
	}

	function greeting() {
		const hour = new Date().getHours();
		if (hour < 12) return 'Selamat pagi';
		if (hour < 18) return 'Selamat siang';
		return 'Selamat malam';
	}

	function displayName(username) {
		if (!username) return '';
		return username.charAt(0).toUpperCase() + username.slice(1);
	}
</script>

<div class="p-6">
	<!-- Greeting Header -->
	<div class="mb-6">
		<h1 class="text-2xl font-semibold text-gray-900">
			{greeting()}, {displayName($auth.user?.username)}
		</h1>
		<p class="text-gray-500">
			{new Date().toLocaleDateString('id-ID', {
				weekday: 'long',
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			})}
		</p>
	</div>

	{#if isLoading}
		<div class="flex h-64 items-center justify-center">
			<svg
				class="text-maroon-600 h-10 w-10 animate-spin"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
			>
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
				></circle>
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				></path>
			</svg>
		</div>
	{:else}
		{#if errors.length > 0}
			<!-- Sebagian data gagal dimuat - tetap tampilkan data yang berhasil di bawah,
			     jangan ganti seluruh halaman jadi banner error (lihat catatan onMount). -->
			<div class="mb-6 border-l-4 border-red-600 bg-red-50 p-4">
				<p class="text-sm font-medium text-red-800">Sebagian data gagal dimuat:</p>
				<ul class="mt-1 list-disc space-y-0.5 pl-5 text-sm text-red-700">
					{#each errors as err, i (i)}
						<li>{err}</li>
					{/each}
				</ul>
			</div>
		{/if}

		<!-- Ringkasan Hari Ini -->
		<div class="mb-6 rounded-lg bg-white p-6 shadow">
			<h2 class="mb-4 text-lg font-semibold">Ringkasan Hari Ini</h2>

			<!-- Total uang yang harus disetor - kartu utama, paling nonjol -->
			<div class="bg-maroon-700 mb-4 rounded-lg p-5 text-white">
				<p class="text-sm text-white/80">Total Uang Terkumpul Hari Ini</p>
				<p class="mt-1 text-3xl font-bold">{formatCurrency(summary?.total_cash_collected)}</p>
				<p class="mt-1 text-xs text-white/70">Cocokkan dengan uang fisik di tangan sebelum setor</p>
			</div>

			<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
				<div class="rounded-lg border border-gray-200 p-4">
					<p class="text-sm text-gray-500">Transaksi Hari Ini</p>
					<p class="text-2xl font-semibold">{summary?.total_transactions || 0}</p>
				</div>
				<div class="rounded-lg border border-gray-200 p-4">
					<p class="text-sm text-gray-500">Galon Terkirim</p>
					<p class="text-2xl font-semibold">{summary?.total_gallons_filled || 0}</p>
				</div>
				<div class="rounded-lg border border-gray-200 p-4">
					<p class="text-sm text-gray-500">Dari Transaksi Baru</p>
					<p class="text-xl font-semibold">{formatCurrency(summary?.cash_from_transactions)}</p>
				</div>
				<div class="rounded-lg border border-gray-200 p-4">
					<p class="text-sm text-gray-500">
						Dari Tagih Hutang <span class="text-gray-400"
							>({summary?.total_debt_payments || 0}x)</span
						>
					</p>
					<p class="text-xl font-semibold">{formatCurrency(summary?.cash_from_debt_payments)}</p>
				</div>
			</div>
		</div>

		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<!-- Prioritas Tagih -->
			<div class="rounded-lg bg-white p-6 shadow">
				<h2 class="mb-1 text-lg font-semibold">Prioritas Tagih</h2>
				<p class="mb-4 text-sm text-gray-500">Pelanggan dengan hutang paling menumpuk</p>

				{#if priorityDebts.length === 0}
					<p class="py-6 text-center text-sm text-gray-400">
						Gak ada pelanggan yang punya hutang 🎉
					</p>
				{:else}
					<ul class="divide-y divide-gray-100">
						{#each priorityDebts as debt (debt.customer_id)}
							<li>
								<button
									type="button"
									on:click={() => goToCustomer(debt.customer_id)}
									class="flex w-full items-center justify-between gap-3 py-3 text-left transition hover:bg-gray-50"
								>
									<div class="min-w-0">
										<p class="truncate font-medium text-gray-900">{debt.customer_name}</p>
										<p class="text-xs text-gray-500">
											{debt.debt_count} transaksi belum lunas
											{#if debt.whatsapp_number}
												· {debt.whatsapp_number}
											{/if}
										</p>
									</div>
									<span
										class="shrink-0 rounded bg-yellow-100 px-2 py-1 text-sm font-semibold text-yellow-800"
									>
										{formatCurrency(debt.total_debt)}
									</span>
								</button>
							</li>
						{/each}
					</ul>
				{/if}
			</div>

			<!-- Belum Transaksi Bulan Ini -->
			<div class="rounded-lg bg-white p-6 shadow">
				<h2 class="mb-1 text-lg font-semibold">Belum Transaksi Bulan Ini</h2>
				<p class="mb-4 text-sm text-gray-500">
					{belumTransaksiBulanIni.length} pelanggan belum ada transaksi bulan ini
				</p>

				{#if belumTransaksiBulanIni.length === 0}
					<p class="py-6 text-center text-sm text-gray-400">
						Semua pelanggan sudah transaksi bulan ini 🎉
					</p>
				{:else}
					<ul class="divide-y divide-gray-100">
						{#each visibleInactive as customer (customer.id)}
							<li>
								<button
									type="button"
									on:click={() => goToCustomer(customer.id)}
									class="flex w-full items-center justify-between gap-3 py-3 text-left transition hover:bg-gray-50"
								>
									<div class="min-w-0">
										<p class="truncate font-medium text-gray-900">
											{customer.title ? `${customer.title} ` : ''}{customer.customer_name}
										</p>
										<p class="truncate text-xs text-gray-500">{customer.address || '-'}</p>
									</div>
									{#if customer.whatsapp_number}
										<span class="shrink-0 text-xs text-gray-500">{customer.whatsapp_number}</span>
									{/if}
								</button>
							</li>
						{/each}
					</ul>

					{#if belumTransaksiBulanIni.length > 8}
						<button
							type="button"
							on:click={() => (showAllInactive = !showAllInactive)}
							class="text-maroon-700 mt-3 text-sm font-medium hover:underline"
						>
							{showAllInactive
								? 'Tampilkan lebih sedikit'
								: `Tampilkan semua (${belumTransaksiBulanIni.length})`}
						</button>
					{/if}
				{/if}
			</div>
		</div>
	{/if}
</div>
