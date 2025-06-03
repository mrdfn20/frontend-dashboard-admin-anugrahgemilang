<!-- customer detail -->
<!-- src/routes/dashboard/customers/[id]/+page.svelte -->
<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { customerActions, selectedCustomer, isLoading, error } from '$lib/stores/customers.js';
	import CustomerForm from '$lib/components/customers/CustomerForm.svelte';
	import ConfirmationModal from '$lib/components/ui/ConfirmationModal.svelte';

	// Get customer ID from URL params
	$: customerId = $page.params.id;

	// Modal states
	let showEditForm = false;
	let showDeleteModal = false;

	// Load customer data
	onMount(async () => {
		if (customerId) {
			await customerActions.loadCustomer(parseInt(customerId));
		}
	});

	// Event handlers
	function handleEdit() {
		showEditForm = true;
	}

	function handleDelete() {
		showDeleteModal = true;
	}

	async function confirmDelete() {
		if ($selectedCustomer) {
			try {
				await customerActions.deleteCustomer($selectedCustomer.id);
				goto('/dashboard/customers');
			} catch (err) {
				console.error('Failed to delete customer:', err);
			}
		}
	}

	function handleEditSuccess() {
		showEditForm = false;
		// Data akan auto-update karena store reactive
	}

	function goBack() {
		goto('/dashboard/customers');
	}

	// Helper functions
	function formatPhone(phone) {
		if (!phone) return '-';
		return phone.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3');
	}

	function formatDate(dateString) {
		if (!dateString) return '-';
		return new Date(dateString).toLocaleDateString('id-ID', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function getCustomerTypeLabel(typeId) {
		const types = {
			1: 'Pelanggan Akhir (Rumah)',
			2: 'Warung/Distributor',
			3: 'Pabrik'
		};
		return types[typeId] || 'Unknown';
	}

	function getGallonPriceLabel(priceId) {
		const prices = {
			gw0: 'Rp 0',
			gw5: 'Rp 5.000',
			gw6: 'Rp 6.000',
			gw7: 'Rp 7.000',
			gw75: 'Rp 7.500',
			gw8: 'Rp 8.000',
			gw9: 'Rp 9.000',
			gw10: 'Rp 10.000',
			gw11: 'Rp 11.000',
			gw12: 'Rp 12.000'
		};
		return prices[priceId] || 'Unknown';
	}
</script>

<svelte:head>
	<title>Detail Pelanggan - CV Anugrah Gemilang</title>
</svelte:head>

<div class="p-6">
	<!-- Header -->
	<div class="mb-6">
		<div class="flex items-center justify-between">
			<div class="flex items-center">
				<button
					on:click={goBack}
					class="mr-4 rounded-md p-2 text-gray-400 hover:text-gray-600"
					title="Kembali"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 19l-7-7 7-7"
						/>
					</svg>
				</button>
				<div>
					<h1 class="text-2xl font-semibold text-gray-900">Detail Pelanggan</h1>
					<p class="text-gray-500">Informasi lengkap pelanggan</p>
				</div>
			</div>

			{#if $selectedCustomer}
				<div class="flex space-x-3">
					<button
						on:click={handleEdit}
						class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
					>
						<svg class="mr-2 inline h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
							/>
						</svg>
						Edit
					</button>
					<button
						on:click={handleDelete}
						class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
					>
						<svg class="mr-2 inline h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
							/>
						</svg>
						Hapus
					</button>
				</div>
			{/if}
		</div>
	</div>

	<!-- Error Message -->
	{#if $error}
		<div class="mb-4 border-l-4 border-red-600 bg-red-50 p-4">
			<p class="text-sm text-red-700">{$error}</p>
		</div>
	{/if}

	<!-- Loading State -->
	{#if $isLoading}
		<div class="flex h-64 items-center justify-center">
			<svg
				class="text-maroon-600 h-8 w-8 animate-spin"
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
	{:else if $selectedCustomer}
		<!-- Customer Details -->
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<!-- Main Info -->
			<div class="lg:col-span-2">
				<div class="rounded-lg bg-white shadow">
					<div class="px-6 py-4">
						<h3 class="text-lg font-medium text-gray-900">Informasi Pelanggan</h3>
					</div>
					<div class="border-t border-gray-200 px-6 py-4">
						<dl class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
							<div>
								<dt class="text-sm font-medium text-gray-500">ID Pelanggan</dt>
								<dd class="mt-1 text-sm text-gray-900">#{$selectedCustomer.id}</dd>
							</div>

							<div>
								<dt class="text-sm font-medium text-gray-500">Nama Lengkap</dt>
								<dd class="mt-1 text-sm text-gray-900">
									{$selectedCustomer.title}
									{$selectedCustomer.customer_name}
								</dd>
							</div>

							<div>
								<dt class="text-sm font-medium text-gray-500">Tanggal Lahir</dt>
								<dd class="mt-1 text-sm text-gray-900">
									{formatDate($selectedCustomer.date_of_birth)}
								</dd>
							</div>

							<div>
								<dt class="text-sm font-medium text-gray-500">Nomor WhatsApp</dt>
								<dd class="mt-1 text-sm text-gray-900">
									{#if $selectedCustomer.whatsapp_number}
										<a
											href="https://wa.me/{$selectedCustomer.whatsapp_number.replace(/\D/g, '')}"
											target="_blank"
											class="text-green-600 hover:text-green-800"
										>
											{formatPhone($selectedCustomer.whatsapp_number)}
										</a>
									{:else}
										-
									{/if}
								</dd>
							</div>

							<div class="sm:col-span-2">
								<dt class="text-sm font-medium text-gray-500">Alamat</dt>
								<dd class="mt-1 text-sm text-gray-900">{$selectedCustomer.address}</dd>
							</div>

							<div>
								<dt class="text-sm font-medium text-gray-500">Tipe Pelanggan</dt>
								<dd class="mt-1">
									<span
										class="bg-maroon-100 text-maroon-800 inline-flex rounded-full px-2 text-xs leading-5 font-semibold"
									>
										{getCustomerTypeLabel($selectedCustomer.customer_type_id)}
									</span>
								</dd>
							</div>

							<div>
								<dt class="text-sm font-medium text-gray-500">Tanggal Bergabung</dt>
								<dd class="mt-1 text-sm text-gray-900">
									{formatDate($selectedCustomer.subscription_date)}
								</dd>
							</div>
						</dl>
					</div>
				</div>
			</div>

			<!-- Side Info -->
			<div class="space-y-6">
				<!-- Business Info -->
				<div class="rounded-lg bg-white shadow">
					<div class="px-6 py-4">
						<h3 class="text-lg font-medium text-gray-900">Info Bisnis</h3>
					</div>
					<div class="border-t border-gray-200 px-6 py-4">
						<dl class="space-y-4">
							<div>
								<dt class="text-sm font-medium text-gray-500">Harga Galon 19L</dt>
								<dd class="mt-1 text-sm text-gray-900">
									{getGallonPriceLabel($selectedCustomer.gallon_price_id)}
								</dd>
							</div>

							<div>
								<dt class="text-sm font-medium text-gray-500">Stok Galon</dt>
								<dd class="mt-1 text-sm text-gray-900">
									{$selectedCustomer.customer_gallon_stock || 0} unit
								</dd>
							</div>

							{#if $selectedCustomer.sub_region_id}
								<div>
									<dt class="text-sm font-medium text-gray-500">Sub Region</dt>
									<dd class="mt-1 text-sm text-gray-900">ID: {$selectedCustomer.sub_region_id}</dd>
								</div>
							{/if}
						</dl>
					</div>
				</div>

				<!-- Location Info -->
				{#if $selectedCustomer.latitude && $selectedCustomer.longitude}
					<div class="rounded-lg bg-white shadow">
						<div class="px-6 py-4">
							<h3 class="text-lg font-medium text-gray-900">Lokasi</h3>
						</div>
						<div class="border-t border-gray-200 px-6 py-4">
							<dl class="space-y-4">
								<div>
									<dt class="text-sm font-medium text-gray-500">Koordinat</dt>
									<dd class="mt-1 text-sm text-gray-900">
										{$selectedCustomer.latitude}, {$selectedCustomer.longitude}
									</dd>
								</div>
								<div>
									<a
										href="https://maps.google.com/?q={$selectedCustomer.latitude},{$selectedCustomer.longitude}"
										target="_blank"
										class="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
									>
										<svg class="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
											/>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
											/>
										</svg>
										Lihat di Maps
									</a>
								</div>
							</dl>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{:else}
		<div class="py-12 text-center">
			<svg
				class="mx-auto h-12 w-12 text-gray-400"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
				/>
			</svg>
			<h3 class="mt-4 text-sm font-medium text-gray-900">Pelanggan tidak ditemukan</h3>
			<p class="mt-1 text-sm text-gray-500">
				Pelanggan dengan ID tersebut tidak ditemukan atau telah dihapus.
			</p>
		</div>
	{/if}
</div>

<!-- Modals -->
{#if showEditForm && $selectedCustomer}
	<CustomerForm
		customer={$selectedCustomer}
		on:success={handleEditSuccess}
		on:cancel={() => (showEditForm = false)}
	/>
{/if}

{#if showDeleteModal && $selectedCustomer}
	<ConfirmationModal
		title="Hapus Pelanggan"
		message="Apakah Anda yakin ingin menghapus pelanggan {$selectedCustomer.customer_name}? Tindakan ini tidak dapat dibatalkan."
		confirmText="Hapus"
		confirmClass="bg-red-600 hover:bg-red-700"
		on:confirm={confirmDelete}
		on:cancel={() => (showDeleteModal = false)}
	/>
{/if}

<style>
	:global(.text-maroon-600) {
		color: #800020;
	}
	:global(.bg-maroon-100) {
		background-color: #fce7e8;
	}
	:global(.text-maroon-800) {
		color: #4a0012;
	}
</style>
