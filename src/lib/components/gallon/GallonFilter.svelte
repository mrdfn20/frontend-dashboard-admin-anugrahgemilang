<!-- src/lib/components/gallon/GallonFilter.svelte -->
<script>
	import { createEventDispatcher } from 'svelte';
	import { selectOnFocus } from '$lib/actions/selectOnFocus.js';

	// Props
	export let customers = []; // dipakai utk menurunkan daftar sub-region tanpa call BE baru

	const dispatch = createEventDispatcher();

	let customer_name = '';
	let sub_region_name = '';
	let stockLimit = '';
	let sortBy = 'customer_name';
	let sortOrder = 'ASC';

	$: subRegionOptions = [
		...new Set(customers.map((c) => c.sub_region_name).filter(Boolean))
	].sort();

	function applyFilters() {
		dispatch('filter', {
			customer_name: customer_name.trim(),
			sub_region_name,
			stockLimit: stockLimit === '' ? null : parseInt(stockLimit),
			sortBy,
			sortOrder
		});
	}

	function resetFilters() {
		customer_name = '';
		sub_region_name = '';
		stockLimit = '';
		sortBy = 'customer_name';
		sortOrder = 'ASC';
		dispatch('reset');
	}
</script>

<form on:submit|preventDefault={applyFilters} class="mb-4 rounded-lg bg-white p-4 shadow">
	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
		<div class="lg:col-span-2">
			<label for="gallon-filter-customer-name" class="mb-1 block text-xs font-medium text-gray-500">
				Nama Pelanggan
			</label>
			<input
				id="gallon-filter-customer-name"
				type="text"
				bind:value={customer_name}
				placeholder="Cari nama pelanggan..."
				class="focus:ring-maroon-500 focus:border-maroon-500 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none"
			/>
		</div>

		<div>
			<label for="gallon-filter-sub-region" class="mb-1 block text-xs font-medium text-gray-500">
				Sub Wilayah
			</label>
			<select
				id="gallon-filter-sub-region"
				bind:value={sub_region_name}
				class="focus:ring-maroon-500 focus:border-maroon-500 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none"
			>
				<option value="">Semua</option>
				{#each subRegionOptions as region (region)}
					<option value={region}>{region}</option>
				{/each}
			</select>
		</div>

		<div>
			<label for="gallon-filter-stock-limit" class="mb-1 block text-xs font-medium text-gray-500">
				Min. Galon Belum Retur
			</label>
			<input
				id="gallon-filter-stock-limit"
				type="number"
				min="0"
				bind:value={stockLimit}
				use:selectOnFocus
				placeholder="mis. 5"
				class="focus:ring-maroon-500 focus:border-maroon-500 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none"
			/>
		</div>

		<div>
			<label for="gallon-filter-sort" class="mb-1 block text-xs font-medium text-gray-500">
				Urutkan
			</label>
			<div class="flex gap-1">
				<select
					id="gallon-filter-sort"
					bind:value={sortBy}
					class="focus:ring-maroon-500 focus:border-maroon-500 block w-full rounded-md border border-gray-300 px-2 py-2 text-sm shadow-sm focus:outline-none"
				>
					<option value="customer_name">Nama</option>
					<option value="unreturned_gallons">Galon Belum Retur</option>
					<option value="sub_region_name">Sub Wilayah</option>
				</select>
				<button
					type="button"
					on:click={() => (sortOrder = sortOrder === 'ASC' ? 'DESC' : 'ASC')}
					title={sortOrder === 'ASC' ? 'A-Z / Terkecil dulu' : 'Z-A / Terbesar dulu'}
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
