<!-- src/lib/components/gallon/GallonTable.svelte -->
<script>
	import { createEventDispatcher } from 'svelte';
	import SortableHeader from '$lib/components/ui/SortableHeader.svelte';
	import TableSorter from '$lib/components/ui/TableSorter.svelte';

	// Props
	export let stock = [];

	const dispatch = createEventDispatcher();

	function getBadgeClass(unreturned) {
		const n = Number(unreturned);
		if (n <= 0) return 'bg-green-100 text-green-800';
		if (n <= 5) return 'bg-yellow-100 text-yellow-800';
		return 'bg-red-100 text-red-800';
	}

	function handleRowClick(row) {
		dispatch('select', row);
	}
</script>

<TableSorter
	data={stock}
	storageKey="gallon_table_sort"
	let:sortedData
	let:toggleSort
	let:sortState
>
	<!-- Desktop table -->
	<div class="hidden overflow-x-auto rounded-lg bg-white shadow md:block">
		<table class="min-w-full divide-y divide-gray-200">
			<thead class="bg-gray-50">
				<tr>
					<th class="px-4 py-3 text-left">
						<SortableHeader column="customer_name" {sortState} {toggleSort}
							>Pelanggan</SortableHeader
						>
					</th>
					<th
						class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Sub Wilayah
					</th>
					<th class="px-4 py-3 text-left">
						<SortableHeader column="unreturned_gallons" {sortState} {toggleSort}
							>Galon Belum Retur</SortableHeader
						>
					</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200">
				{#each sortedData as row (row.customer_id)}
					<tr class="cursor-pointer hover:bg-gray-50" on:click={() => handleRowClick(row)}>
						<td class="px-4 py-3 text-sm font-medium whitespace-nowrap text-gray-900">
							{row.customer_name}
						</td>
						<td class="px-4 py-3 text-sm whitespace-nowrap text-gray-700">
							{row.sub_region_name || '-'}
						</td>
						<td class="px-4 py-3 text-sm whitespace-nowrap">
							<span
								class="rounded-full px-2 py-1 text-xs font-medium {getBadgeClass(
									row.unreturned_gallons
								)}"
							>
								{row.unreturned_gallons} galon
							</span>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="3" class="px-4 py-8 text-center text-sm text-gray-500">
							Tidak ada data ditemukan.
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Mobile cards -->
	<div class="space-y-3 md:hidden">
		{#each sortedData as row (row.customer_id)}
			<button
				type="button"
				on:click={() => handleRowClick(row)}
				class="block w-full rounded-lg bg-white p-4 text-left shadow"
			>
				<div class="flex items-center justify-between">
					<div>
						<p class="font-medium text-gray-900">{row.customer_name}</p>
						<p class="text-xs text-gray-500">{row.sub_region_name || '-'}</p>
					</div>
					<span
						class="rounded-full px-2 py-1 text-xs font-medium {getBadgeClass(
							row.unreturned_gallons
						)}"
					>
						{row.unreturned_gallons} galon
					</span>
				</div>
			</button>
		{:else}
			<div class="rounded-lg bg-white p-8 text-center text-sm text-gray-500 shadow">
				Tidak ada data ditemukan.
			</div>
		{/each}
	</div>
</TableSorter>
