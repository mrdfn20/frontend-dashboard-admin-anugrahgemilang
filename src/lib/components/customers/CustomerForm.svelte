<!-- src/lib/components/customers/CustomerForm.svelte -->
<script>
	import { lockBodyScroll } from '$lib/actions/lockBodyScroll.js';
	import { sidebarOffsetClass } from '$lib/stores/sidebar.js';
	import { createEventDispatcher, onMount } from 'svelte';
	import { customerActions } from '$lib/stores/customers.js';
	import { validateCustomer, defaultCustomer, cleanCustomerData } from '$lib/models/customer.js';
	import { selectOnFocus } from '$lib/actions/selectOnFocus.js';
	import { regions, subRegions, regionActions } from '$lib/stores/regions.js';

	// Props
	export let customer = null; // null for add, object for edit

	// Event dispatcher
	const dispatch = createEventDispatcher();

	// API bisa balikin date_of_birth/subscription_date sbg ISO datetime penuh
	// ("1996-10-20T00:00:00.000Z") - <input type="date"> cuma nerima "yyyy-MM-dd",
	// kalau gak dipotong browser diam2 nolak nampilin nilainya (field keliatan kosong).
	function toDateInputValue(value) {
		if (!value) return value;
		return String(value).slice(0, 10);
	}

	// Form state
	let formData = customer
		? {
				...customer,
				date_of_birth: toDateInputValue(customer.date_of_birth),
				subscription_date: toDateInputValue(customer.subscription_date)
			}
		: { ...defaultCustomer };
	let errors = {};
	let isSubmitting = false;
	let isEdit = !!customer;

	// 🆕 Kecamatan (region) cuma bantuan UI buat nyempitin dropdown Sub-Wilayah - yang
	// beneran dikirim ke API cuma formData.sub_region_id. Kalau edit pelanggan yang udah
	// punya sub_region_id, region induknya ditebak begitu daftar subRegions ke-load.
	let selectedRegionId = '';
	let regionGuessedFromExisting = false;
	$: if (isEdit && !regionGuessedFromExisting && formData.sub_region_id && $subRegions.length > 0) {
		const sr = $subRegions.find((s) => s.id === Number(formData.sub_region_id));
		if (sr) selectedRegionId = String(sr.region_id);
		regionGuessedFromExisting = true;
	}

	$: visibleSubRegions = selectedRegionId
		? $subRegions.filter((sr) => sr.region_id === Number(selectedRegionId))
		: $subRegions;

	// Reset pilihan sub-wilayah kalau region diganti dan pilihan lama gak relevan lagi
	let previousSelectedRegionId = '';
	$: {
		if (selectedRegionId !== previousSelectedRegionId) {
			previousSelectedRegionId = selectedRegionId;
			if (
				formData.sub_region_id &&
				!visibleSubRegions.some((sr) => sr.id === Number(formData.sub_region_id))
			) {
				formData.sub_region_id = '';
			}
		}
	}

	onMount(() => {
		regionActions.loadAll();
	});

	// Form options (these would typically come from API or store)
	const titleOptions = ['BAPAK', 'IBU'];
	const customerTypeOptions = [
		{ id: 1, name: 'Pelanggan Akhir (Rumah)' },
		{ id: 2, name: 'Warung/Distributor' },
		{ id: 3, name: 'Pabrik' }
	];
	const gallonPriceOptions = [
		{ id: 'gw0', name: 'Gallon Weru 19L Rp 0' },
		{ id: 'gw5', name: 'Gallon Weru 19L Rp 5.000' },
		{ id: 'gw6', name: 'Gallon Weru 19L Rp 6.000' },
		{ id: 'gw7', name: 'Gallon Weru 19L Rp 7.000' },
		{ id: 'gw7.5', name: 'Gallon Weru 19L Rp 7.500' },
		{ id: 'gw8', name: 'Gallon Weru 19L Rp 8.000' },
		{ id: 'gw9', name: 'Gallon Weru 19L Rp 9.000' },
		{ id: 'gw10', name: 'Gallon Weru 19L Rp 10.000' },
		{ id: 'gw11', name: 'Gallon Weru 19L Rp 11.000' },
		{ id: 'gw12', name: 'Gallon Weru 19L Rp 12.000' }
	];

	// Form validation
	function validateForm() {
		const validation = validateCustomer(formData);
		errors = validation.errors;
		return validation.isValid;
	}

	// Handle form submission
	async function handleSubmit() {
		if (!validateForm()) return;

		isSubmitting = true;
		try {
			const cleanData = cleanCustomerData(formData);

			if (isEdit) {
				await customerActions.updateCustomer(customer.id, cleanData);
			} else {
				await customerActions.createCustomer(cleanData);
			}

			dispatch('success'); // Modal will close
		} catch (error) {
			// Error already handled by toast in store
			console.error('Form submission error:', error);
		} finally {
			isSubmitting = false;
		}
	}

	function handleCancel() {
		dispatch('cancel');
	}

	// Real-time validation
	$: {
		if (Object.keys(errors).length > 0) {
			validateForm();
		}
	}
