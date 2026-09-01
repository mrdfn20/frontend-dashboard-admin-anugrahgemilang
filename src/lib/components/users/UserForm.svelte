<!-- src/lib/components/users/UserForm.svelte -->
<script>
	import { createEventDispatcher } from 'svelte';
	import { userActions } from '$lib/stores/users.js';

	const dispatch = createEventDispatcher();

	const roleOptions = ['Admin', 'Editor', 'Driver'];

	let formData = {
		username: '',
		password: '',
		role: 'Driver'
	};
	let showPassword = false;
	let errors = {};
	let isSubmitting = false;

	function validateForm() {
		errors = {};
		if (!formData.username.trim()) errors.username = 'Username wajib diisi';
		if (!formData.password || formData.password.length < 6)
			errors.password = 'Password wajib diisi, minimal 6 karakter';
		if (!roleOptions.includes(formData.role)) errors.role = 'Role wajib dipilih';
		return Object.keys(errors).length === 0;
	}

	async function handleSubmit() {
		if (!validateForm()) return;

		isSubmitting = true;
		try {
			await userActions.registerUser({
				username: formData.username.trim(),
				password: formData.password,
				role: formData.role
			});
			dispatch('success');
		} catch (error) {
			// Error sudah ditoast oleh store
			console.error('Form submission error:', error);
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
				<h3 class="text-lg font-medium text-gray-900">Tambah User</h3>
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

			<form on:submit|preventDefault={handleSubmit} class="px-6 py-4">
				<div class="space-y-4">
					<div>
						<label for="user-username" class="block text-sm font-medium text-gray-700">
							Username <span class="text-red-500">*</span>
						</label>
						<input
							id="user-username"
							type="text"
							bind:value={formData.username}
							placeholder="mis. dova"
							class="focus:border-maroon-500 focus:ring-maroon-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
							class:border-red-300={errors.username}
						/>
						{#if errors.username}
							<p class="mt-1 text-sm text-red-600">{errors.username}</p>
						{/if}
					</div>

					<div>
						<label for="user-password" class="block text-sm font-medium text-gray-700">
							Password <span class="text-red-500">*</span>
						</label>
						<div class="relative mt-1">
							<input
								id="user-password"
								type={showPassword ? 'text' : 'password'}
								bind:value={formData.password}
								placeholder="Minimal 6 karakter"
								class="focus:border-maroon-500 focus:ring-maroon-500 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 pr-10 shadow-sm"
								class:border-red-300={errors.password}
							/>
							<button
								type="button"
								class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
								on:click={() => (showPassword = !showPassword)}
							>
								{#if showPassword}
									<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
										/>
									</svg>
								{:else}
									<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
										/>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
										/>
									</svg>
								{/if}
							</button>
						</div>
						{#if errors.password}
							<p class="mt-1 text-sm text-red-600">{errors.password}</p>
						{/if}
					</div>

					<div>
						<label for="user-role" class="block text-sm font-medium text-gray-700">
							Role <span class="text-red-500">*</span>
						</label>
						<select
							id="user-role"
							bind:value={formData.role}
							class="focus:border-maroon-500 focus:ring-maroon-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
						>
							{#each roleOptions as role (role)}
								<option value={role}>{role}</option>
							{/each}
						</select>
					</div>
				</div>

				<div class="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
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
