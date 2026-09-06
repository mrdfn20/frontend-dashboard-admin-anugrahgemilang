<!-- src/lib/components/transactions/TransactionTable.svelte -->
<script>
	import { createEventDispatcher } from 'svelte';
	import { transactionHelpers } from '$lib/stores/transactions.js';
	import SortableHeader from '$lib/components/ui/SortableHeader.svelte';
	import TableSorter from '$lib/components/ui/TableSorter.svelte';

	// Props
	export let transactions = [];
	export let customers = []; // utk lookup nama pelanggan (transaksi tidak menyertakan nama)
	export let readonly = false; // true = sembunyikan kolom Aksi (dipakai di halaman Laporan)

	const dispatch = createEventDispatcher();

	// Field `remaining_debt` cuma ada di response /paymentlogs/getdebts, bukan di record
	// transaksi biasa - dihitung dari total_price - payment_amount kalau belum ada
	// (mis. sudah pernah diupdate manual oleh store setelah bayar hutang).
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

	function handlePayDebt(transaction) {
		dispatch('payDebt', transaction);
	}

	function handleDelete(transaction) {
		dispatch('delete', transaction);
	}
</script>

<TableSorter
	data={transactions}
	storageKey="transactions_table_sort"
	let:sortedData
	let:toggleSort
	let:sortState
>
	<div class="hidden overflow-x-auto rounded-lg bg-white shadow md:block">
		<table class="min-w-full divide-y divide-gray-200">
			<thead class="bg-gray-50">
				<tr>
					<th class="px-4 py-3 text-left">
						<SortableHeader column="transaction_date" {sortState} {toggleSort}
							>Tanggal</SortableHeader
						>
					</th>
					<th
						class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Pelanggan
					</th>
					<th
						class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Jenis
					</th>
					<th
						class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Galon (Isi/Kosong/Retur)
					</th>
					<th class="px-4 py-3 text-left">
						<SortableHeader column="total_price" {sortState} {toggleSort}>Total</SortableHeader>
					</th>
					<th
						class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Dibayar
					</th>
					<th
						class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Status
					</th>
					{#if !readonly}
						<th
							class="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							Aksi
						</th>
					{/if}
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200">
				{#each sortedData as transaction (transaction.id)}
					{@const remaining = getRemainingDebt(transaction)}
					<tr class="hover:bg-gray-50">
						<td class="px-4 py-3 text-sm whitespace-nowrap text-gray-700">
							{transactionHelpers.formatDate(transaction.transaction_date)}
						</td>
						<td class="px-4 py-3 text-sm font-medium whitespace-nowrap text-gray-900">
							<a
								href="/dashboard/customers/{transaction.customer_id}"
								class="hover:text-maroon-600 hover:underline"
							>
								{getCustomerName(transaction.customer_id)}
							</a>
						</td>
						<td class="px-4 py-3 text-sm whitespace-nowrap">
							<span
								class="rounded-full px-2 py-1 text-xs font-medium {transaction.transaction_type ===
								'Tunai'
									? 'bg-green-100 text-green-800'
									: 'bg-yellow-100 text-yellow-800'}"
							>
								{transaction.transaction_type}
							</span>
						</td>
						<td class="px-4 py-3 text-sm whitespace-nowrap text-gray-700">
							{transaction.gallon_filled} / {transaction.gallon_empty} / {transaction.gallon_returned}
						</td>
						<td class="px-4 py-3 text-sm font-medium whitespace-nowrap text-gray-900">
							{transactionHelpers.formatCurrency(transaction.total_price)}
						</td>
						<td class="px-4 py-3 text-sm whitespace-nowrap text-gray-700">
							{transactionHelpers.formatCurrency(transaction.payment_amount)}
						</td>
						<td class="px-4 py-3 text-sm whitespace-nowrap">
							<span
								class="rounded-full px-2 py-1 text-xs font-medium {transactionHelpers.getStatusClass(
									transaction.transaction_type,
									remaining
								)}"
							>
								{transactionHelpers.getStatusLabel(transaction.transaction_type, remaining)}
							</span>
						</td>
						{#if !readonly}
							<td class="px-4 py-3 text-right text-sm whitespace-nowrap">
								{#if transaction.transaction_type === 'Hutang' && remaining > 0}
									<button
										type="button"
										on:click={() => handlePayDebt(transaction)}
										class="text-maroon-600 hover:text-maroon-800 mr-3 font-medium"
									>
										Bayar Hutang
									</button>
								{/if}
								<button
									type="button"
									on:click={() => handleDelete(transaction)}
									class="font-medium text-red-600 hover:text-red-800"
								>
									Hapus
								</button>
							</td>
						{/if}
					</tr>
				{:else}
					<tr>
						<td colspan={readonly ? 7 : 8} class="px-4 py-8 text-center text-sm text-gray-500">
							Tidak ada transaksi ditemukan.
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</TableSorter>
