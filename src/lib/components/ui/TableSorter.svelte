<script>
	import { writable } from 'svelte/store';
	import { browser } from '$app/environment';

	// Props
	export let data = [];
	export let storageKey = 'table_sort';
	export let defaultSort = { column: null, direction: 'asc' };

	// Stores
	const sortState = writable(defaultSort);

	// Load saved sort from localStorage
	if (browser) {
		const saved = localStorage.getItem(storageKey);
		if (saved) {
			try {
				sortState.set(JSON.parse(saved));
			} catch {
				console.warn('Failed to parse saved sort state');
			}
		}
	}

	// Sort function
	function sortData(data, column, direction) {
		if (!column) return data;

		return [...data].sort((a, b) => {
			let aVal = a[column];
			let bVal = b[column];

			// Handle null/undefined values
			if (aVal == null) aVal = '';
			if (bVal == null) bVal = '';

			// Type detection and comparison
			if (typeof aVal === 'number' && typeof bVal === 'number') {
				return direction === 'asc' ? aVal - bVal : bVal - aVal;
			}

			// String comparison (case insensitive)
			aVal = String(aVal).toLowerCase();
			bVal = String(bVal).toLowerCase();

			if (direction === 'asc') {
				return aVal.localeCompare(bVal);
			} else {
				return bVal.localeCompare(aVal);
			}
		});
	}

	// Toggle sort
	export function toggleSort(column) {
		sortState.update((current) => {
			let newDirection;

			if (current.column === column) {
				// Toggle direction
				newDirection = current.direction === 'asc' ? 'desc' : 'asc';
			} else {
				// New column, start with asc
				newDirection = 'asc';
			}

			const newState = { column, direction: newDirection };

			// Save to localStorage
			if (browser) {
				localStorage.setItem(storageKey, JSON.stringify(newState));
			}

			return newState;
		});
	}

	// Reactive sorted data
	$: sortedData = sortData(data, $sortState.column, $sortState.direction);

	// Export current sort state for parent component
	export { sortState };
</script>

<!-- src/lib/components/ui/TableSorter.svelte -->
<!-- This component doesn't render anything, just provides logic -->
<slot {sortedData} {toggleSort} sortState={$sortState} />
