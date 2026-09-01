<!-- src/routes/dashboard/users/+page.svelte -->
<script>
	import { onMount } from 'svelte';
	import { userActions, users, isLoading, error } from '$lib/stores/users.js';
	import { auth } from '$lib/stores/auth.js';
	import UserForm from '$lib/components/users/UserForm.svelte';
	import ConfirmationModal from '$lib/components/ui/ConfirmationModal.svelte';

	let showAddForm = false;
	let showDeleteModal = false;
	let selectedUser = null;
	let isDeleting = false;

	onMount(async () => {
		await userActions.loadUsers();
	});

	function handleDelete(user) {
		selectedUser = user;
		showDeleteModal = true;
	}

	async function confirmDelete() {
		if (!selectedUser) return;
		isDeleting = true;
		try {
			await userActions.deleteUser(selectedUser.username);
			showDeleteModal = false;
			selectedUser = null;
		} catch (err) {
			console.error('Failed to delete user:', err);
		} finally {
			isDeleting = false;
		}
	}

	function getRoleBadgeClass(role) {
		if (role === 'Admin') return 'bg-maroon-100 text-maroon-800';
		if (role === 'Editor') return 'bg-blue-100 text-blue-800';
		return 'bg-gray-100 text-gray-800';
	}

	function formatDate(dateString) {
		if (!dateString) return '-';
		return new Date(dateString).toLocaleDateString('id-ID', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<div class="p-6">
	<!-- Header -->
	<div class="mb-6">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-semibold text-gray-900">Manajemen User</h1>
				<p class="text-gray-500">Kelola akun staff yang bisa akses sistem ini</p>
			</div>
			<button
				on:click={() => (showAddForm = true)}
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
				Tambah User
			</button>
		</div>
	</div>

	{#if $isLoading && $users.length === 0}
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
		<div class="overflow-x-auto rounded-lg bg-white shadow">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th
							class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							Username
						</th>
						<th
							class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							Role
						</th>
						<th
							class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							Tanggal Dibuat
						</th>
						<th
							class="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							Aksi
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200">
					{#each $users as user (user.id)}
						{@const isSelf = user.id === $auth.user?.id}
						<tr class="hover:bg-gray-50">
							<td class="px-4 py-3 text-sm font-medium whitespace-nowrap text-gray-900">
								{user.username}
								{#if isSelf}
									<span class="ml-1 text-xs text-gray-400">(Anda)</span>
								{/if}
							</td>
							<td class="px-4 py-3 text-sm whitespace-nowrap">
								<span
									class="rounded-full px-2 py-1 text-xs font-medium {getRoleBadgeClass(user.role)}"
								>
									{user.role}
								</span>
							</td>
							<td class="px-4 py-3 text-sm whitespace-nowrap text-gray-700">
								{formatDate(user.created_at)}
							</td>
							<td class="px-4 py-3 text-right text-sm whitespace-nowrap">
								{#if isSelf}
									<span class="text-gray-300">Hapus</span>
								{:else}
									<button
										type="button"
										on:click={() => handleDelete(user)}
										class="font-medium text-red-600 hover:text-red-800"
									>
										Hapus
									</button>
								{/if}
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="4" class="px-4 py-8 text-center text-sm text-gray-500">
								Belum ada user.
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

{#if showAddForm}
	<UserForm on:success={() => (showAddForm = false)} on:cancel={() => (showAddForm = false)} />
{/if}

{#if showDeleteModal && selectedUser}
	<ConfirmationModal
		title="Hapus User"
		message={`Yakin ingin menghapus user "${selectedUser.username}"? Tindakan ini tidak dapat dibatalkan.`}
		confirmText="Hapus"
		isLoading={isDeleting}
		on:confirm={confirmDelete}
		on:cancel={() => (showDeleteModal = false)}
	/>
{/if}

<style>
	:global(.bg-maroon-600) {
		background-color: #800020;
	}
	:global(.hover\:bg-maroon-700:hover) {
		background-color: #600018;
	}
	:global(.bg-maroon-100) {
		background-color: #fce7e8;
	}
	:global(.text-maroon-800) {
		color: #4a0012;
	}
</style>