</script>

<!-- Modal Overlay -->
<div
	class="fixed top-0 right-0 bottom-0 z-50 overflow-y-auto {$sidebarOffsetClass}"
	use:lockBodyScroll
>
	<div class="flex min-h-screen items-center justify-center px-4 py-6">
		<!-- Background overlay -->
		<div
			class="fixed inset-0 bg-white/20 backdrop-blur-md transition-all duration-300"
			on:click={handleCancel}
		></div>

		<!-- Modal panel -->
		<div class="relative w-full max-w-2xl transform rounded-lg bg-white shadow-xl transition-all">
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
				<h3 class="text-lg font-medium text-gray-900">
					{isEdit ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}
				</h3>
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
				<div class="max-h-96 overflow-y-auto px-6 py-4">
					<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
						<!-- Title -->
						<div>
							<label for="title" class="block text-sm font-medium text-gray-700">
								Gelar <span class="text-red-500">*</span>
							</label>
							<select
								id="title"
								bind:value={formData.title}
								class="focus:border-maroon-500 focus:ring-maroon-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
								class:border-red-300={errors.title}
							>
								<option value="">Pilih Gelar</option>
								{#each titleOptions as title (title)}
									<option value={title}>{title}</option>
								{/each}
							</select>
							{#if errors.title}
								<p class="mt-1 text-sm text-red-600">{errors.title}</p>
							{/if}
						</div>

						<!-- Customer Name -->
						<div>
							<label for="customer_name" class="block text-sm font-medium text-gray-700">
								Nama Lengkap <span class="text-red-500">*</span>
							</label>
							<input
								id="customer_name"
								type="text"
								bind:value={formData.customer_name}
								placeholder="Masukkan nama lengkap"
								class="focus:border-maroon-500 focus:ring-maroon-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
								class:border-red-300={errors.customer_name}
							/>
							{#if errors.customer_name}
								<p class="mt-1 text-sm text-red-600">{errors.customer_name}</p>
							{/if}
						</div>

						<!-- Date of Birth -->
						<div>
							<label for="date_of_birth" class="block text-sm font-medium text-gray-700">
								Tanggal Lahir
							</label>
							<input
								id="date_of_birth"
								type="date"
								bind:value={formData.date_of_birth}
								class="focus:border-maroon-500 focus:ring-maroon-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
								class:border-red-300={errors.date_of_birth}
							/>
							{#if errors.date_of_birth}
								<p class="mt-1 text-sm text-red-600">{errors.date_of_birth}</p>
							{/if}
						</div>

						<!-- WhatsApp Number -->
						<div>
							<label for="whatsapp_number" class="block text-sm font-medium text-gray-700">
								Nomor WhatsApp
							</label>
							<input
								id="whatsapp_number"
								type="tel"
								bind:value={formData.whatsapp_number}
								placeholder="08123456789"
								class="focus:border-maroon-500 focus:ring-maroon-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
								class:border-red-300={errors.whatsapp_number}
							/>
							{#if errors.whatsapp_number}
								<p class="mt-1 text-sm text-red-600">{errors.whatsapp_number}</p>
							{/if}
						</div>

						<!-- Address -->
						<div class="md:col-span-2">
							<label for="address" class="block text-sm font-medium text-gray-700">
								Alamat <span class="text-red-500">*</span>
							</label>
							<textarea
								id="address"
								bind:value={formData.address}
								rows="3"
								placeholder="Masukkan alamat lengkap"
								class="focus:border-maroon-500 focus:ring-maroon-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
								class:border-red-300={errors.address}
							></textarea>
							{#if errors.address}
								<p class="mt-1 text-sm text-red-600">{errors.address}</p>
							{/if}
						</div>

						<!-- Customer Type -->
						<div>
							<label for="customer_type_id" class="block text-sm font-medium text-gray-700">
								Tipe Pelanggan <span class="text-red-500">*</span>
							</label>
							<select
								id="customer_type_id"
								bind:value={formData.customer_type_id}
								class="focus:border-maroon-500 focus:ring-maroon-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
								class:border-red-300={errors.customer_type_id}
							>
								<option value="">Pilih Tipe</option>
								{#each customerTypeOptions as type (type.id)}
									<option value={type.id}>{type.name}</option>
								{/each}
							</select>
							{#if errors.customer_type_id}
								<p class="mt-1 text-sm text-red-600">{errors.customer_type_id}</p>
							{/if}
						</div>

						<!-- Gallon Price -->
						<div>
							<label for="gallon_price_id" class="block text-sm font-medium text-gray-700">
								Harga Galon <span class="text-red-500">*</span>
							</label>
							<select
								id="gallon_price_id"
								bind:value={formData.gallon_price_id}
								class="focus:border-maroon-500 focus:ring-maroon-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
								class:border-red-300={errors.gallon_price_id}
							>
								<option value="">Pilih Harga</option>
								{#each gallonPriceOptions as price (price.id)}
									<option value={price.id}>{price.name}</option>
								{/each}
							</select>
							{#if errors.gallon_price_id}
								<p class="mt-1 text-sm text-red-600">{errors.gallon_price_id}</p>
							{/if}
						</div>

						<!-- Initial Gallon Stock -->
						<div>
							<label for="customer_gallon_stock" class="block text-sm font-medium text-gray-700">
								Stok Galon Awal
							</label>
							<input
								id="customer_gallon_stock"
								type="number"
								min="0"
								bind:value={formData.customer_gallon_stock}
								use:selectOnFocus
								placeholder="0"
								class="focus:border-maroon-500 focus:ring-maroon-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
							/>
						</div>

						<!-- Subscription Date -->
						<div>
							<label for="subscription_date" class="block text-sm font-medium text-gray-700">
								Tanggal Bergabung
							</label>
							<input
								id="subscription_date"
								type="date"
								bind:value={formData.subscription_date}
								class="focus:border-maroon-500 focus:ring-maroon-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
							/>
						</div>

						<!-- 🆕 Kecamatan (bantuan nyempitin pilihan Sub-Wilayah, gak dikirim ke API) -->
						<div>
							<label for="customer_region" class="block text-sm font-medium text-gray-700">
								Kecamatan
							</label>
							<select
								id="customer_region"
								bind:value={selectedRegionId}
								class="focus:border-maroon-500 focus:ring-maroon-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
							>
								<option value="">Semua Kecamatan</option>
								{#each $regions as r (r.id)}
									<option value={r.id}>{r.region_name}</option>
								{/each}
							</select>
						</div>

						<!-- 🆕 Sub-Wilayah - ini yang beneran disimpan (sub_region_id) -->
						<div>
							<label for="customer_sub_region" class="block text-sm font-medium text-gray-700">
								Sub-Wilayah
							</label>
							<select
								id="customer_sub_region"
								bind:value={formData.sub_region_id}
								class="focus:border-maroon-500 focus:ring-maroon-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
							>
								<option value="">Belum dikategorikan</option>
								{#each visibleSubRegions as sr (sr.id)}
									<option value={sr.id}>{sr.sub_region_name}</option>
								{/each}
							</select>
						</div>

						<!-- 🆕 Koordinat (opsional, buat link Maps presisi di halaman detail) -->
						<div>
							<label for="customer_latitude" class="block text-sm font-medium text-gray-700">
								Latitude <span class="text-xs font-normal text-gray-400">(opsional)</span>
							</label>
							<input
								id="customer_latitude"
								type="number"
								step="0.000001"
								bind:value={formData.latitude}
								use:selectOnFocus
								placeholder="mis. -6.123456"
								class="focus:border-maroon-500 focus:ring-maroon-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
							/>
						</div>
						<div>
							<label for="customer_longitude" class="block text-sm font-medium text-gray-700">
								Longitude <span class="text-xs font-normal text-gray-400">(opsional)</span>
							</label>
							<input
								id="customer_longitude"
								type="number"
								step="0.000001"
								bind:value={formData.longitude}
								use:selectOnFocus
								placeholder="mis. 106.123456"
								class="focus:border-maroon-500 focus:ring-maroon-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
							/>
							<p class="mt-1 text-xs text-gray-400">
								Klik kanan lokasi di Google Maps → salin koordinat, tempel di sini.
							</p>
						</div>
					</div>
				</div>

				<!-- Footer -->
				<div class="flex justify-end space-x-3 border-t border-gray-200 px-6 py-4">
					<button
						type="button"
						on:click={handleCancel}
						class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
					>
						Batal
					</button>
					<button
						type="submit"
						disabled={isSubmitting}
						class="bg-maroon-600 hover:bg-maroon-700 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
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
							{isEdit ? 'Update' : 'Simpan'}
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
