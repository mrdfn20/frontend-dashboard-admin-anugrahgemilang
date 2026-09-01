<!-- src/lib/components/transactions/TransactionForm.svelte -->
<script>
	import { onMount, createEventDispatcher } from 'svelte';
	import { transactionActions } from '$lib/stores/transactions.js';
	import { api } from '$lib/services/api.js';
	import { selectOnFocus } from '$lib/actions/selectOnFocus.js';
	import CurrencyInput from '$lib/components/ui/CurrencyInput.svelte';

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

	let formData = {
		customer_id: '',
		gallon_filled: 0,
		gallon_empty: 0,
		gallon_returned: 0,
		transaction_type: 'Tunai',
		armada_id: '',
		payment_amount: 0
	};

	let errors = {};
	let isSubmitting = false;

	// ===== Autosuggest Pelanggan (ganti dropdown, biar gampang cari di data banyak) =====
	let customerQuery = '';
	let selectedCustomer = null;
	let showSuggestions = false;

	const currencyFormatter = new Intl.NumberFormat('id-ID');
	function formatRp(value) {
		return `Rp ${currencyFormatter.format(Math.round(value || 0))}`;
	}

	$: filteredSuggestions = (() => {
		const q = customerQuery.trim().toLowerCase();
		if (!q) return [];
		return customers
			.filter((c) => String(c.id).includes(q) || (c.customer_name || '').toLowerCase().includes(q))
			.slice(0, 20);
	})();

	function handleCustomerInput() {
		showSuggestions = true;
		// Kalau teks diubah manual setelah sebelumnya sudah pilih pelanggan, batalkan pilihan
		// biar customer_id yang dikirim gak pernah nyasar ke pelanggan yang salah.
		if (selectedCustomer && customerQuery !== selectedCustomer.customer_name) {
			selectedCustomer = null;
			formData.customer_id = '';
		}
	}

	function selectCustomer(customer) {
		selectedCustomer = customer;
		formData.customer_id = customer.id;
		customerQuery = customer.customer_name;
		showSuggestions = false;
	}

	function handleCustomerBlur() {
		// Delay dikit supaya klik di item suggestion sempat ketangkep dulu sebelum list ditutup
		setTimeout(() => (showSuggestions = false), 150);
	}

	// ===== Estimasi total & penjelasan Tunai/Hutang =====
	$: estimatedTotal = selectedCustomer
		? (Number(selectedCustomer.price) || 0) * (Number(formData.gallon_filled) || 0)
		: 0;

	$: paymentHint = (() => {
		if (formData.transaction_type !== 'Hutang' || !selectedCustomer) return null;
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
				transaction_type: formData.transaction_type,
				armada_id: parseInt(formData.armada_id),
				// Transaksi Tunai selalu lunas otomatis di BE, payment_amount diabaikan
				payment_amount:
					formData.transaction_type === 'Tunai' ? 0 : parseFloat(formData.payment_amount)
			};

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
<div class="fixed inset-0 z-50 overflow-y-auto">
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
							<input
								id="customer_search"
								type="text"
								autocomplete="off"
								bind:value={customerQuery}
								on:input={handleCustomerInput}
								on:focus={() => (showSuggestions = true)}
								on:blur={handleCustomerBlur}
								placeholder="Ketik ID atau nama pelanggan..."
								class="focus:border-maroon-500 focus:ring-maroon-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
								class:border-red-300={errors.customer_id}
							/>
							{#if showSuggestions && filteredSuggestions.length > 0}
								<ul
									class="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg"
								>
									{#each filteredSuggestions as customer (customer.id)}
										<li>
											<button
												type="button"
												on:click={() => selectCustomer(customer)}
												class="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50"
											>
												<span class="text-gray-900">
													#{customer.id} - {customer.customer_name}
												</span>
												<span class="text-maroon-600 ml-2 shrink-0 font-medium">
													{formatRp(customer.price)}/galon
												</span>
											</button>
										</li>
									{/each}
								</ul>
							{:else if showSuggestions && customerQuery.trim() && filteredSuggestions.length === 0}
								<div
									class="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 shadow-lg"
								>
									Tidak ada pelanggan yang cocok
								</div>
							{/if}
							{#if selectedCustomer}
								<p class="mt-1 text-xs text-gray-500">
									Harga galon pelanggan ini: {formatRp(selectedCustomer.price)}
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

						<!-- Galon Kembali -->
						<div>
							<label for="gallon_returned" class="block text-sm font-medium text-gray-700">
								Galon Kembali <span class="text-red-500">*</span>
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

						<!-- Jenis Transaksi -->
						<div class="md:col-span-2">
							<span class="block text-sm font-medium text-gray-700">
								Jenis Transaksi <span class="text-red-500">*</span>
							</span>
							<div class="mt-1 flex gap-4">
								<label class="flex items-center gap-2 text-sm text-gray-700">
									<input
										type="radio"
										bind:group={formData.transaction_type}
										value="Tunai"
										class="text-maroon-600 focus:ring-maroon-500"
									/>
									Tunai (lunas otomatis)
								</label>
								<label class="flex items-center gap-2 text-sm text-gray-700">
									<input
										type="radio"
										bind:group={formData.transaction_type}
										value="Hutang"
										class="text-maroon-600 focus:ring-maroon-500"
									/>
									Hutang / Nominal Custom
								</label>
							</div>
							<p class="mt-1 text-xs text-gray-500">
								Pilih <strong>Tunai</strong> kalau pelanggan langsung lunas penuh saat ini juga.
								Pilih
								<strong>Hutang</strong> kalau nominal bayarnya beda dari total tagihan - baik itu kurang
								(jadi hutang), pas, maupun lebih (kelebihannya otomatis masuk saldo pelanggan).
							</p>
						</div>

						<!-- Jumlah Bayar (hanya utk Hutang) -->
						{#if formData.transaction_type === 'Hutang'}
							<div class="md:col-span-2">
								<label for="payment_amount" class="block text-sm font-medium text-gray-700">
									Jumlah Bayar <span class="text-red-500">*</span>
								</label>
								<CurrencyInput
									id="payment_amount"
									bind:value={formData.payment_amount}
									placeholder="0"
									hasError={!!errors.payment_amount}
								/>
								<p class="mt-1 text-xs text-gray-500">
									Kosongkan / isi 0 kalau pelanggan belum bayar sama sekali.
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
						{/if}
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
