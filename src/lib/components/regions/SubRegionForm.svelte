<!-- src/lib/components/regions/SubRegionForm.svelte -->
<script>
	import { lockBodyScroll } from '$lib/actions/lockBodyScroll.js';
	import { createEventDispatcher } from 'svelte';
	import { regionActions, regions, subRegions } from '$lib/stores/regions.js';
	import Autosuggest from '$lib/components/ui/Autosuggest.svelte';

	// Props
	export let subRegion = null; // null = tambah, object = edit

	const dispatch = createEventDispatcher();

	let region_id = subRegion ? subRegion.region_id : '';
	let sub_region_name = subRegion ? subRegion.sub_region_name : '';
	let errorMessage = '';
	let isSubmitting = false;
	let isEdit = !!subRegion;

	async function handleSubmit() {
		errorMessage = '';
		if (!region_id) {
			errorMessage = 'Kecamatan wajib dipilih';
			return;
		}
		if (!sub_region_name.trim()) {
			errorMessage = 'Nama sub-wilayah wajib diisi';
			return;
		}

		isSubmitting = true;
		try {
			if (isEdit) {
				await regionActions.updateSubRegion(
					subRegion.id,
					Number(region_id),
					sub_region_name.trim()
				);
			} else {
				await regionActions.createSubRegion(Number(region_id), sub_region_name.trim());
			}
			dispatch('success');
		} catch (error) {
			console.error('Form submission error:', error);
		} finally {
			isSubmitting = false;
		}
	}

	function handleCancel() {
		dispatch('cancel');
	}
</script>

<div class="fixed inset-0 z-50 overflow-y-auto" use:lockBodyScroll>
	<div class="flex min-h-screen items-center justify-center px-4 py-6">
		<div
			class="fixed inset-0 bg-white/20 backdrop-blur-md transition-all duration-300"
			on:click={handleCancel}
			role="presentation"
		></div>

		<div class="relative w-full max-w-md transform rounded-lg bg-white shadow-xl transition-all">
			<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
				<h3 class="text-lg font-medium text-gray-900">
					{isEdit ? 'Edit Sub-Wilayah' : 'Tambah Sub-Wilayah'}
				</h3>
				<button on:click={handleCancel} class="text-gray-400 hover:text-gray-600">
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

			<form on:submit|preventDefault={handleSubmit} class="space-y-4 px-6 py-4">
				<div>
					<label for="sub-region-region" class="block text-sm font-medium text-gray-700">
						Kecamatan <span class="text-red-500">*</span>
					</label>
					<select
						id="sub-region-region"
						bind:value={region_id}
						class="focus:border-maroon-500 focus:ring-maroon-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
					>
						<option value="">Pilih kecamatan...</option>
						{#each $regions as r (r.id)}
							<option value={r.id}>{r.region_name} ({r.region_type})</option>
						{/each}
					</select>
				</div>

				<div>
					<label for="sub-region-name" class="block text-sm font-medium text-gray-700">
						Nama Sub-Wilayah <span class="text-red-500">*</span>
					</label>
					<Autosuggest
						id="sub-region-name"
						bind:value={sub_region_name}
						items={$subRegions}
						getLabel={(sr) => sr.sub_region_name}
						getKey={(sr) => sr.id}
						placeholder="mis. Perum Bumi Ciruas Permai 1"
						inputClass="focus:border-maroon-500 focus:ring-maroon-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
					>
						<svelte:fragment slot="item" let:item>
							<span class="text-gray-900">{item.sub_region_name}</span>
							<span class="ml-2 shrink-0 text-xs text-gray-400">{item.region_name}</span>
						</svelte:fragment>
					</Autosuggest>
					<p class="mt-1 text-xs text-gray-400">
						Muncul saran kalau ada nama mirip yang sudah ada - buat cek biar gak dobel.
					</p>
				</div>

				{#if errorMessage}
					<p class="text-sm text-red-600">{errorMessage}</p>
				{/if}

				<div class="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
					<button
						type="button"
						on:click={handleCancel}
						disabled={isSubmitting}
						class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
					>
						Batal
					</button>
					<button
						type="submit"
						disabled={isSubmitting}
						class="bg-maroon-600 hover:bg-maroon-700 rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm disabled:opacity-50"
					>
						{isSubmitting ? 'Menyimpan...' : 'Simpan'}
					</button>
				</div>
			</form>
		</div>
	</div>
</div>

<style>
	:global(.bg-maroon-600) {
		background-color: #800020;
	}
	:global(.hover\:bg-maroon-700:hover) {
		background-color: #600018;
	}
	:global(.focus\:border-maroon-500:focus) {
		border-color: #800020;
	}
	:global(.focus\:ring-maroon-500:focus) {
		--tw-ring-color: rgba(128, 0, 32, 0.5);
	}
</style>
