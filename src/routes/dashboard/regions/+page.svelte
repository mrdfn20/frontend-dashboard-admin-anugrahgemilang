<!-- src/routes/dashboard/regions/+page.svelte -->
<script>
	import { onMount } from 'svelte';
	import { regionActions, regions, subRegions, isLoading, error } from '$lib/stores/regions.js';
	import RegionForm from '$lib/components/regions/RegionForm.svelte';
	import SubRegionForm from '$lib/components/regions/SubRegionForm.svelte';
	import ConfirmationModal from '$lib/components/ui/ConfirmationModal.svelte';

	let showRegionForm = false;
	let selectedRegion = null;
	let showSubRegionForm = false;
	let selectedSubRegion = null;

	let deleteTarget = null; // { type: 'region' | 'subRegion', item }
	let isDeleting = false;
	let deleteErrorMessage = '';

	onMount(async () => {
		await regionActions.loadAll();
	});

	function handleAddRegion() {
		selectedRegion = null;
		showRegionForm = true;
	}
	function handleEditRegion(region) {
		selectedRegion = region;
		showRegionForm = true;
	}
	function handleAddSubRegion() {
		selectedSubRegion = null;
		showSubRegionForm = true;
	}
	function handleEditSubRegion(subRegion) {
		selectedSubRegion = subRegion;
		showSubRegionForm = true;
	}

	function handleDelete(type, item) {
		deleteTarget = { type, item };
		deleteErrorMessage = '';
	}

	async function confirmDelete() {
		if (!deleteTarget) return;
		isDeleting = true;
		deleteErrorMessage = '';
		try {
			if (deleteTarget.type === 'region') {
				await regionActions.deleteRegion(deleteTarget.item.id);
			} else {
				await regionActions.deleteSubRegion(deleteTarget.item.id);
			}
			deleteTarget = null;
		} catch (err) {
			// Kasus umum: masih dipakai sub-wilayah/pelanggan lain - tampilkan pesan BE apa adanya
			deleteErrorMessage = err.message || 'Gagal menghapus';
		} finally {
			isDeleting = false;
		}
	}
</script>

<div class="p-6">
	<div class="mb-6">
		<h1 class="text-2xl font-semibold text-gray-900">Kelola Wilayah</h1>
		<p class="text-gray-500">Kecamatan (region) & sub-wilayah (kompleks/desa) pelanggan</p>
	</div>

	{#if $isLoading && $regions.length === 0}
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
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<!-- Kecamatan -->
			<div>
				<div class="mb-3 flex items-center justify-between">
					<h2 class="text-lg font-medium text-gray-900">Kecamatan</h2>
					<button
						on:click={handleAddRegion}
						class="bg-maroon-600 hover:bg-maroon-700 rounded-md px-3 py-1.5 text-sm font-medium text-white"
					>
						+ Tambah Kecamatan
					</button>
				</div>
				<div class="overflow-x-auto rounded-lg bg-white shadow">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th
									class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
								>
									Nama
								</th>
								<th
									class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
								>
									Tipe
								</th>
								<th
									class="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
								>
									Aksi
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200">
							{#each $regions as region (region.id)}
								<tr class="hover:bg-gray-50">
									<td class="px-4 py-3 text-sm font-medium whitespace-nowrap text-gray-900">
										{region.region_name}
									</td>
									<td class="px-4 py-3 text-sm whitespace-nowrap text-gray-500">
										{region.region_type}
									</td>
									<td class="px-4 py-3 text-right text-sm whitespace-nowrap">
										<button
											type="button"
											on:click={() => handleEditRegion(region)}
											class="text-maroon-600 hover:text-maroon-800 mr-3 font-medium"
										>
											Edit
										</button>
										<button
											type="button"
											on:click={() => handleDelete('region', region)}
											class="font-medium text-red-600 hover:text-red-800"
										>
											Hapus
										</button>
									</td>
								</tr>
							{:else}
								<tr>
									<td colspan="3" class="px-4 py-8 text-center text-sm text-gray-500">
										Belum ada kecamatan.
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>

			<!-- Sub-Wilayah -->
			<div>
				<div class="mb-3 flex items-center justify-between">
					<h2 class="text-lg font-medium text-gray-900">Sub-Wilayah</h2>
					<button
						on:click={handleAddSubRegion}
						class="bg-maroon-600 hover:bg-maroon-700 rounded-md px-3 py-1.5 text-sm font-medium text-white"
					>
						+ Tambah Sub-Wilayah
					</button>
				</div>
				<div class="max-h-[32rem] overflow-x-auto overflow-y-auto rounded-lg bg-white shadow">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="sticky top-0 bg-gray-50">
							<tr>
								<th
									class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
								>
									Nama
								</th>
								<th
									class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
								>
									Kecamatan
								</th>
								<th
									class="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
								>
									Aksi
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200">
							{#each $subRegions as subRegion (subRegion.id)}
								<tr class="hover:bg-gray-50">
									<td class="px-4 py-3 text-sm font-medium whitespace-nowrap text-gray-900">
										{subRegion.sub_region_name}
									</td>
									<td class="px-4 py-3 text-sm whitespace-nowrap text-gray-500">
										{subRegion.region_name || '-'}
									</td>
									<td class="px-4 py-3 text-right text-sm whitespace-nowrap">
										<button
											type="button"
											on:click={() => handleEditSubRegion(subRegion)}
											class="text-maroon-600 hover:text-maroon-800 mr-3 font-medium"
										>
											Edit
										</button>
										<button
											type="button"
											on:click={() => handleDelete('subRegion', subRegion)}
											class="font-medium text-red-600 hover:text-red-800"
										>
											Hapus
										</button>
									</td>
								</tr>
							{:else}
								<tr>
									<td colspan="3" class="px-4 py-8 text-center text-sm text-gray-500">
										Belum ada sub-wilayah.
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	{/if}
</div>

{#if showRegionForm}
	<RegionForm
		region={selectedRegion}
		on:success={() => (showRegionForm = false)}
		on:cancel={() => (showRegionForm = false)}
	/>
{/if}

{#if showSubRegionForm}
	<SubRegionForm
		subRegion={selectedSubRegion}
		on:success={() => (showSubRegionForm = false)}
		on:cancel={() => (showSubRegionForm = false)}
	/>
{/if}

{#if deleteTarget}
	<ConfirmationModal
		title={deleteTarget.type === 'region' ? 'Hapus Kecamatan' : 'Hapus Sub-Wilayah'}
		message={deleteErrorMessage ||
			`Yakin ingin menghapus "${deleteTarget.type === 'region' ? deleteTarget.item.region_name : deleteTarget.item.sub_region_name}"? Tindakan ini tidak dapat dibatalkan.`}
		confirmText="Hapus"
		isLoading={isDeleting}
		on:confirm={confirmDelete}
		on:cancel={() => (deleteTarget = null)}
	/>
{/if}

<style>
	:global(.bg-maroon-600) {
		background-color: #800020;
	}
	:global(.hover\:bg-maroon-700:hover) {
		background-color: #600018;
	}
	:global(.text-maroon-600) {
		color: #800020;
	}
	:global(.hover\:text-maroon-800:hover) {
		color: #4a0012;
	}
</style>
