<!-- src/lib/components/customers/CustomerForm.svelte -->
<script>
	import { createEventDispatcher } from 'svelte';
	import { customerActions } from '$lib/stores/customers.js';
	import { validateCustomer, defaultCustomer, cleanCustomerData } from '$lib/models/customer.js';

	// Props
	export let customer = null; // null for add, object for edit

	// Event dispatcher
	const dispatch = createEventDispatcher();

	// Form state
	let formData = customer ? { ...customer } : { ...defaultCustomer };
	let errors = {};
	let isSubmitting = false;
	let isEdit = !!customer;

	// Form options (these would typically come from API or store)
	const titleOptions = ['Tn.', 'Ny.'];
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

		const cleanData = cleanCustomerData(formData);

		isSubmitting = true;

		try {
			const cleanData = cleanCustomerData(formData);

			if (isEdit) {
				await customerActions.updateCustomer(customer.id, cleanData);
			} else {
				await customerActions.createCustomer(cleanData);
			}

			dispatch('success');
		} catch (error) {
			console.error('Failed to save customer:', error);
			// You might want to show a toast or error message here
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
<div class="fixed inset-0 z-50 overflow-y-auto">
	<div class="flex min-h-screen items-center justify-center px-4 py-6">
		<!-- Background overlay -->
		<div
			class="bg-opacity-75 fixed inset-0 bg-gray-500 transition-opacity"
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
								{#each titleOptions as title}
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
								{#each customerTypeOptions as type}
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
								{#each gallonPriceOptions as price}
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
