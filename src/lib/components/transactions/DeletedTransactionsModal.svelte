<!-- src/lib/components/transactions/DeletedTransactionsModal.svelte -->
<script>
	import { lockBodyScroll } from '$lib/actions/lockBodyScroll.js';
	import { createEventDispatcher } from 'svelte';
	import { transactionActions, transactionHelpers } from '$lib/stores/transactions.js';

	// Props
	export let deletedTransactions = [];
	export let isLoading = false;

	const dispatch = createEventDispatcher();

	let restoringId = null;

	function handleClose() {
		dispatch('cancel');
	}

	async function handleRestore(transaction) {
		restoringId = transaction.id;
		try {
			await transactionActions.restoreTransaction(transaction.id);
		} catch (error) {
			console.error('Restore error:', error);
		} finally {
			restoringId = null;
		}
	}

	function formatDateTime(dateString) {
		if (!dateString) return '-';
		return new Date(dateString).toLocaleString('id-ID', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="fixed inset-0 z-50 overflow-y-auto" use:lockBodyScroll>
	<div class="flex min-h-screen items-center justify-center px-4 py-6">
		<div
			class="fixed inset-0 bg-white/20 backdrop-blur-md transition-all duration-300"
			on:click={handleClose}
			role="presentation"
		></div>

		<div class="relative w-full max-w-2xl transform rounded-lg bg-white shadow-xl transition-all">
			<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
				<h3 class="text-lg font-medium text-gray-900">Transaksi Terhapus</h3>
				<button on:click={handleClose} class="text-gray-400 hover:text-gray-600">
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

			<div class="max-h-[28rem] overflow-y-auto px-6 py-4">
				{#if isLoading && deletedTransactions.length === 0}
					<p class="py-8 text-center text-sm text-gray-400">Memuat...</p>
				{:else if deletedTransactions.length === 0}
					<p class="py-8 text-center text-sm text-gray-400">Tidak ada transaksi yang terhapus.</p>
				{:else}
					<div class="overflow-x-auto rounded-md border border-gray-100">
						<table class="min-w-full divide-y divide-gray-100 text-sm">
							<thead class="bg-gray-50">
								<tr>
									<th class="px-3 py-2 text-left font-medium text-gray-500">Pelanggan</th>
									<th class="px-3 py-2 text-left font-medium text-gray-500">Total</th>
									<th class="px-3 py-2 text-left font-medium text-gray-500">Dihapus Pada</th>
									<th class="px-3 py-2 text-right font-medium text-gray-500">Aksi</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-100">
								{#each deletedTransactions as transaction (transaction.id)}
									<tr>
										<td class="px-3 py-2 whitespace-nowrap text-gray-900">
											#{transaction.id} - {transaction.customer_name}
										</td>
										<td class="px-3 py-2 whitespace-nowrap text-gray-700">
											{transactionHelpers.formatCurrency(transaction.total_price)}
										</td>
										<td class="px-3 py-2 whitespace-nowrap text-gray-500">
											{formatDateTime(transaction.deleted_at)}
										</td>
										<td class="px-3 py-2 text-right whitespace-nowrap">
											<button
												type="button"
												on:click={() => handleRestore(transaction)}
												disabled={restoringId === transaction.id}
												class="text-maroon-600 hover:text-maroon-800 font-medium disabled:opacity-50"
											>
												{restoringId === transaction.id ? 'Memulihkan...' : 'Pulihkan'}
											</button>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	:global(.text-maroon-600) {
		color: #800020;
	}
	:global(.hover\:text-maroon-800:hover) {
		color: #4a0012;
	}
</style>
