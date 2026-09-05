<!-- customer detail -->
<!-- src/routes/dashboard/customers/[id]/+page.svelte -->
<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { customerActions, selectedCustomer, isLoading, error } from '$lib/stores/customers.js';
	import { api } from '$lib/services/api.js';
	import { auth } from '$lib/stores/auth';
	import CustomerForm from '$lib/components/customers/CustomerForm.svelte';
	import ConfirmationModal from '$lib/components/ui/ConfirmationModal.svelte';
	import AddBalanceModal from '$lib/components/customers/AddBalanceModal.svelte';
	import EditBalanceModal from '$lib/components/customers/EditBalanceModal.svelte';

	// Get customer ID from URL params
	$: customerId = $page.params.id;

	// Modal states
	let showEditForm = false;
	let showDeleteModal = false;
	let showImageModal = false;
	let showAddBalanceModal = false;
	let showEditBalanceModal = false;
	let selectedImage = null;

	// Saldo & Galon (dimuat terpisah dari data profil, tidak lewat store customers)
	let customerBalance = 0;
	let gallonStock = null;
	let gallonMovements = [];
	let isLoadingExtras = true;

	async function loadBalance() {
		try {
			const result = await api.customerBalance.getById(customerId);
			customerBalance = result?.balance || 0;
		} catch {
			// 404 = belum pernah ada saldo/topup, dianggap 0 - bukan error blocking
			customerBalance = 0;
		}
	}

	async function loadGallonInfo() {
		try {
			const [stock, movements] = await Promise.all([
				api.gallon.getStockByCustomer(customerId),
				api.gallonMovements.getByCustomer(customerId)
			]);
			gallonStock = stock;
			gallonMovements = Array.isArray(movements) ? movements : [];
		} catch (err) {
			console.error('Failed to load gallon info:', err);
			gallonStock = null;
			gallonMovements = [];
		}
	}

	function formatCurrency(amount) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(amount || 0);
	}

	function handleAddBalanceSuccess() {
		showAddBalanceModal = false;
		loadBalance();
	}

	function handleEditBalanceSuccess() {
		showEditBalanceModal = false;
		loadBalance();
	}

	// Load customer data
	onMount(async () => {
		if (customerId) {
			await customerActions.loadCustomer(parseInt(customerId));
			isLoadingExtras = true;
			await Promise.all([loadBalance(), loadGallonInfo()]);
			isLoadingExtras = false;
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

	// Handle image click for modal preview
	function handleImageClick(customer) {
		if (getCustomerAvatar(customer)) {
			selectedImage = {
				url: getCustomerAvatar(customer),
				title: customer.title,
				name: customer.customer_name
			};
			showImageModal = true;
		}
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
						<div class="flex gap-6">
							<!-- Customer Photo -->
							<div class="flex-shrink-0">
								{#if getCustomerAvatar($selectedCustomer)}
									<button on:click={() => handleImageClick($selectedCustomer)} class="group block">
										<img
											class="h-36 w-36 rounded-lg object-cover shadow-md transition-all duration-200 group-hover:scale-105 group-hover:shadow-lg"
											src={getCustomerAvatar($selectedCustomer)}
											alt="{$selectedCustomer.customer_name} photo"
											loading="lazy"
											on:error={(e) => {
												e.target.style.display = 'none';
												e.target.nextElementSibling.style.display = 'flex';
											}}
										/>
										<div
											class="bg-maroon-100 text-maroon-600 hidden h-36 w-36 items-center justify-center rounded-lg text-4xl font-bold shadow-md"
										>
											{getCustomerInitial($selectedCustomer)}
										</div>
									</button>
								{:else}
									<div
										class="bg-maroon-100 text-maroon-600 flex h-36 w-36 items-center justify-center rounded-lg text-4xl font-bold shadow-md"
									>
										{getCustomerInitial($selectedCustomer)}
									</div>
								{/if}
							</div>

							<!-- Customer Information Grid -->
							<div class="flex-1">
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
													href="https://wa.me/{$selectedCustomer.whatsapp_number.replace(
														/\D/g,
														''
													)}"
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

		<!-- Saldo & Galon -->
		<div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
			<!-- Saldo Pelanggan -->
			<div class="rounded-lg bg-white shadow">
				<div class="flex items-center justify-between px-6 py-4">
					<h3 class="text-lg font-medium text-gray-900">Saldo Pelanggan</h3>
					<div class="flex gap-2">
						{#if $auth.user?.role === 'Admin'}
							<button
								on:click={() => (showEditBalanceModal = true)}
								class="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
							>
								Koreksi Saldo
							</button>
						{/if}
						<button
							on:click={() => (showAddBalanceModal = true)}
							class="bg-maroon-600 hover:bg-maroon-700 rounded-md px-3 py-1.5 text-sm font-medium text-white"
						>
							+ Tambah Saldo
						</button>
					</div>
				</div>
				<div class="border-t border-gray-200 px-6 py-4">
					{#if isLoadingExtras}
						<p class="text-sm text-gray-400">Memuat saldo...</p>
					{:else}
						<p class="text-maroon-700 text-3xl font-semibold">{formatCurrency(customerBalance)}</p>
						<p class="mt-1 text-xs text-gray-500">
							Saldo dipakai otomatis buat bayar hutang saat transaksi baru dibuat.
						</p>
					{/if}
				</div>
			</div>

			<!-- Galon -->
			<div class="rounded-lg bg-white shadow">
				<div class="px-6 py-4">
					<h3 class="text-lg font-medium text-gray-900">Galon</h3>
				</div>
				<div class="border-t border-gray-200 px-6 py-4">
					{#if isLoadingExtras}
						<p class="text-sm text-gray-400">Memuat data galon...</p>
					{:else}
						<div class="mb-4">
							<p class="text-sm text-gray-500">Galon Belum Kembali</p>
							<p
								class="text-2xl font-semibold {(gallonStock?.unreturned_gallons || 0) > 0
									? 'text-yellow-700'
									: 'text-green-700'}"
							>
								{gallonStock?.unreturned_gallons ?? 0} galon
							</p>
						</div>

						<p class="mb-2 text-sm font-medium text-gray-700">Riwayat Pergerakan</p>
						{#if gallonMovements.length === 0}
							<p class="text-sm text-gray-400">Belum ada riwayat pergerakan galon.</p>
						{:else}
							<div class="max-h-64 overflow-y-auto rounded-md border border-gray-100">
								<table class="min-w-full divide-y divide-gray-100 text-sm">
									<thead class="bg-gray-50">
										<tr>
											<th class="px-3 py-2 text-left font-medium text-gray-500">Tanggal</th>
											<th class="px-3 py-2 text-right font-medium text-gray-500"
												>Isi/Kosong/Kembali</th
											>
											<th class="px-3 py-2 text-right font-medium text-gray-500">Saldo Galon</th>
										</tr>
									</thead>
									<tbody class="divide-y divide-gray-100">
										{#each gallonMovements as movement (movement.transaction_id)}
											<tr>
												<td class="px-3 py-2 whitespace-nowrap text-gray-700">
													{new Date(movement.transaction_date).toLocaleDateString('id-ID', {
														year: 'numeric',
														month: 'short',
														day: 'numeric'
													})}
												</td>
												<td class="px-3 py-2 text-right whitespace-nowrap text-gray-700">
													{movement.gallon_filled} / {movement.gallon_empty} / {movement.gallon_returned}
												</td>
												<td
													class="px-3 py-2 text-right font-medium whitespace-nowrap text-gray-900"
												>
													{movement.saldo_galon}
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{/if}
					{/if}
				</div>
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

{#if showAddBalanceModal && $selectedCustomer}
	<AddBalanceModal
		customerId={parseInt(customerId)}
		customerName={$selectedCustomer.customer_name}
		currentBalance={customerBalance}
		on:success={handleAddBalanceSuccess}
		on:cancel={() => (showAddBalanceModal = false)}
	/>
{/if}

{#if showEditBalanceModal && $selectedCustomer}
	<EditBalanceModal
		customerId={parseInt(customerId)}
		customerName={$selectedCustomer.customer_name}
		currentBalance={customerBalance}
		on:success={handleEditBalanceSuccess}
		on:cancel={() => (showEditBalanceModal = false)}
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
