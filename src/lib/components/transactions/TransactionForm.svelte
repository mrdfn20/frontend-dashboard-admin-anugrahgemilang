<!-- src/lib/components/transactions/TransactionForm.svelte -->
<script>
	import { lockBodyScroll } from '$lib/actions/lockBodyScroll.js';
	import { sidebarOffsetClass } from '$lib/stores/sidebar.js';
	import { onMount, createEventDispatcher } from 'svelte';
	import { transactionActions } from '$lib/stores/transactions.js';
	import { api } from '$lib/services/api.js';
	import { selectOnFocus } from '$lib/actions/selectOnFocus.js';
	import CurrencyInput from '$lib/components/ui/CurrencyInput.svelte';
	import Autosuggest from '$lib/components/ui/Autosuggest.svelte';

	// Props
	export let customers = [];

	const dispatch = createEventDispatcher();

	// Armada di-fetch dari GET /armadas (Kelola Armada) - fallback ke 3 opsi lama
	// kalau fetch gagal, biar form tetap kepake walau ada masalah jaringan sesaat.
	let armadaOptions = [
		{ id: 1, armada_name: 'Pickup APV' },
		{ id: 2, armada_name: 'Pickup Grandmax' },
		{ id: 3, armada_name: 'Pickup Viar' }
	];

	onMount(async () => {
		try {
			const data = await api.armadas.getAll();
			if (Array.isArray(data) && data.length > 0) {
				armadaOptions = data;
			}
		} catch (err) {
			console.error('Failed to load armadas, using fallback list:', err);
		}
	});

	// 🆕 Gak ada lagi pilihan "Jenis Transaksi" Tunai/Hutang di depan - dulu bikin bingung
	// admin pas pelanggan bayar tunai TAPI lebih (harus milih "Hutang" walau sebenernya
	// lunas). Sekarang cuma 1 field "Jumlah Dibayar" (auto keisi = estimasi total),
	// backend yang otomatis nentuin status akhir (Tunai/Hutang) dari nominalnya - persis
	// pola yang sama kayak PayDebtModal. Selalu dikirim transaction_type: 'Hutang' ke API,
	// backend upgrade jadi 'Tunai' sendiri kalau amount_paid >= total_price.
	// 🆕 Tanggal transaksi - defaultnya HARI INI, bisa diubah manual buat backdate transaksi
	// yang telat dicatat. `todayStr` dipakai 2x: nilai awal field ini, dan buat `max` di
	// date picker (gak boleh pilih tanggal masa depan). Selama field ini gak diubah dari
	// default-nya, transaction_date SENGAJA gak dikirim ke API sama sekali (lihat
	// handleSubmit) - biar transaksi normal (gak backdate) tetap kecatat pakai jam PERSIS
	// saat itu (NOW() di backend), bukan "hari ini jam 00:00:00".
	const todayStr = new Date().toISOString().slice(0, 10);

	let formData = {
		customer_id: '',
		gallon_filled: 0,
		gallon_empty: 0,
		gallon_returned: 0,
		armada_id: '',
		payment_amount: 0,
		transaction_date: todayStr
	};

	let errors = {};
	let isSubmitting = false;

	// ===== Autosuggest Pelanggan (ganti dropdown, biar gampang cari di data banyak) =====
	let customerQuery = '';
	let selectedCustomer = null;
	let customerBalance = null;

	const currencyFormatter = new Intl.NumberFormat('id-ID');
	function formatRp(value) {
		return `Rp ${currencyFormatter.format(Math.round(value || 0))}`;
	}

	function customerFilter(c, q) {
		return String(c.id).includes(q) || (c.customer_name || '').toLowerCase().includes(q);
	}

	function handleCustomerInput() {
		// Kalau teks diubah manual setelah sebelumnya sudah pilih pelanggan, batalkan pilihan
		// biar customer_id yang dikirim gak pernah nyasar ke pelanggan yang salah.
		if (selectedCustomer && customerQuery !== selectedCustomer.customer_name) {
			selectedCustomer = null;
			formData.customer_id = '';
			customerBalance = null;
		}
	}

	async function selectCustomer(customer) {
		selectedCustomer = customer;
		formData.customer_id = customer.id;
		customerQuery = customer.customer_name;

		customerBalance = null;
		try {
			const balance = await api.customerBalance.getById(customer.id);
			customerBalance = balance?.balance || 0;
		} catch {
			// 404 = belum pernah ada saldo, dianggap 0 - bukan error blocking
			customerBalance = 0;
		}
	}

	// ===== Estimasi total & penjelasan status pembayaran =====
	$: estimatedTotal = selectedCustomer
		? (Number(selectedCustomer.price) || 0) * (Number(formData.gallon_filled) || 0)
		: 0;

	// 🆕 Jumlah Dibayar auto-ngikutin estimasi total (kasus paling umum: bayar pas,
	// gak perlu ngetik apa-apa) - TAPI berhenti "ngikutin" begitu admin ngetik manual
	// nominal yang beda dari estimasi saat itu, biar gak nimpa ketikan orang.
	let previousEstimatedTotal = 0;
	$: {
		if (Number(formData.payment_amount) === previousEstimatedTotal) {
			formData.payment_amount = estimatedTotal;
		}
		previousEstimatedTotal = estimatedTotal;
	}

	$: paymentHint = (() => {
		if (!selectedCustomer) return null;
		const nominal = Number(formData.payment_amount) || 0;
		if (nominal <= 0) {
			return {
				type: 'info',
				text: `Belum bayar sama sekali → seluruh ${formatRp(estimatedTotal)} tercatat sebagai hutang.`
			};
		}
		if (nominal < estimatedTotal) {
			return {
				type: 'info',
				text: `Kurang ${formatRp(estimatedTotal - nominal)} → sisanya tercatat sebagai hutang.`
			};
		}
		if (nominal === estimatedTotal) {
			return { type: 'success', text: 'Pas → transaksi otomatis berstatus Lunas (Tunai).' };
		}
		return {
			type: 'success',
			text: `Lebih ${formatRp(nominal - estimatedTotal)} → kelebihannya otomatis masuk sebagai Saldo Pelanggan.`
		};
	})();

	function validateForm() {
		errors = {};

		if (!selectedCustomer || !formData.customer_id)
			errors.customer_id = 'Pelanggan wajib dipilih dari daftar';
		if (formData.gallon_filled === '' || formData.gallon_filled < 0)
			errors.gallon_filled = 'Galon isi wajib diisi (>= 0)';
		if (formData.gallon_empty === '' || formData.gallon_empty < 0)
			errors.gallon_empty = 'Galon kosong wajib diisi (>= 0)';
		if (formData.gallon_returned === '' || formData.gallon_returned < 0)
			errors.gallon_returned = 'Galon kembali wajib diisi (>= 0)';
		if (!formData.armada_id) errors.armada_id = 'Armada wajib dipilih';
		if (formData.payment_amount === '' || formData.payment_amount < 0)
			errors.payment_amount = 'Jumlah bayar wajib diisi (>= 0)';
		if (!formData.transaction_date) errors.transaction_date = 'Tanggal transaksi wajib diisi';
		else if (formData.transaction_date > todayStr)
			errors.transaction_date = 'Tanggal transaksi tidak boleh di masa depan';

		return Object.keys(errors).length === 0;
	}

	async function handleSubmit() {
		if (!validateForm()) return;

		isSubmitting = true;
		try {
			const payload = {
				customer_id: parseInt(formData.customer_id),
				gallon_filled: parseInt(formData.gallon_filled),
				gallon_empty: parseInt(formData.gallon_empty),
				gallon_returned: parseInt(formData.gallon_returned),
				// Selalu 'Hutang' - backend yang otomatis upgrade ke 'Tunai' kalau
				// payment_amount >= total_price (lihat catatan di deklarasi formData).
				transaction_type: 'Hutang',
				armada_id: parseInt(formData.armada_id),
				payment_amount: parseFloat(formData.payment_amount) || 0
			};

			// Cuma dikirim kalau BEDA dari hari ini (backdate beneran) - lihat catatan di
			// deklarasi todayStr soal kenapa gak selalu dikirim.
			if (formData.transaction_date !== todayStr) {
				payload.transaction_date = formData.transaction_date;
			}

			await transactionActions.createTransaction(payload);
			dispatch('success');
		} catch (error) {
			// Error sudah ditoast oleh store
			console.error('Form submission error:', error);
		} finally {
			isSubmitting = false;
		}
	}

	function handleCancel() {
		dispatch('cancel');
	}
