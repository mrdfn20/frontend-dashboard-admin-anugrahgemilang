<!-- src/routes/dashboard/gallon/+page.svelte -->
<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		gallonActions,
		gallonStock,
		isLoading,
		error,
		movements,
		movementsLoading
	} from '$lib/stores/gallon.js';
	import { customerActions, customers } from '$lib/stores/customers.js';
	import GallonFilter from '$lib/components/gallon/GallonFilter.svelte';
	import GallonTable from '$lib/components/gallon/GallonTable.svelte';
	import GallonMovementsTable from '$lib/components/gallon/GallonMovementsTable.svelte';
	import { infiniteScroll } from '$lib/actions/infiniteScroll.js';
	import Autosuggest from '$lib/components/ui/Autosuggest.svelte';

	let activeTab = 'stock'; // 'stock' | 'movements'

	let itemsPerPage = 10;
	let visibleCount = itemsPerPage;

	// Tab Riwayat Pergerakan: pencarian nama + infinite scroll sendiri
	let movementsQuery = '';
	let movementsVisibleCount = itemsPerPage;

	onMount(async () => {
		// Customers dibutuhkan utk dropdown sub-wilayah di filter & join nama di riwayat
		await Promise.all([
			customerActions.loadCustomers(),
			gallonActions.loadStock(),
			gallonActions.loadMovements()
		]);
	});

	$: visibleStock = $gallonStock.slice(0, visibleCount);
	$: hasMoreStock = visibleCount < $gallonStock.length;

	// Join nama pelanggan ke tiap baris riwayat (BE cuma kasih customer_id)
	$: customersById = $customers.reduce((map, c) => {
		map[c.id] = c.customer_name;
		return map;
	}, {});
	$: joinedMovements = $movements.map((m) => ({
		...m,
		customer_name: customersById[m.customer_id]
	}));
	$: filteredMovements = movementsQuery.trim()
		? joinedMovements.filter((m) =>
				(m.customer_name || '').toLowerCase().includes(movementsQuery.trim().toLowerCase())
			)
		: joinedMovements;
	$: visibleMovements = filteredMovements.slice(0, movementsVisibleCount);
	$: hasMoreMovements = movementsVisibleCount < filteredMovements.length;
	$: movementsQuery, (movementsVisibleCount = itemsPerPage);

	function handleSelectRow(event) {
		goto(`/dashboard/customers/${event.detail.customer_id}`);
	}

	async function handleFilterChange(event) {
		visibleCount = itemsPerPage;
		await gallonActions.applyFilters(event.detail);
	}

	async function handleFilterReset() {
		visibleCount = itemsPerPage;
		await gallonActions.clearFilters();
	}
</script>

<div class="p-6">
	<!-- Header -->
	<div class="mb-6">
		<h1 class="text-2xl font-semibold text-gray-900">Manajemen Galon</h1>
		<p class="text-gray-500">Pantau galon pelanggan yang belum kembali</p>
	</div>

	<!-- Tab switcher -->
	<div class="mb-6 border-b border-gray-200">
		<nav class="-mb-px flex gap-6">
			<button
				type="button"
				on:click={() => (activeTab = 'stock')}
				class="border-b-2 px-1 py-3 text-sm font-medium {activeTab === 'stock'
					? 'border-maroon-600 text-maroon-600'
					: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
			>
				Stok Saat Ini
			</button>
			<button
				type="button"
				on:click={() => (activeTab = 'movements')}
				class="border-b-2 px-1 py-3 text-sm font-medium {activeTab === 'movements'
					? 'border-maroon-600 text-maroon-600'
					: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
			>
				Riwayat Pergerakan
			</button>
		</nav>
	</div>

	{#if activeTab === 'stock'}
		<!-- Filter -->
		<GallonFilter
			customers={$customers}
			on:filter={handleFilterChange}
			on:reset={handleFilterReset}
		/>

		<!-- Loading / Error state -->
		{#if $isLoading && $gallonStock.length === 0}
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
			<GallonTable stock={visibleStock} on:select={handleSelectRow} />

			<!-- Infinite scroll footer -->
			{#if $gallonStock.length > 0}
				<div
					class="mt-4 rounded-lg border-t border-gray-200 bg-white px-4 py-3 text-center shadow sm:px-6"
				>
					<p class="text-sm text-gray-500">
						Menampilkan <span class="font-medium">{visibleStock.length}</span> dari
						<span class="font-medium">{$gallonStock.length}</span> pelanggan
					</p>
					{#if hasMoreStock}
						<div
							use:infiniteScroll={{
								hasMore: hasMoreStock,
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
		{/if}
	{:else}
		<!-- Tab Riwayat Pergerakan -->
		<div class="mb-4 rounded-lg bg-white p-4 shadow">
			<label for="movements-search" class="mb-1 block text-xs font-medium text-gray-500">
				Cari Nama Pelanggan
			</label>
			<div class="md:w-96">
				<Autosuggest
					id="movements-search"
					bind:value={movementsQuery}
					items={$customers}
					getLabel={(c) => c.customer_name}
					getKey={(c) => c.id}
					placeholder="Cari nama pelanggan..."
					showClear
				/>
			</div>
		</div>

		{#if $movementsLoading && $movements.length === 0}
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
		{:else}
			<GallonMovementsTable movements={visibleMovements} isLoading={$movementsLoading} />

			<!-- Infinite scroll footer -->
			{#if filteredMovements.length > 0}
				<div
					class="mt-4 rounded-lg border-t border-gray-200 bg-white px-4 py-3 text-center shadow sm:px-6"
				>
					<p class="text-sm text-gray-500">
						Menampilkan <span class="font-medium">{visibleMovements.length}</span> dari
						<span class="font-medium">{filteredMovements.length}</span> riwayat
					</p>
					{#if hasMoreMovements}
						<div
							use:infiniteScroll={{
								hasMore: hasMoreMovements,
								onLoadMore: () => (movementsVisibleCount += itemsPerPage)
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
	{/if}
</div>

<style>
	:global(.border-maroon-600) {
		border-color: #800020;
	}
	:global(.text-maroon-600) {
		color: #800020;
	}
</style>
