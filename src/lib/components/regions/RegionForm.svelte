<!-- src/lib/components/regions/RegionForm.svelte -->
<script>
	import { createEventDispatcher } from 'svelte';
	import { regionActions } from '$lib/stores/regions.js';

	// Props
	export let region = null; // null = tambah, object = edit

	const dispatch = createEventDispatcher();

	let region_name = region ? region.region_name : '';
	let region_type = region ? region.region_type : 'Kabupaten';
	let errorMessage = '';
	let isSubmitting = false;
	let isEdit = !!region;

	async function handleSubmit() {
		errorMessage = '';
		if (!region_name.trim()) {
			errorMessage = 'Nama kecamatan wajib diisi';
			return;
		}

		isSubmitting = true;
		try {
			if (isEdit) {
				await regionActions.updateRegion(region.id, region_name.trim(), region_type);
			} else {
				await regionActions.createRegion(region_name.trim(), region_type);
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

<div class="fixed inset-0 z-50 overflow-y-auto">
	<div class="flex min-h-screen items-center justify-center px-4 py-6">
		<div
			class="fixed inset-0 bg-white/20 backdrop-blur-md transition-all duration-300"
			on:click={handleCancel}
			role="presentation"
		></div>

		<div class="relative w-full max-w-md transform rounded-lg bg-white shadow-xl transition-all">
			<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
				<h3 class="text-lg font-medium text-gray-900">
					{isEdit ? 'Edit Kecamatan' : 'Tambah Kecamatan'}
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
					<label for="region-name" class="block text-sm font-medium text-gray-700">
						Nama Kecamatan <span class="text-red-500">*</span>
					</label>
					<input
						id="region-name"
						type="text"
						bind:value={region_name}
						placeholder="mis. Ciruas"
						class="focus:border-maroon-500 focus:ring-maroon-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
						class:border-red-300={errorMessage}
					/>
					{#if errorMessage}
						<p class="mt-1 text-sm text-red-600">{errorMessage}</p>
					{/if}
				</div>

				<div>
					<label for="region-type" class="block text-sm font-medium text-gray-700">
						Tipe Wilayah <span class="text-red-500">*</span>
					</label>
					<select
						id="region-type"
						bind:value={region_type}
						class="focus:border-maroon-500 focus:ring-maroon-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
					>
						<option value="Kabupaten">Kabupaten</option>
						<option value="Kota">Kota</option>
					</select>
				</div>

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
