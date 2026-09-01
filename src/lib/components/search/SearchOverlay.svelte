<!-- src/lib/components/search/SearchOverlay.svelte -->
<script>
	import { goto } from '$app/navigation';
	import { isOpen, query, results, isLoading, error, searchActions } from '$lib/stores/search.js';
	import { transactionActions } from '$lib/stores/transactions.js';
	import { transactionHelpers } from '$lib/stores/transactions.js';

	let inputEl;

	// Autofocus input begitu overlay dibuka
	$: if ($isOpen && inputEl) {
		inputEl.focus();
	}

	function handleClose() {
		searchActions.close();
	}

	function handleKeydown(event) {
		if (event.key === 'Escape') handleClose();
	}

	function goToCustomer(customerId) {
		handleClose();
		goto(`/dashboard/customers/${customerId}`);
	}

	async function goToCustomerTransactions(customerName) {
		handleClose();
		await goto('/dashboard/transactions');
		await transactionActions.applyFilters({ customer_name: customerName });
	}

	$: hasQuery = $query.trim().length >= 2;
	$: hasAnyResult =
		$results.customers.length > 0 || $results.transactions.length > 0 || $results.debts.length > 0;
</script>

<svelte:window on:keydown={$isOpen ? handleKeydown : undefined} />

{#if $isOpen}
	<div class="fixed inset-0 z-50 overflow-y-auto">
		<div class="flex min-h-screen items-start justify-center px-4 pt-20 pb-6">
			<div
				class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
				on:click={handleClose}
				role="presentation"
			></div>

			<div
				class="relative w-full max-w-2xl transform rounded-lg bg-white shadow-2xl transition-all"
			>
				<!-- Search input -->
				<div class="flex items-center gap-3 border-b border-gray-200 px-4 py-3">
					<svg
						class="h-5 w-5 shrink-0 text-gray-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
					<input
						bind:this={inputEl}
						type="text"
						value={$query}
						on:input={(e) => searchActions.setQuery(e.currentTarget.value)}
						placeholder="Cari pelanggan, transaksi, atau hutang..."
						class="flex-1 border-none text-sm text-gray-900 placeholder-gray-400 focus:ring-0 focus:outline-none"
					/>
					{#if $isLoading}
						<svg
							class="h-4 w-4 shrink-0 animate-spin text-gray-400"
							fill="none"
							viewBox="0 0 24 24"
						>
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
					{/if}
					<button on:click={handleClose} class="shrink-0 text-gray-400 hover:text-gray-600">
						<kbd class="rounded border border-gray-300 px-1.5 py-0.5 text-xs text-gray-500">ESC</kbd
						>
					</button>
				</div>

				<!-- Results -->
				<div class="max-h-[28rem] overflow-y-auto">
					{#if !hasQuery}
						<p class="px-4 py-8 text-center text-sm text-gray-400">
							Ketik minimal 2 karakter buat mulai cari.
						</p>
					{:else if $error}
						<p class="px-4 py-8 text-center text-sm text-red-500">{$error}</p>
					{:else if !$isLoading && !hasAnyResult}
						<p class="px-4 py-8 text-center text-sm text-gray-400">
							Tidak ada hasil untuk "{$query}".
						</p>
					{:else}
						<!-- Pelanggan -->
						{#if $results.customers.length > 0}
							<div class="border-b border-gray-100 px-4 py-2">
								<p class="mb-1 text-xs font-semibold tracking-wider text-gray-400 uppercase">
									Pelanggan
								</p>
								{#each $results.customers as customer (customer.id)}
									<button
										type="button"
										on:click={() => goToCustomer(customer.id)}
										class="flex w-full items-center justify-between rounded-md px-2 py-2 text-left hover:bg-gray-50"
									>
										<div>
											<p class="text-sm font-medium text-gray-900">
												{customer.title}
												{customer.customer_name}
											</p>
											<p class="text-xs text-gray-500">{customer.whatsapp_number || '-'}</p>
										</div>
										<span class="text-xs text-gray-400">#{customer.id}</span>
									</button>
								{/each}
							</div>
						{/if}

						<!-- Transaksi -->
						{#if $results.transactions.length > 0}
							<div class="border-b border-gray-100 px-4 py-2">
								<p class="mb-1 text-xs font-semibold tracking-wider text-gray-400 uppercase">
									Transaksi
								</p>
								{#each $results.transactions as tx (tx.id)}
									<button
										type="button"
										on:click={() => goToCustomerTransactions(tx.customer_name)}
										class="flex w-full items-center justify-between rounded-md px-2 py-2 text-left hover:bg-gray-50"
									>
										<div>
											<p class="text-sm font-medium text-gray-900">
												#{tx.id} - {tx.customer_name}
											</p>
											<p class="text-xs text-gray-500">
												{transactionHelpers.formatDate(tx.transaction_date)} - {tx.transaction_type}
											</p>
										</div>
										<span class="text-xs font-medium text-gray-700">
											{transactionHelpers.formatCurrency(tx.total_price)}
										</span>
									</button>
								{/each}
							</div>
						{/if}

						<!-- Hutang -->
						{#if $results.debts.length > 0}
							<div class="px-4 py-2">
								<p class="mb-1 text-xs font-semibold tracking-wider text-gray-400 uppercase">
									Hutang
								</p>
								{#each $results.debts as debt (debt.transaction_id)}
									<button
										type="button"
										on:click={() => goToCustomerTransactions(debt.customer_name)}
										class="flex w-full items-center justify-between rounded-md px-2 py-2 text-left hover:bg-gray-50"
									>
										<div>
											<p class="text-sm font-medium text-gray-900">{debt.customer_name}</p>
											<p class="text-xs text-gray-500">Transaksi #{debt.transaction_id}</p>
										</div>
										<span class="text-xs font-medium text-yellow-700">
											Sisa {transactionHelpers.formatCurrency(debt.remaining_debt)}
										</span>
									</button>
								{/each}
							</div>
						{/if}
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
