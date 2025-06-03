<!-- Updated Customer Management Table -->
<!-- src/routes/dashboard/customers/+page.svelte -->
<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { customerActions, customers, isLoading, error } from '$lib/stores/customers.js';
	import CustomerForm from '$lib/components/customers/CustomerForm.svelte';
	import ConfirmationModal from '$lib/components/ui/ConfirmationModal.svelte';

	// State management
	let searchTerm = '';
	let showAddForm = false;
	let showEditForm = false;
	let showDeleteModal = false;
	let selectedCustomer = null;
	let currentPage = 1;
	let itemsPerPage = 10;

	// Load customers on mount
	onMount(async () => {
		await customerActions.loadCustomers();
	});

	// Filtered customers based on search
	$: filteredCustomers = searchTerm.trim()
		? customerActions.searchCustomers(searchTerm)
		: customers;

	// Pagination
	$: totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
	$: $filteredCustomers, (totalPages = Math.ceil($filteredCustomers.length / itemsPerPage));
	$: paginatedCustomers = $filteredCustomers.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	// Event handlers
	function handleAddCustomer() {
		selectedCustomer = null;
		showAddForm = true;
	}

	function handleEditCustomer(customer) {
		selectedCustomer = customer;
		showEditForm = true;
	}

	function handleDeleteCustomer(customer) {
		selectedCustomer = customer;
		showDeleteModal = true;
	}

	function handleViewCustomer(customer) {
		goto(`/dashboard/customers/${customer.id}`);
	}

	async function confirmDelete() {
		if (selectedCustomer) {
			try {
				await customerActions.deleteCustomer(selectedCustomer.id);
				showDeleteModal = false;
				selectedCustomer = null;
			} catch (err) {
				console.error('Failed to delete customer:', err);
			}
		}
	}

	function handleFormSuccess() {
		showAddForm = false;
		showEditForm = false;
		selectedCustomer = null;
	}

	function formatPhone(phone) {
		if (!phone) return '-';
		return phone.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3');
	}

	// NEW: Format gallon price to "K" format
	function formatGallonPrice(price) {
		if (!price) return '-';
		const numPrice = parseFloat(price);
		if (numPrice >= 1000) {
			return `${numPrice / 1000}K`;
		}
		return `${numPrice}`;
	}

	// NEW: Get customer avatar with fallback
	// NEW: Get customer avatar with fallback + Google Drive link transformation
	function getCustomerAvatar(customer) {
		if (customer.customer_photo) {
			// Transform Google Drive link to direct image URL
			const driveLink = customer.customer_photo;

			// Extract file ID from Google Drive URL
			const fileIdMatch = driveLink.match(/[?&]id=([a-zA-Z0-9_-]+)/);
			if (fileIdMatch) {
				const fileId = fileIdMatch[1];
				return `https://lh3.googleusercontent.com/d/${fileId}`;
			}

			// Fallback to original link if extraction fails
			return driveLink;
		}
		return null;
	}

	// NEW: Get customer initial for fallback avatar
	function getCustomerInitial(customer) {
		return customer.customer_name ? customer.customer_name.charAt(0).toUpperCase() : 'N';
	}
</script>

