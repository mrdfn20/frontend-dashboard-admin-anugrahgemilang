<!-- src/routes/dashboard/armada/+page.svelte -->
<script>
	import { onMount } from 'svelte';
	import { armadaActions, armadas, isLoading, error } from '$lib/stores/armada.js';
	import ArmadaForm from '$lib/components/armada/ArmadaForm.svelte';
	import ConfirmationModal from '$lib/components/ui/ConfirmationModal.svelte';

	let showForm = false;
	let showDeleteModal = false;
	let selectedArmada = null;
	let isDeleting = false;
	let deleteErrorMessage = '';

	onMount(async () => {
		await armadaActions.loadArmadas();
	});

	function handleAdd() {
		selectedArmada = null;
		showForm = true;
	}

	function handleEdit(armada) {
		selectedArmada = armada;
		showForm = true;
	}

	function handleDelete(armada) {
		selectedArmada = armada;
		deleteErrorMessage = '';
		showDeleteModal = true;
	}

	function handleFormSuccess() {
		showForm = false;
		selectedArmada = null;
	}

	async function confirmDelete() {
		if (!selectedArmada) return;
		isDeleting = true;
		deleteErrorMessage = '';
		try {
			await armadaActions.deleteArmada(selectedArmada.id);
			showDeleteModal = false;
			selectedArmada = null;
		} catch (err) {
			// Kasus umum: armada masih dipakai di transaksi - tampilkan pesan BE apa adanya
			deleteErrorMessage = err.message || 'Gagal menghapus armada';
		} finally {
			isDeleting = false;
		}
	}
</script>

<div class="p-6">
	<div class="mb-6">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-semibold text-gray-900">Kelola Armada</h1>
				<p class="text-gray-500">Daftar kendaraan pengiriman galon</p>
			</div>
			<button
				on:click={handleAdd}
				class="bg-maroon-600 hover:bg-maroon-700 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="mr-2 inline h-4 w-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				Tambah Armada
			</button>
		</div>
	</div>

	{#if $isLoading && $armadas.length === 0}
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
		<div class="overflow-x-auto rounded-lg bg-white shadow">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th
							class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							Nama Armada
						</th>
						<th
							class="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							Aksi
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200">
					{#each $armadas as armada (armada.id)}
						<tr class="hover:bg-gray-50">
							<td class="px-4 py-3 text-sm font-medium whitespace-nowrap text-gray-900">
								{armada.armada_name}
							</td>
							<td class="px-4 py-3 text-right text-sm whitespace-nowrap">
								<button
									type="button"
									on:click={() => handleEdit(armada)}
									class="text-maroon-600 hover:text-maroon-800 mr-3 font-medium"
								>
									Edit
								</button>
								<button
									type="button"
									on:click={() => handleDelete(armada)}
									class="font-medium text-red-600 hover:text-red-800"
								>
									Hapus
								</button>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="2" class="px-4 py-8 text-center text-sm text-gray-500">
								Belum ada armada.
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

{#if showForm}
	<ArmadaForm
		armada={selectedArmada}
		on:success={handleFormSuccess}
		on:cancel={() => (showForm = false)}
	/>
{/if}

{#if showDeleteModal && selectedArmada}
	<ConfirmationModal
		title="Hapus Armada"
		message={deleteErrorMessage ||
			`Yakin ingin menghapus armada "${selectedArmada.armada_name}"? Tindakan ini tidak dapat dibatalkan.`}
		confirmText="Hapus"
		isLoading={isDeleting}
		on:confirm={confirmDelete}
		on:cancel={() => (showDeleteModal = false)}
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
