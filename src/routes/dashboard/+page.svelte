<script>
	import { onMount } from 'svelte';
	import { api } from '$lib/services/api';

	let summary = null;
	let incomeSummary = null;
	let gallonSummary = null;
	let debtStatus = null;
	let todayActivity = null;
	let isLoading = true;
	let error = null;

	onMount(async () => {
		try {
			// Fetch all dashboard data in parallel
			[summary, incomeSummary, gallonSummary, debtStatus, todayActivity] = await Promise.all([
				api.getDashboardSummary(),
				api.getIncomeSummary(),
				api.getGallonSummary(),
				api.getDebtStatus(),
				api.getTodayActivity()
			]);
		} catch (err) {
			error = err.message;
		} finally {
			isLoading = false;
		}
	});

	// Helper to format currency
	function formatCurrency(amount) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(amount);
	}
</script>

<div>
	<!-- Greeting Header -->
	<div class="mb-6">
		<h1 class="text-2xl font-semibold text-gray-900">
			Selamat {new Date().getHours() < 12
				? 'pagi'
				: new Date().getHours() < 18
					? 'siang'
					: 'malam'}, CV Anugrah Gemilang
		</h1>
		<p class="text-gray-500">
			{new Date().toLocaleDateString('id-ID', {
				weekday: 'long',
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			})}
		</p>
	</div>

	{#if isLoading}
		<div class="flex h-64 items-center justify-center">
			<svg
				class="text-maroon-600 h-10 w-10 animate-spin"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
			>
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
				></circle>
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				></path>
			</svg>
		</div>
	{:else if error}
		<div class="border-l-4 border-red-600 bg-red-50 p-4">
			<div class="flex">
				<div>
					<p class="text-sm text-red-700">{error}</p>
				</div>
			</div>
		</div>
	{:else}
		<!-- Summary Task Panel -->
		<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
			<!-- Total transactions today -->
			<div class="rounded-lg bg-white p-4 shadow transition hover:shadow-md">
				<div class="flex items-center">
					<div class="mr-4 rounded-full bg-indigo-100 p-3 text-indigo-600">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
							/>
						</svg>
					</div>
					<div>
						<p class="text-sm text-gray-500">Total Transaksi Hari Ini</p>
						<p class="text-2xl font-semibold">{todayActivity?.total_transactions || 0}</p>
					</div>
				</div>
			</div>

			<!-- Cash transactions -->
			<div class="rounded-lg bg-white p-4 shadow transition hover:shadow-md">
				<div class="flex items-center">
					<div class="mr-4 rounded-full bg-green-100 p-3 text-green-600">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
					<div>
						<p class="text-sm text-gray-500">Transaksi Tunai</p>
						<p class="text-2xl font-semibold">{todayActivity?.cash_transactions || 0}</p>
					</div>
				</div>
			</div>

			<!-- Debt transactions -->
			<div class="rounded-lg bg-white p-4 shadow transition hover:shadow-md">
				<div class="flex items-center">
					<div class="mr-4 rounded-full bg-yellow-100 p-3 text-yellow-600">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
							/>
						</svg>
					</div>
					<div>
						<p class="text-sm text-gray-500">Transaksi Hutang</p>
						<p class="text-2xl font-semibold">{todayActivity?.debt_transactions || 0}</p>
					</div>
				</div>
			</div>

			<!-- Gallons in circulation -->
			<div class="rounded-lg bg-white p-4 shadow transition hover:shadow-md">
				<div class="flex items-center">
					<div class="mr-4 rounded-full bg-blue-100 p-3 text-blue-600">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
							/>
						</svg>
					</div>
					<div>
						<p class="text-sm text-gray-500">Galon Tersangkut</p>
						<p class="text-2xl font-semibold">{gallonSummary?.unreturned_gallons || 0}</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Business Analysis -->
		<div class="mb-6 rounded-lg bg-white p-6 shadow">
			<h2 class="mb-4 text-lg font-semibold">Analisis Bisnis</h2>
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
				<!-- Income Today -->
				<div class="rounded-lg border border-gray-200 p-4">
					<p class="text-sm text-gray-500">Pendapatan Hari Ini</p>
					<p class="text-2xl font-semibold">{formatCurrency(incomeSummary?.income_today || 0)}</p>
					<div class="mt-2 flex items-center">
						<span
							class={incomeSummary?.income_today > incomeSummary?.income_yesterday
								? 'text-green-500'
								: 'text-red-500'}
						>
							{incomeSummary?.income_today > incomeSummary?.income_yesterday ? '↑' : '↓'}
							{Math.abs(
								(((incomeSummary?.income_today || 0) - (incomeSummary?.income_yesterday || 0)) /
									(incomeSummary?.income_yesterday || 1 || 1)) *
									100
							).toFixed(1)}%
						</span>
						<span class="ml-2 text-xs text-gray-500">dari kemarin</span>
					</div>
				</div>

				<!-- Total Gallons Used -->
				<div class="rounded-lg border border-gray-200 p-4">
					<p class="text-sm text-gray-500">Total Galon Diisi</p>
					<p class="text-2xl font-semibold">{gallonSummary?.total_filled || 0}</p>
					<p class="mt-2 text-xs text-gray-500">Total: {gallonSummary?.total_filled || 0} galon</p>
				</div>

				<!-- Active Customers -->
				<div class="rounded-lg border border-gray-200 p-4">
					<p class="text-sm text-gray-500">Pelanggan Aktif</p>
					<p class="text-2xl font-semibold">{summary?.totalCustomers || 0}</p>
					<p class="mt-2 text-xs text-gray-500">
						Transaksi hari ini: {todayActivity?.total_transactions || 0}
					</p>
				</div>

				<!-- Debt Status -->
				<div class="rounded-lg border border-gray-200 p-4">
					<p class="text-sm text-gray-500">Status Hutang</p>
					<div class="flex items-center gap-2">
						<span class="rounded bg-green-100 px-2 py-1 text-xs text-green-800"
							>Lunas: {debtStatus?.lunas || 0}</span
						>
						<span class="rounded bg-red-100 px-2 py-1 text-xs text-red-800"
							>Belum: {debtStatus?.belumLunas || 0}</span
						>
					</div>
					<p class="mt-2 text-xs text-gray-500">
						Total hutang: {formatCurrency(summary?.totalDebt || 0)}
					</p>
				</div>
			</div>
		</div>

		<!-- Admin Activity -->
		<div class="rounded-lg bg-white p-6 shadow">
			<h2 class="mb-4 text-lg font-semibold">Aktivitas Admin</h2>
			<!-- No data placeholder, will be implemented later -->
			<p class="text-gray-500">Detail aktivitas akan ditampilkan di sini.</p>
		</div>
	{/if}
</div>
