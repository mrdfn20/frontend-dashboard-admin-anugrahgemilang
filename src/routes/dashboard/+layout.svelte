<!-- src/routes/dashboard/+layout.svelte - Final Enhanced Version -->
<script>
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth';
	import { sidebar } from '$lib/stores/sidebar';
	import SidebarSkeleton from '$lib/components/SidebarSkeleton.svelte';

	let sidebarElement;
	let cleanupFocusTrap;
	let touchCleanup;

	// 🆕 Performance: Intersection Observer for smooth animations
	let isInViewport = true;
	let intersectionObserver;

	onMount(() => {
		if (!$auth.isAuthenticated) {
			goto('/');
		}

		// Initialize sidebar store
		sidebar.init();

		// 🆕 Setup intersection observer for performance
		if ('IntersectionObserver' in window) {
			intersectionObserver = new IntersectionObserver(
				(entries) => {
					isInViewport = entries[0].isIntersecting;
				},
				{ threshold: 0.1 }
			);
		}
	});

	onDestroy(() => {
		// Cleanup everything
		if (cleanupFocusTrap) cleanupFocusTrap();
		if (touchCleanup) touchCleanup();
		if (intersectionObserver) intersectionObserver.disconnect();
		sidebar.destroy();
	});

	// 🆕 Setup touch gestures when sidebar element is ready
	$: if (sidebarElement && $sidebar.isMobile && !touchCleanup) {
		touchCleanup = sidebar.setupTouchGestures(sidebarElement);
	}

	// Reactive focus management
	$: if ($sidebar.isMobile && $sidebar.isOpen && sidebarElement && !$sidebar.isLoading) {
		cleanupFocusTrap = setupFocusTrap(sidebarElement);
	} else if (cleanupFocusTrap) {
		cleanupFocusTrap();
		cleanupFocusTrap = null;
	}

	// Focus trap function
	function setupFocusTrap(element) {
		if (!element) return;

		const focusableElements = element.querySelectorAll(
			'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
		);

		const firstElement = focusableElements[0];
		const lastElement = focusableElements[focusableElements.length - 1];

		function handleTabKey(e) {
			if (e.key === 'Tab') {
				if (e.shiftKey) {
					if (document.activeElement === firstElement) {
						lastElement?.focus();
						e.preventDefault();
					}
				} else {
					if (document.activeElement === lastElement) {
						firstElement?.focus();
						e.preventDefault();
					}
				}
			}
		}

		element.addEventListener('keydown', handleTabKey);
		firstElement?.focus();

		return () => {
			element.removeEventListener('keydown', handleTabKey);
		};
	}

	function handleLogout() {
		auth.logout();
		goto('/');
	}

	function isActiveRoute(route) {
		return $page.url.pathname.startsWith(route);
	}

	function handleMenuClick() {
		sidebar.closeOnMobile();
	}

	function handleOverlayClick(event) {
		if (event.target === event.currentTarget) {
			sidebar.close();
		}
	}

	// 🆕 Get page title dynamically
	function getPageTitle() {
		if (isActiveRoute('/dashboard/customers')) return 'Manajemen Pelanggan';
		if (isActiveRoute('/dashboard/transactions')) return 'Manajemen Transaksi';
		if (isActiveRoute('/dashboard/payments')) return 'Manajemen Pembayaran';
		if (isActiveRoute('/dashboard/reports')) return 'Laporan';
		if ($page.url.pathname === '/dashboard') return 'Dashboard';
		return 'Dashboard';
	}

	// 🆕 Calculate swipe transform for visual feedback
	$: swipeTransform = $sidebar.isSwipeActive
		? `translateX(-${$sidebar.swipeProgress * 2.5}px)`
		: '';

	// 🆕 Calculate swipe opacity for visual feedback
	$: swipeOpacity = $sidebar.isSwipeActive ? Math.max(0.3, 1 - $sidebar.swipeProgress / 100) : 1;
</script>