<div class="p-6">
	<!-- Header -->
	<div class="mb-6">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-semibold text-gray-900">Manajemen Pelanggan</h1>
				<p class="text-gray-500">Kelola data pelanggan CV Anugrah Gemilang</p>
			</div>
			<button
				on:click={handleAddCustomer}
				class="bg-maroon-600 hover:bg-maroon-700 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="mr-2 inline h-4 w-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				Tambah Pelanggan
			</button>
		</div>
	</div>

	<!-- Search & Stats -->
	<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
		<!-- Search -->
		<div class="md:col-span-2">
			<div class="relative">
				<input
					type="text"
					placeholder="Cari pelanggan..."
					bind:value={searchTerm}
					class="focus:border-maroon-500 focus:ring-maroon-500 block w-full rounded-md border border-gray-300 px-3 py-2 pl-10 text-sm"
				/>
				<svg
					class="absolute top-2.5 left-3 h-4 w-4 text-gray-400"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>
			</div>
		</div>

		<!-- Stats -->
		<div class="bg-maroon-50 rounded-lg p-4">
			<div class="text-center">
				<p class="text-maroon-600 text-2xl font-bold">{filteredCustomers.length}</p>
				<p class="text-maroon-600 text-sm">Total Pelanggan</p>
			</div>
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
	{:else}
		<!-- Updated Data Table -->
		<div class="overflow-hidden rounded-lg bg-white shadow">
			<div class="overflow-x-auto">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th
								class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
							>
								Pelanggan
							</th>
							<th
								class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
							>
								Kontak
							</th>
							<th
								class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
							>
								Alamat
							</th>
							<!-- NEW: Sub Region Column -->
							<th
								class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
							>
								Sub Region
							</th>
							<!-- NEW: Gallon Price Column -->
							<th
								class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
							>
								Gallon Price
							</th>
							<th
								class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
							>
								Aksi
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200 bg-white">
						{#each paginatedCustomers as customer (customer.id)}
							<tr class="hover:bg-gray-50">
								<!-- Pelanggan Column with Avatar -->
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="flex items-center">
										<div class="h-10 w-10 flex-shrink-0">
											{#if getCustomerAvatar(customer)}
												<img
													class="h-10 w-10 rounded-full object-cover"
													src={getCustomerAvatar(customer)}
													alt="{customer.customer_name} photo"
													loading="lazy"
													on:error={(e) => {
														// Fallback to initial if image fails to load
														e.target.style.display = 'none';
														e.target.nextElementSibling.style.display = 'flex';
													}}
												/>
												<div
													class="bg-maroon-100 text-maroon-600 hidden h-10 w-10 items-center justify-center rounded-full"
												>
													{getCustomerInitial(customer)}
												</div>
											{:else}
												<div
													class="bg-maroon-100 text-maroon-600 flex h-10 w-10 items-center justify-center rounded-full"
												>
													{getCustomerInitial(customer)}
												</div>
											{/if}
										</div>
										<div class="ml-4">
											<div class="text-sm font-medium text-gray-900">
												{customer.title}
												{customer.customer_name}
											</div>
											<div class="text-sm text-gray-500">ID: {customer.id}</div>
										</div>
									</div>
								</td>

								<!-- Kontak Column -->
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm text-gray-900">{formatPhone(customer.whatsapp_number)}</div>
									<div class="text-sm text-gray-500">WhatsApp</div>
								</td>

								<!-- Alamat Column -->
								<td class="px-6 py-4">
									<div class="text-sm text-gray-900">{customer.address}</div>
								</td>

								<!-- NEW: Sub Region Column -->
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm font-medium text-gray-900">
										{customer.sub_region_name || '-'}
									</div>
									<div class="text-xs text-gray-500">
										{customer.region_name || ''}
									</div>
								</td>

								<!-- NEW: Gallon Price Column -->
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm font-medium text-gray-900">
										{formatGallonPrice(customer.price)}
									</div>
								</td>

								<!-- Aksi Column -->
								<td class="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
									<div class="flex justify-end space-x-2">
										<button
											on:click={() => handleViewCustomer(customer)}
											class="text-maroon-600 hover:text-maroon-900"
											title="Lihat Detail"
										>
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
												/>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
												/>
											</svg>
										</button>
										<button
											on:click={() => handleEditCustomer(customer)}
											class="text-blue-600 hover:text-blue-900"
											title="Edit"
										>
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
												/>
											</svg>
										</button>
										<button
											on:click={() => handleDeleteCustomer(customer)}
											class="text-red-600 hover:text-red-900"
											title="Hapus"
										>
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
												/>
											</svg>
										</button>
									</div>
								</td>
							</tr>
						{:else}
							<tr>
								<td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">
									{searchTerm
										? 'Tidak ada pelanggan yang sesuai dengan pencarian'
										: 'Belum ada data pelanggan'}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Pagination -->
			{#if totalPages > 1}
				<div
					class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6"
				>
					<div class="flex flex-1 justify-between sm:hidden">
						<button
							on:click={() => (currentPage = Math.max(1, currentPage - 1))}
							disabled={currentPage === 1}
							class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
						>
							Previous
						</button>
						<button
							on:click={() => (currentPage = Math.min(totalPages, currentPage + 1))}
							disabled={currentPage === totalPages}
							class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
						>
							Next
						</button>
					</div>
					<div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
						<div>
							<p class="text-sm text-gray-700">
								Showing <span class="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
								to
								<span class="font-medium"
									>{Math.min(currentPage * itemsPerPage, filteredCustomers.length)}</span
								>
								of <span class="font-medium">{filteredCustomers.length}</span> results
							</p>
						</div>
						<div>
							<nav class="isolate inline-flex -space-x-px rounded-md shadow-sm">
								{#each Array(totalPages) as _, i}
									<button
										on:click={() => (currentPage = i + 1)}
										class="relative inline-flex items-center px-4 py-2 text-sm font-semibold {currentPage ===
										i + 1
											? 'bg-maroon-600 text-white'
											: 'bg-white text-gray-900 hover:bg-gray-50'} ring-1 ring-gray-300 ring-inset"
									>
										{i + 1}
									</button>
								{/each}
							</nav>
						</div>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- Modals -->
{#if showAddForm}
	<CustomerForm on:success={handleFormSuccess} on:cancel={() => (showAddForm = false)} />
{/if}

{#if showEditForm && selectedCustomer}
	<CustomerForm
		customer={selectedCustomer}
		on:success={handleFormSuccess}
		on:cancel={() => (showEditForm = false)}
	/>
{/if}

{#if showDeleteModal && selectedCustomer}
	<ConfirmationModal
		title="Hapus Pelanggan"
		message="Apakah Anda yakin ingin menghapus pelanggan {selectedCustomer.customer_name}? Tindakan ini tidak dapat dibatalkan."
		confirmText="Hapus"
		confirmClass="bg-red-600 hover:bg-red-700"
		on:confirm={confirmDelete}
		on:cancel={() => (showDeleteModal = false)}
	/>
{/if}

<style>
	:global(.bg-maroon-600) {
		background-color: #800020;
	}
	:global(.hover\:bg-maroon-700:hover) {
		background-color: #600018;
	}
	:global(.text-maroon-600) {
		color: #800020;
	}
	:global(.bg-maroon-50) {
		background-color: #fdf2f3;
	}
	:global(.bg-maroon-100) {
		background-color: #fce7e8;
	}
	:global(.focus\:border-maroon-500:focus) {
		border-color: #800020;
	}
	:global(.focus\:ring-maroon-500:focus) {
		--tw-ring-color: rgba(128, 0, 32, 0.5);
	}
</style>
