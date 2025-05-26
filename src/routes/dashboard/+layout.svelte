<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth';

	onMount(() => {
		if (!$auth.isAuthenticated) {
			goto('/');
		}
	});

	function handleLogout() {
		auth.logout();
		goto('/');
	}
</script>

<div class="min-h-screen bg-gray-100">
	<!-- Sidebar -->
	<div
		class="bg-maroon-600 fixed inset-y-0 left-0 w-64 translate-x-0 transform text-white transition duration-300 md:translate-x-0"
	>
		<div class="border-maroon-700 flex h-16 items-center justify-center border-b">
			<h1 class="text-xl font-bold">CV Anugrah Gemilang</h1>
		</div>
		<nav class="mt-5 px-2">
			<a
				href="/dashboard"
				class="group hover:bg-maroon-700 flex items-center rounded-md px-2 py-2 text-base font-medium"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="mr-3 h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
					/>
				</svg>
				Dashboard
			</a>
			<!-- Add more nav items as needed -->
		</nav>
	</div>

	<!-- Content area -->
	<div class="md:pl-64">
		<!-- Top header -->
		<header class="flex items-center justify-between bg-white p-4 shadow">
			<div class="flex items-center">
				<span class="text-xl font-semibold text-gray-900">Dashboard</span>
			</div>

			<div class="flex items-center">
				<!-- User dropdown -->
				<div class="relative ml-3">
					<button
						type="button"
						class="focus:ring-maroon-500 flex max-w-xs items-center rounded-full bg-gray-800 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none"
					>
						<img
							class="h-8 w-8 rounded-full"
							src="https://ui-avatars.com/api/?name={$auth.user?.username ||
								'User'}&background=800020&color=fff"
							alt="User"
						/>
					</button>

					<button
						on:click={handleLogout}
						class="bg-maroon-600 hover:bg-maroon-700 ml-3 rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white"
					>
						Logout
					</button>
				</div>
			</div>
		</header>

		<!-- Main content -->
		<main class="p-6">
			<slot />
		</main>
	</div>
</div>
