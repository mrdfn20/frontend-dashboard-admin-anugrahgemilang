<!-- src/routes/dashboard/audit-logs/+page.svelte -->
<script>
	import { onMount } from 'svelte';
	import {
		auditLogActions,
		logs,
		usersById,
		isLoading,
		error,
		hasMore,
		pagination
	} from '$lib/stores/auditLogs.js';
	import { userActions, users } from '$lib/stores/users.js';
	import { infiniteScroll } from '$lib/actions/infiniteScroll.js';

	let expandedId = null;
	let searchInput = '';
	let searchDebounceTimer;

	onMount(async () => {
		await Promise.all([userActions.loadUsers(), auditLogActions.loadLogs()]);
	});

	// Bangun peta user_id -> username begitu daftar user selesai dimuat
	$: usersById.set(
		$users.reduce((map, u) => {
			map[u.id] = u.username;
			return map;
		}, {})
	);

	// Search dijalankan di server (Phase 9) - debounce 300ms biar gak nembak request tiap keystroke
	function handleSearchInput() {
		clearTimeout(searchDebounceTimer);
		searchDebounceTimer = setTimeout(() => {
			auditLogActions.search(searchInput);
		}, 300);
	}

	function getActionBadgeClass(action) {
		switch (action) {
			case 'CREATE':
				return 'bg-green-100 text-green-800';
			case 'UPDATE':
				return 'bg-blue-100 text-blue-800';
			case 'DELETE':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function formatDateTime(dateString) {
		if (!dateString) return '-';
		return new Date(dateString).toLocaleString('id-ID', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// request_data/previous_data disimpan sebagai string JSON (kadang literal "null")
	function prettyJson(raw) {
		if (!raw || raw === 'null') return null;
		try {
			return JSON.stringify(JSON.parse(raw), null, 2);
		} catch {
			return raw;
		}
	}

	function toggleExpand(id) {
		expandedId = expandedId === id ? null : id;
	}
</script>

<div class="p-6">
	<div class="mb-6">
		<h1 class="text-2xl font-semibold text-gray-900">Audit Log</h1>
		<p class="text-gray-500">Riwayat perubahan data di sistem ini</p>
	</div>

	<div class="mb-4 rounded-lg bg-white p-4 shadow">
		<input
			type="text"
			bind:value={searchInput}
			on:input={handleSearchInput}
			placeholder="Cari berdasarkan user, role, aksi, atau endpoint..."
			class="focus:ring-maroon-500 focus:border-maroon-500 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none"
		/>
	</div>

	{#if $isLoading && $logs.length === 0}
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
							Waktu
						</th>
						<th
							class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							User
						</th>
						<th
							class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							Aksi
						</th>
						<th
							class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							Endpoint
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200">
					{#each $logs as log (log.id)}
						<tr class="cursor-pointer hover:bg-gray-50" on:click={() => toggleExpand(log.id)}>
							<td class="px-4 py-3 text-sm whitespace-nowrap text-gray-700">
								{formatDateTime(log.timestamp)}
							</td>
							<td class="px-4 py-3 text-sm whitespace-nowrap text-gray-900">
								{$usersById[log.user_id] || `#${log.user_id}`}
								<span class="ml-1 text-xs text-gray-400">({log.role})</span>
							</td>
							<td class="px-4 py-3 text-sm whitespace-nowrap">
								<span
									class="rounded-full px-2 py-1 text-xs font-medium {getActionBadgeClass(
										log.action
									)}"
								>
									{log.action}
								</span>
							</td>
							<td class="px-4 py-3 font-mono text-sm whitespace-nowrap text-gray-700">
								{log.endpoint}
							</td>
						</tr>
						{#if expandedId === log.id}
							<tr>
								<td colspan="4" class="bg-gray-50 px-4 py-3">
									<div class="grid grid-cols-1 gap-3 text-xs md:grid-cols-2">
										<div>
											<p class="mb-1 font-medium text-gray-600">Data Baru</p>
											{#if prettyJson(log.request_data)}
												<pre
													class="overflow-x-auto rounded border border-gray-200 bg-white p-2">{prettyJson(
														log.request_data
													)}</pre>
											{:else}
												<p class="text-gray-400">-</p>
											{/if}
										</div>
										<div>
											<p class="mb-1 font-medium text-gray-600">Data Sebelumnya</p>
											{#if prettyJson(log.previous_data)}
												<pre
													class="overflow-x-auto rounded border border-gray-200 bg-white p-2">{prettyJson(
														log.previous_data
													)}</pre>
											{:else}
												<p class="text-gray-400">-</p>
											{/if}
										</div>
									</div>
									<p class="mt-2 text-xs text-gray-400">IP: {log.ip_address || '-'}</p>
								</td>
							</tr>
						{/if}
					{:else}
						<tr>
							<td colspan="4" class="px-4 py-8 text-center text-sm text-gray-500">
								Tidak ada log ditemukan.
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Infinite scroll footer (server-side pagination) -->
		{#if $logs.length > 0}
			<div
				class="mt-4 rounded-lg border-t border-gray-200 bg-white px-4 py-3 text-center shadow sm:px-6"
			>
				<p class="text-sm text-gray-500">
					Menampilkan <span class="font-medium">{$logs.length}</span> dari
					<span class="font-medium">{$pagination.total}</span> log
				</p>
				{#if $hasMore}
					<div
						use:infiniteScroll={{
							hasMore: $hasMore,
							onLoadMore: () => auditLogActions.loadPage()
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
