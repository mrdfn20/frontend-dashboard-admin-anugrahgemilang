<!-- src/lib/components/payments/PaymentsTable.svelte -->
<script>
	import { createEventDispatcher } from 'svelte';
	import { transactionHelpers } from '$lib/stores/transactions.js';

	// Props
	export let debts = []; // sudah di-join sama nama pelanggan dari parent
	export let canPay = true; // false utk role Driver (read-only)

	const dispatch = createEventDispatcher();

	function handlePayDebt(row) {
		dispatch('payDebt', row);
	}
</script>

<div class="overflow-hidden rounded-lg bg-white shadow">
	<div class="overflow-x-auto">
		<table class="min-w-full divide-y divide-gray-200">
			<thead class="bg-gray-50">
				<tr>
					<th
						class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Tanggal
					</th>
					<th
						class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Pelanggan
					</th>
					<th
						class="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Total Tagihan
					</th>
					<th
						class="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Sudah Dibayar
					</th>
					<th
						class="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Sisa Hutang
					</th>
					<th
						class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Status
					</th>
					{#if canPay}
						<th
							class="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							Aksi
						</th>
					{/if}
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200">
				{#each debts as row (row.transaction_id)}
					<tr class="hover:bg-gray-50">
						<td class="px-4 py-3 text-sm whitespace-nowrap text-gray-700">
							{transactionHelpers.formatDate(row.transaction_date)}
						</td>
						<td class="px-4 py-3 text-sm font-medium whitespace-nowrap text-gray-900">
							{row.customer_name || `#${row.customer_id}`}
						</td>
						<td class="px-4 py-3 text-right text-sm whitespace-nowrap text-gray-900">
							{transactionHelpers.formatCurrency(row.total_price)}
						</td>
						<td class="px-4 py-3 text-right text-sm whitespace-nowrap text-gray-700">
							{transactionHelpers.formatCurrency(row.total_paid)}
						</td>
						<td class="px-4 py-3 text-right text-sm font-medium whitespace-nowrap text-gray-900">
							{transactionHelpers.formatCurrency(row.remaining_debt)}
						</td>
						<td class="px-4 py-3 text-sm whitespace-nowrap">
							<span
								class="rounded-full px-2 py-1 text-xs font-medium {transactionHelpers.getStatusClass(
									'Hutang',
									row.remaining_debt
								)}"
							>
								{row.status_hutang}
							</span>
						</td>
						{#if canPay}
							<td class="px-4 py-3 text-right text-sm whitespace-nowrap">
								{#if Number(row.remaining_debt) > 0}
									<button
										type="button"
										on:click={() => handlePayDebt(row)}
										class="text-maroon-600 hover:text-maroon-800 font-medium"
									>
										Bayar Hutang
									</button>
								{/if}
							</td>
						{/if}
					</tr>
				{:else}
					<tr>
						<td colspan={canPay ? 7 : 6} class="px-4 py-8 text-center text-sm text-gray-500">
							Tidak ada data hutang ditemukan.
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
