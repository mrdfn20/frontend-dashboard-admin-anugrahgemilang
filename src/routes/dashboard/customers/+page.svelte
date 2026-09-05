<!-- src/routes/dashboard/customers/+page.svelte -->
<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		customerActions,
		customers,
		filteredCustomers,
		filteredCustomersCount,
		searchTerm,
		customerTypeFilter,
		gallonPriceFilter,
		debtFilter,
		activityFilter,
		activeCustomerIds,
		isLoading,
		error
	} from '$lib/stores/customers.js';
	import { getCustomerTypeLabel } from '$lib/models/customer.js';
	import CustomerForm from '$lib/components/customers/CustomerForm.svelte';
	import ConfirmationModal from '$lib/components/ui/ConfirmationModal.svelte';
	import { infiniteScroll } from '$lib/actions/infiniteScroll.js';

	const customerTypeOptions = [
		{ id: 1, name: 'Pelanggan Akhir (Rumah)' },
		{ id: 2, name: 'Warung/Distributor' },
		{ id: 3, name: 'Pabrik' }
	];
	const gallonPriceOptions = [
		{ id: 'gw0', name: 'Rp 0' },
		{ id: 'gw5', name: 'Rp 5.000' },
		{ id: 'gw6', name: 'Rp 6.000' },
		{ id: 'gw7', name: 'Rp 7.000' },
		{ id: 'gw7.5', name: 'Rp 7.500' },
		{ id: 'gw8', name: 'Rp 8.000' },
		{ id: 'gw9', name: 'Rp 9.000' },
		{ id: 'gw10', name: 'Rp 10.000' },
		{ id: 'gw11', name: 'Rp 11.000' },
		{ id: 'gw12', name: 'Rp 12.000' }
	];

	// 🆕 Jumlah aktif/tidak aktif buat 2 kartu statistik
	$: activeCount = $activeCustomerIds
		? $customers.filter((c) => $activeCustomerIds.includes(c.id)).length
		: null;
	$: inactiveCount = $activeCustomerIds ? $customers.length - activeCount : null;

	function toggleActivityFilter(value) {
		activityFilter.set($activityFilter === value ? '' : value);
	}

	function formatCurrency(amount) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(amount || 0);
	}

	// State management
	let showAddForm = false;
	let showEditForm = false;
	let showDeleteModal = false;
	let selectedCustomer = null;
	let showImageModal = false;
	let selectedImage = null;
	let itemsPerPage = 10;
	let visibleCount = itemsPerPage;

	// Load customers on mount
	onMount(async () => {
		await Promise.all([customerActions.loadCustomers(), customerActions.loadActivitySummary()]);
	});

	// 🆕 Infinite scroll: reveal bertahap dari filteredCustomers yang sudah full di-load
	$: visibleCustomers = $filteredCustomers.slice(0, visibleCount);
	$: hasMoreCustomers = visibleCount < $filteredCustomersCount;

	// Reset jumlah tampil ketika search berubah
	$: $searchTerm, (visibleCount = itemsPerPage);

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

	// Format gallon price to "K" format
	function formatGallonPrice(price) {
		if (!price) return '-';
		const numPrice = parseFloat(price);
		if (numPrice >= 1000) {
			return `${numPrice / 1000}K`;
		}
		return `${numPrice}`;
	}

	// Get customer avatar with fallback + Google Drive link transformation
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

	// Get customer initial for fallback avatar
	function getCustomerInitial(customer) {
		return customer.customer_name ? customer.customer_name.charAt(0).toUpperCase() : 'N';
	}

	function handleImageClick(customer, event) {
		event.stopPropagation(); // Prevent row click
		const imageUrl = getCustomerAvatar(customer);
		if (imageUrl) {
			selectedImage = {
				url: imageUrl,
				name: customer.customer_name,
				title: customer.title
			};
			showImageModal = true;
		}
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
			<div class="flex gap-2">
				<button
					on:click={() => goto('/dashboard/customers/deleted')}
					class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
				>
					Pelanggan Terhapus
				</button>
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
	</div>

	<!-- Search -->
	<div class="mb-4">
		<div class="relative">
			<input
				type="text"
				placeholder="Cari pelanggan berdasarkan apapun... (gunakan /123 untuk cari ID spesifik)"
				bind:value={$searchTerm}
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

			<!-- 🆕 Clear search button -->
			{#if $searchTerm}
				<button
					on:click={() => customerActions.clearSearch()}
					class="absolute top-2.5 right-3 text-gray-400 hover:text-gray-600"
					title="Clear search"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			{/if}
		</div>
	</div>

	<!-- Stats Cards -->
	<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
		<div class="bg-maroon-50 rounded-lg p-4">
			<div class="text-center">
				<p class="text-maroon-600 text-2xl font-bold">{$filteredCustomersCount}</p>
				<p class="text-maroon-600 text-sm">
					{$searchTerm ||
					$customerTypeFilter ||
					$gallonPriceFilter ||
					$debtFilter ||
					$activityFilter
						? 'Hasil Filter'
						: 'Total Pelanggan'}
				</p>
				{#if $filteredCustomersCount !== $customers.length}
					<p class="text-maroon-400 mt-1 text-xs">dari {$customers.length} total</p>
				{/if}
			</div>
		</div>

		<!-- 🆕 Kartu Aktif Bulan Ini - klik buat filter list ke pelanggan yg aktif -->
		<button
			on:click={() => toggleActivityFilter('active')}
			class="rounded-lg border-2 p-4 text-center transition-colors {$activityFilter === 'active'
				? 'border-green-500 bg-green-50'
				: 'border-transparent bg-green-50/40'}"
		>
			<p class="text-2xl font-bold text-green-600">{activeCount ?? '...'}</p>
			<p class="text-sm text-green-700">Aktif Transaksi Bulan Ini</p>
		</button>

		<!-- 🆕 Kartu Tidak Aktif Bulan Ini -->
		<button
			on:click={() => toggleActivityFilter('inactive')}
			class="rounded-lg border-2 p-4 text-center transition-colors {$activityFilter === 'inactive'
				? 'border-gray-400 bg-gray-100'
				: 'border-transparent bg-gray-50'}"
		>
			<p class="text-2xl font-bold text-gray-600">{inactiveCount ?? '...'}</p>
			<p class="text-sm text-gray-600">Tidak Aktif Bulan Ini</p>
		</button>
	</div>

	<!-- 🆕 Filter -->
	<div class="mb-6 flex flex-wrap gap-3">
		<select
			bind:value={$customerTypeFilter}
			class="focus:border-maroon-500 focus:ring-maroon-500 rounded-md border border-gray-300 px-3 py-2 text-sm"
		>
			<option value="">Semua Tipe Pelanggan</option>
			{#each customerTypeOptions as opt (opt.id)}
				<option value={opt.id}>{opt.name}</option>
			{/each}
		</select>

		<select
			bind:value={$gallonPriceFilter}
			class="focus:border-maroon-500 focus:ring-maroon-500 rounded-md border border-gray-300 px-3 py-2 text-sm"
		>
			<option value="">Semua Harga Galon</option>
			{#each gallonPriceOptions as opt (opt.id)}
				<option value={opt.id}>{opt.name}</option>
			{/each}
		</select>

		<select
			bind:value={$debtFilter}
			class="focus:border-maroon-500 focus:ring-maroon-500 rounded-md border border-gray-300 px-3 py-2 text-sm"
		>
			<option value="">Semua Status Hutang</option>
			<option value="has_debt">Ada Hutang</option>
			<option value="no_debt">Lunas / Gak Ada Hutang</option>
		</select>

		{#if $customerTypeFilter || $gallonPriceFilter || $debtFilter || $activityFilter}
			<button
				on:click={() => {
					customerTypeFilter.set('');
					gallonPriceFilter.set('');
					debtFilter.set('');
					activityFilter.set('');
				}}
				class="text-sm text-gray-500 underline hover:text-gray-700"
			>
				Reset filter
			</button>
		{/if}
	</div>

	{#if $searchTerm.startsWith('/') && $filteredCustomersCount === 1}
		<div class="mb-4 rounded-lg bg-blue-50 p-3">
			<p class="text-sm text-blue-700">
				✅ Ditemukan pelanggan dengan ID {$searchTerm.slice(1)}
			</p>
		</div>
	{:else if $searchTerm.startsWith('/') && $filteredCustomersCount === 0}
		<div class="mb-4 rounded-lg bg-yellow-50 p-3">
			<p class="text-sm text-yellow-700">
				⚠️ Tidak ditemukan pelanggan dengan ID {$searchTerm.slice(1)}
			</p>
		</div>
	{/if}

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
							<th
								class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
							>
								Sub Region
							</th>
							<th
								class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
							>
								Gallon Price
							</th>
							<th
								class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
							>
								Tipe
							</th>
							<th
								class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
							>
								Stok Galon
							</th>
							<th
								class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
							>
								Saldo
							</th>
							<th
								class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
							>
								Aksi
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200 bg-white">
						{#each visibleCustomers as customer (customer.id)}
							<tr
								class="cursor-pointer transition-colors hover:bg-gray-50"
								on:click={() => handleViewCustomer(customer)}
								role="button"
								tabindex="0"
								on:keydown={(e) => e.key === 'Enter' && handleViewCustomer(customer)}
							>
								<!-- Pelanggan Column with Avatar -->
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="flex items-center">
										<div class="h-10 w-10 flex-shrink-0">
											{#if getCustomerAvatar(customer)}
												<img
													class="h-10 w-10 cursor-zoom-in rounded-full object-cover transition-opacity hover:opacity-80"
													src={getCustomerAvatar(customer)}
													alt="{customer.customer_name} photo"
													loading="lazy"
													on:click={(e) => handleImageClick(customer, e)}
													on:error={(e) => {
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

								<!-- Sub Region Column -->
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm font-medium text-gray-900">
										{customer.sub_region_name || '-'}
									</div>
									<div class="text-xs text-gray-500">
										{customer.region_name || ''}
									</div>
								</td>

								<!-- Gallon Price Column -->
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm font-medium text-gray-900">
										{formatGallonPrice(customer.price)}
									</div>
								</td>

								<!-- 🆕 Tipe Pelanggan Column -->
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm text-gray-700">
										{getCustomerTypeLabel(customer.customer_type_id)}
									</div>
								</td>

								<!-- 🆕 Stok Galon Column -->
								<td class="px-6 py-4 text-center whitespace-nowrap">
									<div class="text-sm text-gray-900">{customer.customer_gallon_stock ?? 0}</div>
								</td>

								<!-- 🆕 Saldo Column -->
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm font-medium text-gray-900">
										{formatCurrency(customer.balance)}
									</div>
									{#if Number(customer.total_debt) > 0}
										<div class="text-xs text-red-600">
											Hutang {formatCurrency(customer.total_debt)}
										</div>
									{/if}
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
									{$searchTerm
										? 'Tidak ada pelanggan yang sesuai dengan pencarian'
										: 'Belum ada data pelanggan'}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Infinite scroll footer -->
			{#if $filteredCustomersCount > 0}
				<div class="border-t border-gray-200 bg-white px-4 py-3 text-center sm:px-6">
					<p class="text-sm text-gray-500">
						Menampilkan <span class="font-medium">{visibleCustomers.length}</span> dari
						<span class="font-medium">{$filteredCustomersCount}</span> pelanggan
						{#if $searchTerm}
							(filtered dari {$customers.length} total)
						{/if}
					</p>
					{#if hasMoreCustomers}
						<div
							use:infiniteScroll={{
								hasMore: hasMoreCustomers,
								onLoadMore: () => (visibleCount += itemsPerPage)
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

<!-- Customer Image Preview Modal -->
{#if showImageModal && selectedImage}
	<div class="fixed inset-0 z-50 overflow-y-auto">
		<div class="flex min-h-screen items-center justify-center px-4 py-6">
			<div
				class="fixed inset-0 bg-white/20 backdrop-blur-md transition-all duration-300"
				on:click={() => (showImageModal = false)}
			></div>

			<div class="relative z-10 max-h-[80vh] max-w-2xl rounded-lg bg-white p-6">
				<div class="mb-4 flex items-center justify-between">
					<h3 class="text-lg font-medium text-gray-900">
						{selectedImage.title}
						{selectedImage.name}
					</h3>
					<button
						on:click={() => (showImageModal = false)}
						class="text-gray-400 hover:text-gray-600"
					>
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

				<img
					src={selectedImage.url}
					alt="{selectedImage.name} photo"
					class="h-auto max-h-[60vh] w-full rounded-lg object-contain shadow-lg"
				/>
			</div>
		</div>
	</div>
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
	:global(.text-maroon-400) {
		color: #b3002d;
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
