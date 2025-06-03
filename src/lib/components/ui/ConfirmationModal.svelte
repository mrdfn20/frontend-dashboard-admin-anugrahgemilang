<!-- src/lib/components/ui/ConfirmationModal.svelte -->
<script>
	import { createEventDispatcher } from 'svelte';

	// Props
	export let title = 'Konfirmasi';
	export let message = 'Apakah Anda yakin?';
	export let confirmText = 'Ya';
	export let cancelText = 'Batal';
	export let confirmClass = 'bg-red-600 hover:bg-red-700';
	export let isLoading = false;

	// Event dispatcher
	const dispatch = createEventDispatcher();

	function handleConfirm() {
		dispatch('confirm');
	}

	function handleCancel() {
		dispatch('cancel');
	}
</script>

<!-- Modal Overlay -->
<div class="fixed inset-0 z-50 overflow-y-auto">
	<div class="flex min-h-screen items-center justify-center px-4 py-6">
		<!-- Background overlay -->
		<div
			class="bg-opacity-75 fixed inset-0 bg-gray-500 transition-opacity"
			on:click={handleCancel}
		></div>

		<!-- Modal panel -->
		<div class="relative w-full max-w-md transform rounded-lg bg-white shadow-xl transition-all">
			<div class="px-6 py-4">
				<!-- Icon -->
				<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
					<svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
						/>
					</svg>
				</div>

				<!-- Title & Message -->
				<div class="mt-3 text-center">
					<h3 class="text-lg font-medium text-gray-900">{title}</h3>
					<div class="mt-2">
						<p class="text-sm text-gray-500">{message}</p>
					</div>
				</div>
			</div>

			<!-- Actions -->
			<div class="flex justify-center space-x-3 px-6 py-4">
				<button
					type="button"
					on:click={handleCancel}
					disabled={isLoading}
					class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
				>
					{cancelText}
				</button>
				<button
					type="button"
					on:click={handleConfirm}
					disabled={isLoading}
					class="{confirmClass} rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
				>
					{#if isLoading}
						<svg class="mr-2 inline h-4 w-4 animate-spin" viewBox="0 0 24 24">
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
					{confirmText}
				</button>
			</div>
		</div>
	</div>
</div>
