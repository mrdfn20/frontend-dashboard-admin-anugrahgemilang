<!-- src/lib/components/ui/Autosuggest.svelte -->
<!-- Input teks + dropdown saran, keyboard-navigable (ArrowUp/Down, Enter, Escape). -->
<script>
	import { createEventDispatcher } from 'svelte';

	export let id = undefined;
	export let value = '';
	export let items = [];
	export let getLabel = (item) => String(item);
	export let getKey = (item) => item?.id ?? item;
	export let filterFn = null; // (item, query) => bool - default: substring match di getLabel(item)
	export let placeholder = '';
	export let inputClass =
		'focus:ring-maroon-500 focus:border-maroon-500 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none';
	export let hasError = false;
	export let maxResults = 20;
	export let showClear = false;
	export let noResultsText = null;
	export let disabled = false;

	const dispatch = createEventDispatcher();

	let showSuggestions = false;
	let highlightedIndex = -1;

	$: filtered = (() => {
		const q = String(value || '')
			.trim()
			.toLowerCase();
		if (!q) return [];
		const test = filterFn || ((item) => getLabel(item).toLowerCase().includes(q));
		return items.filter((item) => test(item, q)).slice(0, maxResults);
	})();

	// Reset highlight tiap kali daftar saran berubah, biar gak nyasar ke index lama
	$: filtered, (highlightedIndex = -1);

	function handleInput() {
		showSuggestions = true;
		dispatch('input', value);
	}

	function select(item) {
		showSuggestions = false;
		highlightedIndex = -1;
		dispatch('select', item);
	}

	function handleClear() {
		showSuggestions = false;
		highlightedIndex = -1;
		dispatch('clear');
	}

	function handleBlur() {
		// Delay dikit supaya klik di item suggestion sempat ketangkep dulu sebelum list ditutup
		setTimeout(() => (showSuggestions = false), 150);
	}

	// Navigasi panah atas/bawah + Enter buat pilih saran tanpa mouse. Enter TANPA saran
	// yang lagi disorot dibiarkan lolos (gak di-preventDefault) - biar <form> pembungkus
	// tetap bisa submit normal lewat Enter.
	function handleKeydown(event) {
		if (!showSuggestions || filtered.length === 0) return;

		if (event.key === 'ArrowDown') {
			event.preventDefault();
			highlightedIndex = (highlightedIndex + 1) % filtered.length;
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			highlightedIndex = (highlightedIndex - 1 + filtered.length) % filtered.length;
		} else if (event.key === 'Enter') {
			if (highlightedIndex >= 0) {
				event.preventDefault();
				select(filtered[highlightedIndex]);
			}
		} else if (event.key === 'Escape') {
			showSuggestions = false;
		}
	}
</script>

<div class="relative">
	<input
		{id}
		type="text"
		autocomplete="off"
		{placeholder}
		{disabled}
		bind:value
		on:input={handleInput}
		on:keydown={handleKeydown}
		on:focus={() => (showSuggestions = true)}
		on:blur={handleBlur}
		class={inputClass}
		class:border-red-300={hasError}
	/>

	{#if showClear && value}
		<button
			type="button"
			on:mousedown|preventDefault={handleClear}
			class="absolute top-1/2 right-2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
			title="Bersihkan"
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

	{#if showSuggestions && filtered.length > 0}
		<ul
			class="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg"
		>
			{#each filtered as item, i (getKey(item))}
				<li>
					<button
						type="button"
						on:mousedown|preventDefault={() => select(item)}
						on:mouseenter={() => (highlightedIndex = i)}
						class="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50 {i ===
						highlightedIndex
							? 'bg-gray-50'
							: ''}"
					>
						<slot name="item" {item}>
							<span class="text-gray-900">{getLabel(item)}</span>
						</slot>
					</button>
				</li>
			{/each}
		</ul>
	{:else if showSuggestions && noResultsText && String(value || '').trim() && filtered.length === 0}
		<div
			class="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 shadow-lg"
		>
			{noResultsText}
		</div>
	{/if}
</div>
