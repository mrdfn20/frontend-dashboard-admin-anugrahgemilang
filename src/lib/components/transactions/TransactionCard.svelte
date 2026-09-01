<!-- src/lib/components/transactions/TransactionCard.svelte -->
<script>
	import { createEventDispatcher } from 'svelte';
	import { transactionHelpers } from '$lib/stores/transactions.js';

	// Props
	export let transactions = [];
	export let customers = [];

	const dispatch = createEventDispatcher();

	function getRemainingDebt(transaction) {
		if (transaction.remaining_debt !== undefined && transaction.remaining_debt !== null) {
			return Number(transaction.remaining_debt);
		}
		return Math.max(0, Number(transaction.total_price) - Number(transaction.payment_amount || 0));
	}

	function getCustomerName(customerId) {
		const customer = customers.find((c) => c.id === customerId);
		return customer ? customer.customer_name : `#${customerId}`;
	}
</script>

<div class="space-y-3 md:hidden">
	{#each transactions as transaction (transaction.id)}
		{@const remaining = getRemainingDebt(transaction)}
		<div class="rounded-lg bg-white p-4 shadow">
			<div class="flex items-start justify-between">
				<div>
					<p class="font-medium text-gray-900">{getCustomerName(transaction.customer_id)}</p>
					<p class="text-xs text-gray-500">
						{transactionHelpers.formatDate(transaction.transaction_date)}
					</p>
				</div>
				<span
					class="rounded-full px-2 py-1 text-xs font-medium {transaction.transaction_type ===
					'Tunai'
						? 'bg-green-100 text-green-800'
						: 'bg-yellow-100 text-yellow-800'}"
				>
					{transaction.transaction_type}
				</span>
			</div>

			<div class="mt-3 grid grid-cols-2 gap-2 text-sm">
				<div>
					<p class="text-xs text-gray-500">Galon (Isi/Kosong/Kembali)</p>
					<p class="text-gray-800">
						{transaction.gallon_filled} / {transaction.gallon_empty} / {transaction.gallon_returned}
					</p>
				</div>
				<div>
					<p class="text-xs text-gray-500">Total</p>
					<p class="font-medium text-gray-900">
						{transactionHelpers.formatCurrency(transaction.total_price)}
					</p>
				</div>
				<div>
					<p class="text-xs text-gray-500">Dibayar</p>
					<p class="text-gray-800">
						{transactionHelpers.formatCurrency(transaction.payment_amount)}
					</p>
				</div>
				<div>
					<p class="text-xs text-gray-500">Status</p>
					<span
						class="rounded-full px-2 py-1 text-xs font-medium {transactionHelpers.getStatusClass(
							transaction.transaction_type,
							remaining
						)}"
					>
						{transactionHelpers.getStatusLabel(transaction.transaction_type, remaining)}
					</span>
				</div>
			</div>

			<div class="mt-3 flex justify-end gap-3 border-t border-gray-100 pt-3">
				{#if transaction.transaction_type === 'Hutang' && remaining > 0}
					<button
						type="button"
						on:click={() => dispatch('payDebt', transaction)}
						class="text-maroon-600 hover:text-maroon-800 text-sm font-medium"
					>
						Bayar Hutang
					</button>
				{/if}
				<button
					type="button"
					on:click={() => dispatch('delete', transaction)}
					class="text-sm font-medium text-red-600 hover:text-red-800"
				>
					Hapus
				</button>
			</div>
		</div>
	{:else}
		<div class="rounded-lg bg-white p-8 text-center text-sm text-gray-500 shadow">
			Tidak ada transaksi ditemukan.
		</div>
	{/each}
</div>
