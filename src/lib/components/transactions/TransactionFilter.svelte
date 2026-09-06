<!-- src/lib/components/transactions/TransactionFilter.svelte -->
<script>
	import { createEventDispatcher } from 'svelte';
	import Autosuggest from '$lib/components/ui/Autosuggest.svelte';

	// Props
	export let customers = []; // dipakai utk menurunkan daftar sub-region tanpa call BE baru, & autosuggest nama

	const dispatch = createEventDispatcher();

	// Local filter form state (dikirim ke parent saat "Terapkan" ditekan)
	let customer_name = '';
	let sub_region_name = '';
	let startDate = '';
	let endDate = '';
	let sortBy = 'transaction_date';
	let sortOrder = 'DESC';

	// Sub-region diturunkan dari data customers yang sudah ke-load (client-side, tanpa BE call baru)
	$: subRegionOptions = [
		...new Set(customers.map((c) => c.sub_region_name).filter(Boolean))
	].sort();

	function applyFilters() {
		dispatch('filter', {
			customer_name: customer_name.trim(),
			sub_region_name,
			startDate: startDate || null,
			endDate: endDate || null,
			sortBy,
			sortOrder
		});
	}

	function resetFilters() {
		customer_name = '';
		sub_region_name = '';
		startDate = '';
		endDate = '';
		sortBy = 'transaction_date';
		sortOrder = 'DESC';
		dispatch('reset');
	}
</script>

<form on:submit|preventDefault={applyFilters} class="mb-4 rounded-lg bg-white p-4 shadow">
	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
		<!-- Nama pelanggan -->
		<div class="lg:col-span-2">
			<label for="filter-customer-name" class="mb-1 block text-xs font-medium text-gray-500">
				Nama Pelanggan
			</label>
			<Autosuggest
				id="filter-customer-name"
				bind:value={customer_name}
				items={customers}
				getLabel={(c) => c.customer_name}
				getKey={(c) => c.id}
				placeholder="Cari nama pelanggan..."
				showClear
			/>
		</div>

		<!-- Sub-region -->
		<div>
			<label for="filter-sub-region" class="mb-1 block text-xs font-medium text-gray-500">
				Sub Wilayah
			</label>
			<select
				id="filter-sub-region"
				bind:value={sub_region_name}
				class="focus:ring-maroon-500 focus:border-maroon-500 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none"
			>
				<option value="">Semua</option>
				{#each subRegionOptions as region (region)}
					<option value={region}>{region}</option>
				{/each}
			</select>
		</div>

		<!-- Tanggal mulai -->
		<div>
			<label for="filter-start-date" class="mb-1 block text-xs font-medium text-gray-500">
				Dari Tanggal
			</label>
			<input
				id="filter-start-date"
				type="date"
				bind:value={startDate}
				class="focus:ring-maroon-500 focus:border-maroon-500 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none"
			/>
		</div>

		<!-- Tanggal akhir -->
		<div>
			<label for="filter-end-date" class="mb-1 block text-xs font-medium text-gray-500">
				Sampai Tanggal
			</label>
			<input
				id="filter-end-date"
				type="date"
				bind:value={endDate}
				class="focus:ring-maroon-500 focus:border-maroon-500 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none"
			/>
		</div>

		<!-- Sort -->
		<div>
			<label for="filter-sort" class="mb-1 block text-xs font-medium text-gray-500">
				Urutkan
			</label>
			<div class="flex gap-1">
				<select
					id="filter-sort"
					bind:value={sortBy}
					class="focus:ring-maroon-500 focus:border-maroon-500 block w-full rounded-md border border-gray-300 px-2 py-2 text-sm shadow-sm focus:outline-none"
				>
					<option value="transaction_date">Tanggal</option>
					<option value="customer_name">Nama</option>
				</select>
				<button
					type="button"
					on:click={() => (sortOrder = sortOrder === 'ASC' ? 'DESC' : 'ASC')}
					title={sortOrder === 'ASC' ? 'A-Z / Terlama dulu' : 'Z-A / Terbaru dulu'}
					class="rounded-md border border-gray-300 px-2 py-2 text-sm text-gray-600 hover:bg-gray-50"
				>
					{sortOrder === 'ASC' ? '↑' : '↓'}
				</button>
			</div>
		</div>
	</div>

	<div class="mt-3 flex justify-end gap-2">
		<button
			type="button"
			on:click={resetFilters}
			class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
		>
			Reset
		</button>
		<button
			type="submit"
			class="bg-maroon-600 hover:bg-maroon-700 rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm"
		>
			Terapkan Filter
		</button>
	</div>
</form>
