<!-- src/routes/dashboard/reports/+page.svelte -->
<script>
	import { onMount } from 'svelte';
	import {
		reportActions,
		dateRange,
		summary,
		regionSummary,
		transactions,
		isLoading,
		error,
		hasGenerated
	} from '$lib/stores/reports.js';
	import { customerActions, customers } from '$lib/stores/customers.js';
	import { transactionHelpers } from '$lib/stores/transactions.js';
	import TransactionTable from '$lib/components/transactions/TransactionTable.svelte';
	import { exportToCsv } from '$lib/utils/csv.js';

	onMount(async () => {
		await customerActions.loadCustomers();
		await reportActions.generateReport();
	});

	function getCustomerName(customerId) {
		const customer = $customers.find((c) => c.id === customerId);
		return customer ? customer.customer_name : `#${customerId}`;
	}

	function handleExport() {
		const columns = [
			{ key: 'id', label: 'ID Transaksi' },
			{ key: 'transaction_date', label: 'Tanggal' },
			{ key: 'customer_name', label: 'Pelanggan' },
			{ key: 'transaction_type', label: 'Jenis' },
			{ key: 'gallon_filled', label: 'Galon Isi' },
			{ key: 'gallon_empty', label: 'Galon Kosong' },
			{ key: 'gallon_returned', label: 'Galon Kembali' },
			{ key: 'total_price', label: 'Total' },
			{ key: 'payment_amount', label: 'Dibayar' }
		];

		const rows = $transactions.map((tx) => ({
			...tx,
			customer_name: getCustomerName(tx.customer_id)
		}));

		exportToCsv(rows, columns, `laporan-transaksi-${$dateRange.startDate}_${$dateRange.endDate}`);
	}
</script>

<div class="p-6">
	<div class="mb-6">
		<h1 class="text-2xl font-semibold text-gray-900">Laporan</h1>
		<p class="text-gray-500">Ringkasan & detail transaksi dalam rentang tanggal tertentu</p>
	</div>

	<!-- Date range picker -->
	<div class="mb-6 rounded-lg bg-white p-4 shadow">
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-4">
			<div>
				<label for="report-start-date" class="mb-1 block text-xs font-medium text-gray-500">
					Dari Tanggal
				</label>
				<input
					id="report-start-date"
					type="date"
					bind:value={$dateRange.startDate}
					class="focus:ring-maroon-500 focus:border-maroon-500 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none"
				/>
			</div>
			<div>
				<label for="report-end-date" class="mb-1 block text-xs font-medium text-gray-500">
					Sampai Tanggal
				</label>
				<input
					id="report-end-date"
					type="date"
					bind:value={$dateRange.endDate}
					class="focus:ring-maroon-500 focus:border-maroon-500 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none"
				/>
			</div>
			<div class="flex items-end">
				<button
					type="button"
					on:click={() => reportActions.generateReport()}
					disabled={$isLoading}
					class="bg-maroon-600 hover:bg-maroon-700 w-full rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm disabled:opacity-50"
				>
					{$isLoading ? 'Memuat...' : 'Buat Laporan'}
				</button>
			</div>
			<div class="flex items-end">
				<button
					type="button"
					on:click={handleExport}
					disabled={$transactions.length === 0}
					class="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
				>
					⬇ Export CSV
				</button>
			</div>
		</div>
	</div>

	{#if $isLoading && !$hasGenerated}
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
	{:else if $hasGenerated && $summary}
		<!-- Summary cards -->
		<div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<div class="rounded-lg bg-white p-4 shadow">
				<p class="text-sm text-gray-500">Total Transaksi</p>
				<p class="text-2xl font-semibold text-gray-900">{$summary.total_transactions}</p>
				<p class="mt-1 text-xs text-gray-500">
					Tunai: {$summary.cash_count} · Hutang: {$summary.debt_count}
				</p>
			</div>
			<div class="rounded-lg bg-white p-4 shadow">
				<p class="text-sm text-gray-500">Total Pendapatan</p>
				<p class="text-2xl font-semibold text-green-700">
					{transactionHelpers.formatCurrency($summary.total_income)}
				</p>
				<p class="mt-1 text-xs text-gray-500">Uang yang benar-benar diterima</p>
			</div>
			<div class="rounded-lg bg-white p-4 shadow">
				<p class="text-sm text-gray-500">Total Nilai Penjualan</p>
				<p class="text-2xl font-semibold text-gray-900">
					{transactionHelpers.formatCurrency($summary.total_sales)}
				</p>
				<p class="mt-1 text-xs text-gray-500">Termasuk yang masih hutang</p>
			</div>
			<div class="rounded-lg bg-white p-4 shadow">
				<p class="text-sm text-gray-500">Total Galon Terisi</p>
				<p class="text-2xl font-semibold text-gray-900">{$summary.total_gallon_filled}</p>
				<p class="mt-1 text-xs text-gray-500">
					Sisa hutang periode ini: {transactionHelpers.formatCurrency($summary.remaining_debt)}
				</p>
			</div>
		</div>

		<!-- Ringkasan per wilayah -->
		<div class="mb-6 overflow-x-auto rounded-lg bg-white shadow">
			<div class="border-b border-gray-200 px-4 py-3">
				<h2 class="text-sm font-semibold text-gray-900">Omzet & Hutang per Wilayah</h2>
			</div>
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th
							class="px-4 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
							>Kecamatan</th
						>
						<th
							class="px-4 py-2 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
							>Transaksi</th
						>
						<th
							class="px-4 py-2 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
							>Pendapatan</th
						>
						<th
							class="px-4 py-2 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
							>Nilai Penjualan</th
						>
						<th
							class="px-4 py-2 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
							>Sisa Hutang</th
						>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200">
					{#each $regionSummary as row (row.region_id)}
						<tr class="hover:bg-gray-50">
							<td class="px-4 py-2 text-sm font-medium whitespace-nowrap text-gray-900">
								{row.region_name}
							</td>
							<td class="px-4 py-2 text-right text-sm whitespace-nowrap text-gray-700">
								{row.total_transactions}
							</td>
							<td class="px-4 py-2 text-right text-sm whitespace-nowrap text-green-700">
								{transactionHelpers.formatCurrency(row.total_income)}
							</td>
							<td class="px-4 py-2 text-right text-sm whitespace-nowrap text-gray-700">
								{transactionHelpers.formatCurrency(row.total_sales)}
							</td>
							<td class="px-4 py-2 text-right text-sm whitespace-nowrap text-red-600">
								{transactionHelpers.formatCurrency(row.remaining_debt)}
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="5" class="px-4 py-6 text-center text-sm text-gray-500">
								Gak ada transaksi di rentang tanggal ini.
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Detail table -->
		<TransactionTable transactions={$transactions} customers={$customers} readonly />
	{/if}
</div>
