<!-- src/routes/dashboard/customers/deleted/+page.svelte -->
<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { api } from '$lib/services/api.js';
	import { customerActions } from '$lib/stores/customers.js';
	import toast from 'svelte-french-toast';

	let deletedCustomers = [];
	let isLoading = true;
	let restoringId = null;

	async function load() {
		isLoading = true;
		try {
			deletedCustomers = await api.customers.getDeleted();
		} catch (err) {
			toast.error(err.message || 'Gagal memuat daftar pelanggan terhapus');
			deletedCustomers = [];
		} finally {
			isLoading = false;
		}
	}

	async function handleRestore(customer) {
		restoringId = customer.id;
		try {
			await customerActions.restoreCustomer(customer.id);
			deletedCustomers = deletedCustomers.filter((c) => c.id !== customer.id);
		} catch {
			// toast error udah ditangani di customerActions.restoreCustomer
		} finally {
			restoringId = null;
		}
	}

	function formatDate(value) {
		if (!value) return '-';
		return new Date(value).toLocaleString('id-ID', {
			dateStyle: 'medium',
			timeStyle: 'short'
		});
	}

	onMount(load);
</script>

<div class="p-6">
	<div class="mb-6 flex items-center justify-between">
		<div>
			<button
				on:click={() => goto('/dashboard/customers')}
				class="mb-2 text-sm text-gray-500 hover:text-gray-700"
			>
				&larr; Kembali ke Manajemen Pelanggan
			</button>
			<h1 class="text-2xl font-bold text-gray-900">Pelanggan Terhapus</h1>
			<p class="mt-1 text-gray-500">
				Pelanggan yang dihapus masih bisa dikembalikan dari sini kapan aja.
			</p>
		</div>
	</div>

	<div class="overflow-hidden rounded-lg bg-white shadow">
		{#if isLoading}
			<div class="p-8 text-center text-gray-400">Memuat...</div>
		{:else if deletedCustomers.length === 0}
			<div class="p-8 text-center text-gray-400">Gak ada pelanggan yang terhapus.</div>
		{:else}
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
							>Pelanggan</th
						>
						<th
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
							>Alamat</th
						>
						<th
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
							>Dihapus Pada</th
						>
						<th
							class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
							>Aksi</th
						>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200 bg-white">
					{#each deletedCustomers as customer (customer.id)}
						<tr>
							<td class="px-6 py-4">
								<div class="text-sm font-medium text-gray-900">
									{customer.title || ''}
									{customer.customer_name}
								</div>
								<div class="text-sm text-gray-500">ID: {customer.id}</div>
							</td>
							<td class="px-6 py-4 text-sm text-gray-700">{customer.address || '-'}</td>
							<td class="px-6 py-4 text-sm text-gray-700">{formatDate(customer.deleted_at)}</td>
							<td class="px-6 py-4 text-right">
								<button
									on:click={() => handleRestore(customer)}
									disabled={restoringId === customer.id}
									class="bg-maroon-600 hover:bg-maroon-700 rounded-md px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
								>
									{restoringId === customer.id ? 'Mengembalikan...' : 'Kembalikan'}
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</div>

<style>
	:global(.bg-maroon-600) {
		background-color: #800020;
	}
	:global(.hover\:bg-maroon-700:hover) {
		background-color: #600018;
	}
</style>
