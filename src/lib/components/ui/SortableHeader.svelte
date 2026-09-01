<script>
	export let column;
	export let sortState;
	export let toggleSort;

	$: isActive = sortState.column === column;
	$: direction = sortState.direction;
</script>

<!-- src/lib/components/ui/SortableHeader.svelte -->
<button
	on:click={() => toggleSort(column)}
	class="group flex items-center space-x-1 text-left text-xs font-medium tracking-wider text-gray-500 uppercase transition-colors duration-200 hover:text-gray-700"
>
	<span><slot /></span>

	<!-- Sort indicators -->
	<div class="ml-1 flex flex-col">
		<!-- Up arrow -->
		<svg
			class="h-3 w-3 transition-all duration-200 {isActive && direction === 'asc'
				? 'text-maroon-600'
				: 'text-gray-300 group-hover:text-gray-400'}"
			fill="currentColor"
			viewBox="0 0 20 20"
		>
			<path
				fill-rule="evenodd"
				d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
				clip-rule="evenodd"
			/>
		</svg>

		<!-- Down arrow -->
		<svg
			class="-mt-1 h-3 w-3 transition-all duration-200 {isActive && direction === 'desc'
				? 'text-maroon-600'
				: 'text-gray-300 group-hover:text-gray-400'}"
			fill="currentColor"
			viewBox="0 0 20 20"
		>
			<path
				fill-rule="evenodd"
				d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
				clip-rule="evenodd"
			/>
		</svg>
	</div>
</button>
