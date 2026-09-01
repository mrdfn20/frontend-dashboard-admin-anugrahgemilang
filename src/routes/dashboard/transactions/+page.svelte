<!-- src/routes/dashboard/transactions/+page.svelte -->
<script>
	import { onMount } from 'svelte';
	import {
		transactionActions,
		transactions,
		deletedTransactions,
		isLoading,
		error,
		hasMore,
		pagination
	} from '$lib/stores/transactions.js';
	import { customerActions, customers } from '$lib/stores/customers.js';
	import TransactionFilter from '$lib/components/transactions/TransactionFilter.svelte';
	import TransactionTable from '$lib/components/transactions/TransactionTable.svelte';
	import TransactionCard from '$lib/components/transactions/TransactionCard.svelte';
	import TransactionForm from '$lib/components/transactions/TransactionForm.svelte';
	import PayDebtModal from '$lib/components/transactions/PayDebtModal.svelte';
	import DeletedTransactionsModal from '$lib/components/transactions/DeletedTransactionsModal.svelte';
	import ConfirmationModal from '$lib/components/ui/ConfirmationModal.svelte';
	import { infiniteScroll } from '$lib/actions/infiniteScroll.js';

	// Modal state
	let showAddForm = false;
	let showDeleteModal = false;
	let showPayDebtModal = false;
	let showDeletedModal = false;
	let selectedTransaction = null;
	let isDeleting = false;

	onMount(async () => {
		// Customers dibutuhkan utk lookup nama & dropdown pelanggan di form
		await Promise.all([
			customerActions.loadCustomers(),
			transactionActions.loadTransactions(),
			transactionActions.loadDeletedTransactions()
		]);
	});

	function getCustomerName(customerId) {
		const customer = $customers.find((c) => c.id === customerId);
		return customer ? customer.customer_name : `#${customerId}`;
	}

	function handleAddTransaction() {
		showAddForm = true;
	}

	function handleFormSuccess() {
		showAddForm = false;
	}

	function handlePayDebt(event) {
		selectedTransaction = event.detail;
		showPayDebtModal = true;
	}

	function handlePayDebtSuccess() {
		showPayDebtModal = false;
		selectedTransaction = null;
	}

	function handleDelete(event) {
		selectedTransaction = event.detail;
		showDeleteModal = true;
	}

	async function confirmDelete() {
		if (!selectedTransaction) return;
		isDeleting = true;
		try {
			await transactionActions.deleteTransaction(selectedTransaction.id);
			showDeleteModal = false;
			selectedTransaction = null;
		} catch (err) {
			console.error('Failed to delete transaction:', err);
		} finally {
			isDeleting = false;
		}
	}

	async function handleFilterChange(event) {
		await transactionActions.applyFilters(event.detail);
	}

	async function handleFilterReset() {
		await transactionActions.clearFilters();
	}
</script>

<div class="p-6">
	<!-- Header -->
	<div class="mb-6">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-semibold text-gray-900">Manajemen Transaksi</h1>
				<p class="text-gray-500">Catat transaksi galon & kelola pelunasan hutang pelanggan</p>
			</div>
			<div class="flex gap-2">
				<button
					on:click={() => (showDeletedModal = true)}
					class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
				>
					Transaksi Terhapus
					{#if $deletedTransactions.length > 0}
						<span class="ml-1 rounded-full bg-gray-200 px-1.5 py-0.5 text-xs text-gray-700">
							{$deletedTransactions.length}
						</span>
					{/if}
				</button>
				<button
					on:click={handleAddTransaction}
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
					Tambah Transaksi
				</button>
			</div>
		</div>
	</div>

	<!-- Filter -->
	<TransactionFilter
		customers={$customers}
		on:filter={handleFilterChange}
		on:reset={handleFilterReset}
	/>

	<!-- Loading / Error state -->
	{#if $isLoading && $transactions.length === 0}
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
		<!-- Table (desktop) & Card (mobile) -->
		<TransactionTable
			transactions={$transactions}
			customers={$customers}
			on:payDebt={handlePayDebt}
			on:delete={handleDelete}
		/>
		<TransactionCard
			transactions={$transactions}
			customers={$customers}
			on:payDebt={handlePayDebt}
			on:delete={handleDelete}
		/>

		<!-- Infinite scroll footer (server-side pagination - tiap scroll ambil halaman berikutnya dari BE) -->
		{#if $transactions.length > 0}
			<div
				class="mt-4 rounded-lg border-t border-gray-200 bg-white px-4 py-3 text-center shadow sm:px-6"
			>
				<p class="text-sm text-gray-500">
					Menampilkan <span class="font-medium">{$transactions.length}</span> dari
					<span class="font-medium">{$pagination.total}</span> transaksi
				</p>
				{#if $hasMore}
					<div
						use:infiniteScroll={{
							hasMore: $hasMore,
							onLoadMore: () => transactionActions.loadPage()
						}}
						class="mt-2 flex justify-center py-2"
					>
						<svg class="text-maroon-600 h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
					</div>
				{:else}
					<p class="mt-1 text-xs text-gray-400">Semua data sudah dimuat</p>
				{/if}
			</div>
		{/if}
	{/if}
</div>

<!-- Modals -->
{#if showAddForm}
	<TransactionForm
		customers={$customers}
		on:success={handleFormSuccess}
		on:cancel={() => (showAddForm = false)}
	/>
{/if}

{#if showPayDebtModal && selectedTransaction}
	<PayDebtModal
		transaction={selectedTransaction}
		customerName={getCustomerName(selectedTransaction.customer_id)}
		on:success={handlePayDebtSuccess}
		on:cancel={() => (showPayDebtModal = false)}
	/>
{/if}

{#if showDeleteModal && selectedTransaction}
	<ConfirmationModal
		title="Hapus Transaksi"
		message={`Yakin ingin menghapus transaksi #${selectedTransaction.id} milik ${getCustomerName(selectedTransaction.customer_id)}?`}
		confirmText="Hapus"
		isLoading={isDeleting}
		on:confirm={confirmDelete}
		on:cancel={() => (showDeleteModal = false)}
	/>
{/if}

{#if showDeletedModal}
	<DeletedTransactionsModal
		deletedTransactions={$deletedTransactions}
		isLoading={$isLoading}
		on:cancel={() => (showDeletedModal = false)}
	/>
{/if}
