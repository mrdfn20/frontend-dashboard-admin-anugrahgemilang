<!-- src/lib/components/customers/AddBalanceModal.svelte -->
<script>
	import { createEventDispatcher } from 'svelte';
	import { api } from '$lib/services/api.js';
	import toast from 'svelte-french-toast';
	import CurrencyInput from '$lib/components/ui/CurrencyInput.svelte';

	// Props
	export let customerId;
	export let customerName = '';
	export let currentBalance = 0;

	const dispatch = createEventDispatcher();

	let amount = 0;
	let errorMessage = '';
	let isSubmitting = false;

	function validate() {
		errorMessage = '';
		const value = Number(amount);
		if (!amount || isNaN(value) || value <= 0) {
			errorMessage = 'Jumlah wajib diisi dan lebih dari 0';
			return false;
		}
		return true;
	}

	async function handleSubmit() {
		if (!validate()) return;

		isSubmitting = true;
		try {
			// PUT /customerbalance = operasi TAMBAH ke saldo existing (bukan set nilai akhir)
			await api.customerBalance.update({
				customer_id: customerId,
				balance: Number(amount)
			});
			toast.success('Saldo berhasil ditambahkan!');
			dispatch('success');
		} catch (err) {
			toast.error(err.message || 'Gagal menambahkan saldo');
			console.error('Add balance error:', err);
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

		<div class="relative w-full max-w-md transform rounded-lg bg-white shadow-xl transition-all">
			<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
				<h3 class="text-lg font-medium text-gray-900">Tambah Saldo</h3>
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

			<div class="px-6 py-4">
				<div class="mb-4 rounded-md bg-gray-50 p-3 text-sm">
					<div class="flex justify-between py-1">
						<span class="text-gray-500">Pelanggan</span>
						<span class="font-medium text-gray-900">{customerName}</span>
					</div>
					<div class="flex justify-between py-1">
						<span class="text-gray-500">Saldo Saat Ini</span>
						<span class="text-gray-800">
							{new Intl.NumberFormat('id-ID', {
								style: 'currency',
								currency: 'IDR',
								minimumFractionDigits: 0
							}).format(currentBalance)}
						</span>
					</div>
				</div>

				<form on:submit|preventDefault={handleSubmit} class="space-y-4">
					<div>
						<label for="add-balance-amount" class="block text-sm font-medium text-gray-700">
							Jumlah Ditambahkan <span class="text-red-500">*</span>
						</label>
						<CurrencyInput id="add-balance-amount" bind:value={amount} placeholder="0" />
						{#if errorMessage}
							<p class="mt-1 text-sm text-red-600">{errorMessage}</p>
						{/if}
					</div>

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
							{isSubmitting ? 'Menyimpan...' : 'Simpan'}
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
