<!-- src/lib/components/transactions/PayDebtModal.svelte -->
<script>
	import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import { transactionActions, transactionHelpers } from '$lib/stores/transactions.js';
	import { api } from '$lib/services/api.js';
	import CurrencyInput from '$lib/components/ui/CurrencyInput.svelte';

	// Props
	export let transaction; // transaksi Hutang yang mau dibayar
	export let customerName = '';

	const dispatch = createEventDispatcher();

	let paymentHistory = [];
	let isLoadingHistory = true;
	let amount_paid = 0;
	let payment_date = new Date().toISOString().slice(0, 10);
	let errorMessage = '';
	let isSubmitting = false;

	$: remainingDebt =
		transaction.remaining_debt !== undefined && transaction.remaining_debt !== null
			? Number(transaction.remaining_debt)
			: Math.max(0, Number(transaction.total_price) - Number(transaction.payment_amount || 0));

	onMount(async () => {
		try {
			// Riwayat pembayaran kosong itu wajar (transaksi hutang baru), bukan error
			paymentHistory = await api.payments.getByTransactionId(transaction.id);
		} catch (err) {
			console.error('Failed to load payment history:', err);
			paymentHistory = [];
		} finally {
			isLoadingHistory = false;
		}
	});

	function validate() {
		errorMessage = '';
		const amount = Number(amount_paid);

		if (!amount_paid || isNaN(amount) || amount <= 0) {
			errorMessage = 'Jumlah bayar wajib diisi dan lebih dari 0';
			return false;
		}
		if (amount > remainingDebt) {
			errorMessage = `Jumlah bayar tidak boleh melebihi sisa hutang (${transactionHelpers.formatCurrency(remainingDebt)})`;
			return false;
		}
		return true;
	}

	async function handleSubmit() {
		if (!validate()) return;

		isSubmitting = true;
		try {
			await transactionActions.payDebt(transaction.id, Number(amount_paid), payment_date);
			dispatch('success');
		} catch (error) {
			// Error sudah ditoast oleh store
			console.error('Pay debt error:', error);
		} finally {
			isSubmitting = false;
		}
	}

	function handleCancel() {
		dispatch('cancel');
	}
</script>

<div class="fixed inset-0 z-50 overflow-y-auto">
	<div class="flex min-h-screen items-center justify-center px-4 py-6">
		<div
			class="fixed inset-0 bg-white/20 backdrop-blur-md transition-all duration-300"
			on:click={handleCancel}
			role="presentation"
		></div>

		<div class="relative w-full max-w-lg transform rounded-lg bg-white shadow-xl transition-all">
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
				<h3 class="text-lg font-medium text-gray-900">Bayar Hutang</h3>
				<button on:click={handleCancel} class="text-gray-400 hover:text-gray-600">
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
				<!-- Ringkasan transaksi -->
				<div class="mb-4 rounded-md bg-gray-50 p-3 text-sm">
					<div class="flex justify-between py-1">
						<span class="text-gray-500">Pelanggan</span>
						<span class="font-medium text-gray-900"
							>{customerName || `#${transaction.customer_id}`}</span
						>
					</div>
					<div class="flex justify-between py-1">
						<span class="text-gray-500">Tanggal Transaksi</span>
						<span class="text-gray-800"
							>{transactionHelpers.formatDate(transaction.transaction_date)}</span
						>
					</div>
					<div class="flex justify-between py-1">
						<span class="text-gray-500">Total Tagihan</span>
						<span class="text-gray-800"
							>{transactionHelpers.formatCurrency(transaction.total_price)}</span
						>
					</div>
					<div class="flex justify-between py-1">
						<span class="text-gray-500">Sudah Dibayar</span>
						<span class="text-gray-800">
							{transactionHelpers.formatCurrency(transaction.total_price - remainingDebt)}
						</span>
					</div>
					<div class="flex justify-between border-t border-gray-200 py-1 pt-2">
						<span class="font-medium text-gray-700">Sisa Hutang</span>
						<span class="text-maroon-700 font-semibold">
							{transactionHelpers.formatCurrency(remainingDebt)}
						</span>
					</div>
				</div>

				<!-- Riwayat pembayaran -->
				<div class="mb-4">
					<p class="mb-2 text-sm font-medium text-gray-700">Riwayat Pembayaran</p>
					{#if isLoadingHistory}
						<p class="text-sm text-gray-400">Memuat riwayat...</p>
					{:else if paymentHistory.length === 0}
						<p class="text-sm text-gray-400">Belum ada riwayat pembayaran.</p>
					{:else}
						<ul class="divide-y divide-gray-100 rounded-md border border-gray-100">
							{#each paymentHistory as log (log.id)}
								<li class="flex justify-between px-3 py-2 text-sm">
									<span class="text-gray-600">
										{log.payment_date
											? transactionHelpers.formatDate(log.payment_date)
											: 'Belum dibayar'}
									</span>
									<span class="font-medium text-gray-900">
										{transactionHelpers.formatCurrency(log.amount_paid)}
									</span>
								</li>
							{/each}
						</ul>
					{/if}
				</div>

				<!-- Form pembayaran -->
				<form on:submit|preventDefault={handleSubmit} class="space-y-4">
					<div>
						<label for="amount_paid" class="block text-sm font-medium text-gray-700">
							Jumlah Bayar <span class="text-red-500">*</span>
						</label>
						<CurrencyInput id="amount_paid" bind:value={amount_paid} placeholder="0" />
					</div>
					<div>
						<label for="payment_date" class="block text-sm font-medium text-gray-700">
							Tanggal Bayar
						</label>
						<input
							id="payment_date"
							type="date"
							bind:value={payment_date}
							class="focus:border-maroon-500 focus:ring-maroon-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
						/>
					</div>

					{#if errorMessage}
						<p class="text-sm text-red-600">{errorMessage}</p>
					{/if}

					<div class="flex justify-end gap-3 border-t border-gray-200 pt-4">
						<button
							type="button"
							on:click={handleCancel}
							disabled={isSubmitting}
							class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
						>
							Batal
						</button>
						<button
							type="submit"
							disabled={isSubmitting}
							class="bg-maroon-600 hover:bg-maroon-700 rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm disabled:opacity-50"
						>
							{isSubmitting ? 'Memproses...' : 'Catat Pembayaran'}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
</div>

<style>
	:global(.bg-maroon-600) {
		background-color: #800020;
	}
	:global(.hover\:bg-maroon-700:hover) {
		background-color: #600018;
	}
	:global(.focus\:border-maroon-500:focus) {
		border-color: #800020;
	}
	:global(.focus\:ring-maroon-500:focus) {
		--tw-ring-color: rgba(128, 0, 32, 0.5);
	}
</style>
