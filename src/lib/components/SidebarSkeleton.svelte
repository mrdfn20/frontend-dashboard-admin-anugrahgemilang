<!-- src/lib/components/SidebarSkeleton.svelte -->
<script>
	export let isVisible = true;
</script>

{#if isVisible}
	<div class="bg-maroon-600 fixed inset-y-0 left-0 z-50 w-64 animate-pulse text-white">
		<!-- Header Skeleton -->
		<div class="border-maroon-700 flex h-16 items-center justify-center border-b">
			<div class="bg-maroon-500 h-6 w-48 rounded"></div>
		</div>

		<!-- Navigation Skeleton -->
		<nav class="mt-5 space-y-2 px-2">
			<!-- Dashboard Item -->
			<div class="flex items-center rounded-md px-2 py-2">
				<div class="bg-maroon-500 mr-3 h-6 w-6 rounded"></div>
				<div class="bg-maroon-500 h-4 w-20 rounded"></div>
			</div>

			<!-- Pelanggan Item -->
			<div class="flex items-center rounded-md px-2 py-2">
				<div class="bg-maroon-500 mr-3 h-6 w-6 rounded"></div>
				<div class="bg-maroon-500 h-4 w-16 rounded"></div>
			</div>

			<!-- Transaksi Item -->
			<div class="flex items-center rounded-md px-2 py-2 opacity-50">
				<div class="bg-maroon-500 mr-3 h-6 w-6 rounded"></div>
				<div class="bg-maroon-500 h-4 w-24 rounded"></div>
				<div class="bg-maroon-500 ml-2 h-3 w-10 rounded text-xs"></div>
			</div>

			<!-- Pembayaran Item -->
			<div class="flex items-center rounded-md px-2 py-2 opacity-50">
				<div class="bg-maroon-500 mr-3 h-6 w-6 rounded"></div>
				<div class="bg-maroon-500 h-4 w-20 rounded"></div>
				<div class="bg-maroon-500 ml-2 h-3 w-10 rounded text-xs"></div>
			</div>

			<!-- Laporan Item -->
			<div class="flex items-center rounded-md px-2 py-2 opacity-50">
				<div class="bg-maroon-500 mr-3 h-6 w-6 rounded"></div>
				<div class="bg-maroon-500 h-4 w-16 rounded"></div>
				<div class="bg-maroon-500 ml-2 h-3 w-10 rounded text-xs"></div>
			</div>
		</nav>

		<!-- Bottom Hints Skeleton -->
		<div class="absolute right-4 bottom-4 left-4 space-y-1">
			<div class="bg-maroon-500 h-3 w-16 rounded opacity-30"></div>
			<div class="bg-maroon-500 h-3 w-32 rounded opacity-30"></div>
		</div>
	</div>
{/if}

<style>
	:global(.bg-maroon-600) {
		background-color: #800020;
	}
	:global(.bg-maroon-700) {
		background-color: #600018;
	}
	:global(.bg-maroon-500) {
		background-color: #a0002a;
	}
	:global(.border-maroon-700) {
		border-color: #600018;
	}
</style>
