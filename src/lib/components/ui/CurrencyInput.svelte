<!-- src/lib/components/ui/CurrencyInput.svelte -->
<script>
	import { tick } from 'svelte';
	import { selectOnFocus } from '$lib/actions/selectOnFocus.js';

	// Props
	export let id = '';
	export let value = 0; // numeric, bindable dari parent (bind:value)
	export let placeholder = '0';
	export let hasError = false;
	export let disabled = false;

	const formatter = new Intl.NumberFormat('id-ID');

	// Tampilan input (dgn pemisah ribuan) selalu mengikuti `value` - baik value berubah
	// dari ketikan user (lewat handleInput di bawah) maupun dari luar (mis. form direset).
	$: displayValue = value ? formatter.format(value) : '';

	async function handleInput(e) {
		// Ambil digit doang dari yang diketik user, sisanya (titik pemisah dll) diabaikan
		const digitsOnly = e.target.value.replace(/\D/g, '');
		value = digitsOnly ? parseInt(digitsOnly, 10) : 0;

		// Tunggu DOM ke-update dgn displayValue baru, baru posisikan kursor ke akhir
		await tick();
		const pos = e.target.value.length;
		e.target.setSelectionRange(pos, pos);
	}
</script>

<input
	{id}
	type="text"
	inputmode="numeric"
	{disabled}
	{placeholder}
	value={displayValue}
	on:input={handleInput}
	use:selectOnFocus
	class="focus:border-maroon-500 focus:ring-maroon-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm disabled:bg-gray-100"
	class:border-red-300={hasError}
/>
