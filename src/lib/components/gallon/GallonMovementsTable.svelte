<!-- src/lib/components/gallon/GallonMovementsTable.svelte -->
<script>
	// Props
	export let movements = []; // sudah di-join sama nama pelanggan dari parent
	export let isLoading = false;

	function formatDate(dateString) {
		return new Date(dateString).toLocaleDateString('id-ID', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function getBadgeClass(saldo) {
		const n = Number(saldo);
		if (n <= 0) return 'bg-green-100 text-green-800';
		if (n <= 5) return 'bg-yellow-100 text-yellow-800';
		return 'bg-red-100 text-red-800';
	}
</script>

<div class="overflow-hidden rounded-lg bg-white shadow">
	<div class="overflow-x-auto">
		<table class="min-w-full divide-y divide-gray-200">
			<thead class="bg-gray-50">
				<tr>
					<th
						class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Tanggal
					</th>
					<th
						class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Pelanggan
					</th>
					<th
						class="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Isi / Kosong / Retur
					</th>
					<th
						class="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Saldo Galon
					</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200">
				{#each movements as m (m.transaction_id)}
					<tr class="hover:bg-gray-50">
						<td class="px-4 py-3 text-sm whitespace-nowrap text-gray-700">
							{formatDate(m.transaction_date)}
						</td>
						<td class="px-4 py-3 text-sm font-medium whitespace-nowrap text-gray-900">
							{m.customer_name || `#${m.customer_id}`}
						</td>
						<td class="px-4 py-3 text-right text-sm whitespace-nowrap text-gray-700">
							{m.gallon_filled} / {m.gallon_empty} / {m.gallon_returned}
						</td>
						<td class="px-4 py-3 text-right text-sm whitespace-nowrap">
							<span
								class="rounded-full px-2 py-1 text-xs font-medium {getBadgeClass(m.saldo_galon)}"
							>
								{m.saldo_galon} galon
							</span>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="4" class="px-4 py-8 text-center text-sm text-gray-500">
							{isLoading ? 'Memuat riwayat...' : 'Tidak ada data ditemukan.'}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
