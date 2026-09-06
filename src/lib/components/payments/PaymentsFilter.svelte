<!-- src/lib/components/payments/PaymentsFilter.svelte -->
<script>
	import { createEventDispatcher } from 'svelte';
	import Autosuggest from '$lib/components/ui/Autosuggest.svelte';

	// Props
	export let customers = []; // dipakai buat autosuggest nama pelanggan

	const dispatch = createEventDispatcher();

	// Local filter form state (dikirim ke parent saat "Terapkan" ditekan)
	let customer_name = '';
	let status = 'Belum Lunas';
	let startDate = '';
	let endDate = '';
	let sortBy = 'transaction_date';
	let sortOrder = 'DESC';

	function applyFilters() {
		dispatch('filter', {
			customer_name: customer_name.trim(),
			status: status || null,
			startDate: startDate || null,
			endDate: endDate || null,
			sortBy,
			sortOrder
		});
	}

	function resetFilters() {
		customer_name = '';
		status = 'Belum Lunas';
		startDate = '';
		endDate = '';
		sortBy = 'transaction_date';
		sortOrder = 'DESC';
		dispatch('reset');
	}
</script>

<form on:submit|preventDefault={applyFilters} class="mb-4 rounded-lg bg-white p-4 shadow">
	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
		<!-- Nama pelanggan (client-side) -->
		<div class="lg:col-span-2">
			<label
				for="payments-filter-customer-name"
				class="mb-1 block text-xs font-medium text-gray-500"
			>
				Nama Pelanggan
			</label>
			<Autosuggest
				id="payments-filter-customer-name"
				bind:value={customer_name}
				items={customers}
				getLabel={(c) => c.customer_name}
				getKey={(c) => c.id}
				placeholder="Cari nama pelanggan..."
				showClear
			/>
		</div>

		<!-- Status -->
		<div>
			<label for="payments-filter-status" class="mb-1 block text-xs font-medium text-gray-500">
				Status
			</label>
			<select
				id="payments-filter-status"
				bind:value={status}
				class="focus:ring-maroon-500 focus:border-maroon-500 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none"
			>
				<option value="Belum Lunas">Belum Lunas</option>
				<option value="Lunas">Lunas</option>
				<option value="">Semua</option>
			</select>
		</div>

		<!-- Tanggal mulai -->
		<div>
			<label for="payments-filter-start-date" class="mb-1 block text-xs font-medium text-gray-500">
				Dari Tanggal
			</label>
			<input
				id="payments-filter-start-date"
				type="date"
				bind:value={startDate}
				class="focus:ring-maroon-500 focus:border-maroon-500 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none"
			/>
		</div>

		<!-- Tanggal akhir -->
		<div>
			<label for="payments-filter-end-date" class="mb-1 block text-xs font-medium text-gray-500">
				Sampai Tanggal
			</label>
			<input
				id="payments-filter-end-date"
				type="date"
				bind:value={endDate}
				class="focus:ring-maroon-500 focus:border-maroon-500 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none"
			/>
		</div>

		<!-- Sort -->
		<div>
			<label for="payments-filter-sort" class="mb-1 block text-xs font-medium text-gray-500">
				Urutkan
			</label>
			<div class="flex gap-1">
				<select
					id="payments-filter-sort"
					bind:value={sortBy}
					class="focus:ring-maroon-500 focus:border-maroon-500 block w-full rounded-md border border-gray-300 px-2 py-2 text-sm shadow-sm focus:outline-none"
				>
					<option value="transaction_date">Tanggal</option>
					<option value="remaining_debt">Sisa Hutang</option>
				</select>
				<button
					type="button"
					on:click={() => (sortOrder = sortOrder === 'ASC' ? 'DESC' : 'ASC')}
					title={sortOrder === 'ASC' ? 'Terkecil/Terlama dulu' : 'Terbesar/Terbaru dulu'}
					class="rounded-md border border-gray-300 px-2 py-2 text-sm text-gray-600 hover:bg-gray-50"
				>
					{sortOrder === 'ASC' ? '↑' : '↓'}
				</button>
			</div>
		</div>
	</div>

	<div class="mt-3 flex justify-end gap-2">
		<button
			type="button"
			on:click={resetFilters}
			class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
		>
			Reset
		</button>
		<button
			type="submit"
			class="bg-maroon-600 hover:bg-maroon-700 rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm"
		>
			Terapkan Filter
		</button>
	</div>
</form>