<div class="min-h-screen bg-gray-100">
	<!-- 🆕 Loading Skeleton - Show while sidebar is loading -->
	{#if $sidebar.isLoading}
		<SidebarSkeleton />
	{/if}

	<!-- Mobile Overlay with Enhanced Blur Effect -->
	{#if $sidebar.isMobile && $sidebar.isOpen && !$sidebar.isLoading}
		<div
			class="ease-spring fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-all duration-500"
			on:click={handleOverlayClick}
			role="button"
			tabindex="0"
			on:keydown={(e) => e.key === 'Escape' && sidebar.close()}
			aria-label="Close sidebar"
			style="opacity: {swipeOpacity}"
		></div>
	{/if}

	<!-- Main Sidebar with All Enhancements -->
	{#if !$sidebar.isLoading}
		<div
			bind:this={sidebarElement}
			class="bg-maroon-600 ease-spring fixed inset-y-0 left-0 z-50 w-64 transform text-white transition-all duration-500 will-change-transform
			{$sidebar.isOpen ? 'translate-x-0 scale-100 opacity-100' : '-translate-x-full scale-95 opacity-0'}
			{$sidebar.isAnimating ? 'pointer-events-none' : ''}"
			role="navigation"
			aria-label="Main navigation"
			aria-hidden={!$sidebar.isOpen}
			style="transform: {$sidebar.isOpen ? `translateX(0) ${swipeTransform}` : 'translateX(-100%)'};
					opacity: {$sidebar.isOpen ? swipeOpacity : 0};"
		>
			<!-- 🆕 Swipe Progress Indicator -->
			{#if $sidebar.isSwipeActive && $sidebar.swipeProgress > 10}
				<div
					class="absolute top-0 right-0 h-full w-1 bg-white/30 transition-all duration-150"
					style="transform: scaleY({$sidebar.swipeProgress / 100}); transform-origin: top;"
				></div>
			{/if}

			<!-- Header -->
			<div
				class="border-maroon-700 relative flex h-16 items-center justify-center overflow-hidden border-b"
			>
				<!-- 🆕 Subtle animated background -->
				<div
					class="from-maroon-700/0 via-maroon-700/5 to-maroon-700/0 absolute inset-0 animate-pulse
							bg-gradient-to-r"
				></div>
				<h1
					class="relative z-10 text-xl font-bold transition-all duration-300
						   {$sidebar.isSwipeActive ? 'scale-95' : 'scale-100'}"
				>
					CV Anugrah Gemilang
				</h1>
			</div>

			<!-- Navigation Menu -->
			<nav class="mt-5 space-y-1 px-2" role="list">
				<!-- Dashboard -->
				<a
					href="/dashboard"
					on:click={handleMenuClick}
					class="group hover:bg-maroon-700 focus:bg-maroon-700 flex items-center rounded-md px-2 py-3 text-base
						   font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg
						   focus:ring-2 focus:ring-white/20 focus:outline-none active:scale-95
						   {isActiveRoute('/dashboard') && $page.url.pathname === '/dashboard'
						? 'bg-maroon-700 scale-105 shadow-lg ring-2 ring-white/20'
						: ''}"
					role="listitem"
					aria-current={isActiveRoute('/dashboard') && $page.url.pathname === '/dashboard'
						? 'page'
						: undefined}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="mr-3 h-6 w-6 transition-all duration-200 group-hover:scale-110 group-hover:rotate-3"
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
					<span class="transition-all duration-200 group-hover:translate-x-1">Dashboard</span>
				</a>

				<!-- Customers -->
				<a
					href="/dashboard/customers"
					on:click={handleMenuClick}
					class="group hover:bg-maroon-700 focus:bg-maroon-700 flex items-center rounded-md px-2 py-3 text-base
						   font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg
						   focus:ring-2 focus:ring-white/20 focus:outline-none active:scale-95
						   {isActiveRoute('/dashboard/customers')
						? 'bg-maroon-700 scale-105 shadow-lg ring-2 ring-white/20'
						: ''}"
					role="listitem"
					aria-current={isActiveRoute('/dashboard/customers') ? 'page' : undefined}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="mr-3 h-6 w-6 transition-all duration-200 group-hover:scale-110 group-hover:rotate-3"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
						/>
					</svg>
					<span class="transition-all duration-200 group-hover:translate-x-1">Pelanggan</span>
				</a>

				<!-- Coming Soon Items with Better Styling -->
				<div class="space-y-1 opacity-60">
					<!-- Transactions -->
					<div
						class="group flex cursor-not-allowed items-center rounded-md px-2 py-3 text-base font-medium"
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
								d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
							/>
						</svg>
						<span>Transaksi</span>
						<span class="ml-auto rounded-full bg-yellow-500/20 px-2 py-1 text-xs text-yellow-200"
							>Soon</span
						>
					</div>

					<!-- Payments -->
					<div
						class="group flex cursor-not-allowed items-center rounded-md px-2 py-3 text-base font-medium"
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
								d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
							/>
						</svg>
						<span>Pembayaran</span>
						<span class="ml-auto rounded-full bg-yellow-500/20 px-2 py-1 text-xs text-yellow-200"
							>Soon</span
						>
					</div>

					<!-- Reports -->
					<div
						class="group flex cursor-not-allowed items-center rounded-md px-2 py-3 text-base font-medium"
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
								d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V7a2 2 0 012-2h2a2 2 0 012 2v2M7 7h10"
							/>
						</svg>
						<span>Laporan</span>
						<span class="ml-auto rounded-full bg-yellow-500/20 px-2 py-1 text-xs text-yellow-200"
							>Soon</span
						>
					</div>
				</div>
			</nav>

			<!-- 🆕 Enhanced Keyboard shortcuts hint with animations -->
			{#if !$sidebar.isMobile && isInViewport}
				<div
					class="absolute right-4 bottom-4 left-4 text-xs text-gray-300/75 transition-all duration-500
							{$sidebar.isOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}"
				>
					<div class="space-y-1 rounded-lg bg-black/10 p-3 backdrop-blur-sm">
						<p class="font-medium text-white/90">💡 Shortcuts:</p>
						<p>ESC - Close | Ctrl+Shift+B - Toggle</p>
						{#if $sidebar.isMobile}
							<p>👆 Swipe left to close</p>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Content area with enhanced transitions -->
	<div
		class="ease-spring transition-all duration-500 will-change-transform
		{$sidebar.isOpen && !$sidebar.isMobile && !$sidebar.isLoading ? 'ml-64' : 'ml-0'}"
	>
		<!-- Enhanced Top header -->
		<header
			class="flex items-center justify-between border-b border-gray-200 bg-white p-4 shadow-sm"
		>
			<div class="flex items-center">
				<!-- Enhanced Hamburger Button -->
				<button
					on:click={sidebar.toggle}
					disabled={$sidebar.isAnimating}
					class="focus:ring-maroon-500/20 mr-4 rounded-lg p-2 text-gray-600 transition-all
						   duration-200 hover:scale-110 hover:bg-gray-100 hover:text-gray-900
						   hover:shadow-md focus:bg-gray-100 focus:text-gray-900 focus:ring-2 focus:outline-none
						   active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
					aria-label="Toggle sidebar"
					title="Toggle sidebar (Ctrl+Shift+B)"
				>
					<svg
						class="h-6 w-6 transition-all duration-300
						{$sidebar.isOpen ? 'rotate-90' : 'rotate-0'}
						{$sidebar.isAnimating ? 'animate-pulse' : ''}"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 12h16M4 18h16"
						/>
					</svg>
				</button>

				<!-- Dynamic Page Title with Loading State -->
				<div class="flex items-center">
					{#if $sidebar.isLoading}
						<div class="h-6 w-48 animate-pulse rounded bg-gray-300"></div>
					{:else}
						<h1 class="text-xl font-semibold text-gray-900 transition-all duration-300">
							{getPageTitle()}
						</h1>
					{/if}
				</div>
			</div>

			<div class="flex items-center space-x-4">
				<!-- User dropdown with enhanced styling -->
				<div class="relative flex items-center">
					{#if $sidebar.isLoading}
						<div class="h-8 w-8 animate-pulse rounded-full bg-gray-300"></div>
						<div class="ml-3 h-8 w-16 animate-pulse rounded bg-gray-300"></div>
					{:else}
						<button
							type="button"
							class="focus:ring-maroon-500 flex max-w-xs items-center rounded-full bg-gray-800 text-sm
								   transition-all duration-200 hover:scale-105 hover:shadow-lg
								   focus:ring-2 focus:ring-offset-2 focus:outline-none active:scale-95"
							title="User menu"
						>
							<img
								class="h-8 w-8 rounded-full"
								src="https://ui-avatars.com/api/?name={$auth.user?.username ||
									'User'}&background=800020&color=fff"
								alt="User avatar"
							/>
						</button>

						<button
							on:click={handleLogout}
							class="bg-maroon-600 hover:bg-maroon-700 focus:ring-maroon-500/20 ml-3 rounded-lg border border-transparent px-4 py-2 text-sm font-medium
								   text-white transition-all duration-200 hover:scale-105 hover:shadow-lg
								   focus:ring-2 focus:outline-none active:scale-95"
						>
							Logout
						</button>
					{/if}
				</div>
			</div>
		</header>

		<!-- Main content with loading transition -->
		<main class="transition-all duration-300 {$sidebar.isLoading ? 'opacity-50' : 'opacity-100'}">
			<slot />
		</main>
	</div>
</div>

<style>
	/* Enhanced Maroon Color Palette */
	:global(.bg-maroon-600) {
		background-color: #800020;
	}
	:global(.hover\:bg-maroon-700:hover) {
		background-color: #600018;
	}
	:global(.bg-maroon-700) {
		background-color: #600018;
	}
	:global(.border-maroon-700) {
		border-color: #600018;
	}
	:global(.focus\:ring-maroon-500:focus) {
		--tw-ring-color: rgba(128, 0, 32, 0.2);
	}

	/* Enhanced Spring Easing */
	:global(.ease-spring) {
		transition-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
	}

	/* Performance optimizations */
	:global(.will-change-transform) {
		will-change: transform;
	}

	/* Improved focus styles */
	:global(.focus\:ring-2:focus) {
		--tw-ring-offset-width: 2px;
	}

	/* Enhanced hover effects */
	:global(.hover\:shadow-lg:hover) {
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.1),
			0 4px 6px -2px rgba(0, 0, 0, 0.05);
	}

	/* Smooth text rendering */
	:global(*) {
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}
</style>