</script>

<!-- Modal Overlay -->
<div class="fixed inset-0 z-50 overflow-y-auto {$sidebarOffsetClass}" use:lockBodyScroll>
	<div class="flex min-h-screen items-center justify-center px-4 py-6">
		<div
			class="fixed inset-0 bg-white/20 backdrop-blur-md transition-all duration-300"
			on:click={handleCancel}
			role="presentation"
		></div>

		<!-- Modal panel -->
		<div class="relative w-full max-w-xl transform rounded-lg bg-white shadow-xl transition-all">
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
				<h3 class="text-lg font-medium text-gray-900">Tambah Transaksi Baru</h3>
				<button on:click={handleCancel} class="text-gray-400 hover:text-gray-600">
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<!-- Form -->
			<form on:submit|preventDefault={handleSubmit}>
				<div class="max-h-[28rem] overflow-y-auto px-6 py-4">
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<!-- Pelanggan (autosuggest, ketik id atau nama) -->
						<div class="relative md:col-span-2">
							<label for="customer_search" class="block text-sm font-medium text-gray-700">
								Pelanggan <span class="text-red-500">*</span>
							</label>
							<Autosuggest
								id="customer_search"
								bind:value={customerQuery}
								items={customers}
								getLabel={(c) => c.customer_name}
								getKey={(c) => c.id}
								filterFn={customerFilter}
								placeholder="Ketik ID atau nama pelanggan..."
								inputClass="focus:border-maroon-500 focus:ring-maroon-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
								hasError={!!errors.customer_id}
								noResultsText="Tidak ada pelanggan yang cocok"
								on:input={handleCustomerInput}
								on:select={(e) => selectCustomer(e.detail)}
							>
								<svelte:fragment slot="item" let:item>
									<span class="text-gray-900">
										#{item.id} - {item.customer_name}
									</span>
									<span class="text-maroon-600 ml-2 shrink-0 font-medium">
										{formatRp(item.price)}/galon
									</span>
								</svelte:fragment>
							</Autosuggest>
							{#if selectedCustomer}
								<p class="mt-1 text-xs text-gray-500">
									Harga galon pelanggan ini: {formatRp(selectedCustomer.price)} · Saldo: {customerBalance ===
									null
										? 'memuat...'
										: formatRp(customerBalance)}
								</p>
							{/if}
							{#if errors.customer_id}
								<p class="mt-1 text-sm text-red-600">{errors.customer_id}</p>
							{/if}
						</div>

						<!-- Galon Isi -->
						<div>
							<label for="gallon_filled" class="block text-sm font-medium text-gray-700">
								Galon Isi <span class="text-red-500">*</span>
							</label>
							<input
								id="gallon_filled"
								type="number"
								min="0"
								bind:value={formData.gallon_filled}
								use:selectOnFocus
								class="focus:border-maroon-500 focus:ring-maroon-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
								class:border-red-300={errors.gallon_filled}
							/>
							{#if errors.gallon_filled}
								<p class="mt-1 text-sm text-red-600">{errors.gallon_filled}</p>
							{/if}
						</div>

						<!-- Galon Kosong -->
						<div>
							<label for="gallon_empty" class="block text-sm font-medium text-gray-700">
								Galon Kosong Diambil <span class="text-red-500">*</span>
							</label>
							<input
								id="gallon_empty"
								type="number"
								min="0"
								bind:value={formData.gallon_empty}
								use:selectOnFocus
								class="focus:border-maroon-500 focus:ring-maroon-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
								class:border-red-300={errors.gallon_empty}
							/>
							{#if errors.gallon_empty}
								<p class="mt-1 text-sm text-red-600">{errors.gallon_empty}</p>
							{/if}
						</div>

						<!-- Galon Retur -->
						<div>
							<label for="gallon_returned" class="block text-sm font-medium text-gray-700">
								Galon Retur <span class="text-red-500">*</span>
							</label>
							<input
								id="gallon_returned"
								type="number"
								min="0"
								bind:value={formData.gallon_returned}
								use:selectOnFocus
								class="focus:border-maroon-500 focus:ring-maroon-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
								class:border-red-300={errors.gallon_returned}
							/>
							{#if errors.gallon_returned}
								<p class="mt-1 text-sm text-red-600">{errors.gallon_returned}</p>
							{/if}
						</div>

						<!-- Armada -->
						<div>
							<label for="armada_id" class="block text-sm font-medium text-gray-700">
								Armada <span class="text-red-500">*</span>
							</label>
							<select
								id="armada_id"
								bind:value={formData.armada_id}
								class="focus:border-maroon-500 focus:ring-maroon-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
								class:border-red-300={errors.armada_id}
							>
								<option value="">Pilih Armada</option>
								{#each armadaOptions as armada (armada.id)}
									<option value={armada.id}>{armada.armada_name}</option>
								{/each}
							</select>
							{#if errors.armada_id}
								<p class="mt-1 text-sm text-red-600">{errors.armada_id}</p>
							{/if}
						</div>

						<!-- Tanggal Transaksi - default hari ini, bisa diubah buat backdate -->
						<div>
							<label for="transaction_date" class="block text-sm font-medium text-gray-700">
								Tanggal Transaksi <span class="text-red-500">*</span>
							</label>
							<input
								id="transaction_date"
								type="date"
								max={todayStr}
								bind:value={formData.transaction_date}
								class="focus:border-maroon-500 focus:ring-maroon-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
								class:border-red-300={errors.transaction_date}
							/>
							{#if formData.transaction_date && formData.transaction_date !== todayStr}
								<p class="mt-1 text-xs text-amber-600">
									Backdate - dicatat buat tanggal ini, bukan hari ini.
								</p>
							{/if}
							{#if errors.transaction_date}
								<p class="mt-1 text-sm text-red-600">{errors.transaction_date}</p>
							{/if}
						</div>

						<!-- Estimasi Total Tagihan -->
						{#if selectedCustomer && formData.gallon_filled > 0}
							<div class="rounded-md bg-gray-50 px-3 py-2 md:col-span-2">
								<p class="text-sm text-gray-600">
									Estimasi Total Tagihan: <span class="font-semibold text-gray-900"
										>{formatRp(estimatedTotal)}</span
									>
								</p>
							</div>
						{/if}

						<!-- Jumlah Dibayar - satu-satunya input, auto keisi = estimasi total, backend
						     yang nentuin status Tunai/Hutang akhir dari nominal ini -->
						<div class="md:col-span-2">
							<label for="payment_amount" class="block text-sm font-medium text-gray-700">
								Jumlah Dibayar <span class="text-red-500">*</span>
							</label>
							<CurrencyInput
								id="payment_amount"
								bind:value={formData.payment_amount}
								placeholder="0"
								hasError={!!errors.payment_amount}
							/>
							<p class="mt-1 text-xs text-gray-500">
								Udah keisi otomatis = estimasi total tagihan (anggap bayar pas/lunas) - tinggal ubah
								kalau nominalnya beda: <strong>kurang dari itu</strong> = sisanya jadi hutang,
								<strong>kosongkan/isi 0</strong> = belum bayar sama sekali,
								<strong>lebih dari itu</strong> = kelebihannya otomatis masuk Saldo Pelanggan.
							</p>
							{#if paymentHint}
								<p
									class="mt-1 text-xs font-medium {paymentHint.type === 'success'
										? 'text-green-600'
										: 'text-amber-600'}"
								>
									{paymentHint.text}
								</p>
							{/if}
							{#if errors.payment_amount}
								<p class="mt-1 text-sm text-red-600">{errors.payment_amount}</p>
							{/if}
						</div>
					</div>
				</div>

				<!-- Footer -->
				<div class="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
					<button
						type="button"
						on:click={handleCancel}
						disabled={isSubmitting}
						class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
					>
						Batal
					</button>
					<button
						type="submit"
						disabled={isSubmitting}
						class="bg-maroon-600 hover:bg-maroon-700 rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm disabled:opacity-50"
					>
						{#if isSubmitting}
							<svg class="mr-2 inline h-4 w-4 animate-spin" viewBox="0 0 24 24">
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
							Menyimpan...
						{:else}
							Simpan
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
</div>

<style>
	:global(.bg-maroon-600) {
		background-color: #800020;
	}
	:global(.hover\:bg-maroon-700:hover) {
		background-color: #600018;
	}
	:global(.focus\:border-maroon-500:focus) {
		border-color: #800020;
	}
	:global(.focus\:ring-maroon-500:focus) {
		--tw-ring-color: rgba(128, 0, 32, 0.5);
	}
</style>
