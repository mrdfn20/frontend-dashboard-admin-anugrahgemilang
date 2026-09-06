<!-- src/routes/dashboard/+layout.svelte -->
<script>
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth';
	import { sidebar } from '$lib/stores/sidebar';
	import { searchActions } from '$lib/stores/search.js';
	import SidebarSkeleton from '$lib/components/SidebarSkeleton.svelte';
	import SearchOverlay from '$lib/components/search/SearchOverlay.svelte';

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

	async function handleLogout() {
		try {
			console.log('🚀 Starting logout process...');
			await auth.logout(); // Enhanced logout dengan loading state
			console.log('✅ Logout completed, redirecting...');
			goto('/');
		} catch (error) {
			console.error('❌ Logout error:', error);
			// Force redirect even if error occurs
			goto('/');
		}
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

	// Ctrl+K / Cmd+K - buka global search dari halaman manapun
	function handleGlobalKeydown(event) {
		if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
			event.preventDefault();
			if ($auth.user?.role !== 'Driver') {
				searchActions.open();
			}
		}
	}

	// 🆕 Get page title dynamically
	function getPageTitle() {
		if (isActiveRoute('/dashboard/customers')) return 'Manajemen Pelanggan';
		if (isActiveRoute('/dashboard/transactions')) return 'Manajemen Transaksi';
		if (isActiveRoute('/dashboard/gallon')) return 'Manajemen Galon';
		if (isActiveRoute('/dashboard/users')) return 'Manajemen User';
		if (isActiveRoute('/dashboard/audit-logs')) return 'Audit Log';
		if (isActiveRoute('/dashboard/armada')) return 'Kelola Armada';
		if (isActiveRoute('/dashboard/regions')) return 'Kelola Wilayah';
		if (isActiveRoute('/dashboard/payments')) return 'Manajemen Pembayaran';
		if (isActiveRoute('/dashboard/reports')) return 'Laporan';
		if (isActiveRoute('/dashboard/help')) return 'Panduan Penggunaan';
		if ($page.url.pathname === '/dashboard') return 'Dashboard';
		return 'Dashboard';
	}

	// 🆕 Calculate swipe transform for visual feedback
	$: swipeTransform = $sidebar.isSwipeActive
		? `translateX(-${$sidebar.swipeProgress * 2.5}px)`
		: '';

	// 🆕 Calculate swipe opacity for visual feedback
	$: swipeOpacity = $sidebar.isSwipeActive ? Math.max(0.3, 1 - $sidebar.swipeProgress / 100) : 1;

	function getUserInitial(username) {
		if (!username || username.trim() === '') return 'WR';
		const trimmed = username.trim().toUpperCase();
		return trimmed.length === 1 ? trimmed : trimmed.substring(0, 2);
	}

	// 🆕 State untuk bounce animation
	let isUserBouncing = false;

	// 🆕 Trigger bounce animation
	function triggerBounce() {
		isUserBouncing = true;
		setTimeout(() => {
			isUserBouncing = false;
		}, 600); // Duration sesuai dengan CSS animation
	}
</script>

<svelte:window on:keydown={handleGlobalKeydown} />

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
			class="bg-maroon-600 ease-spring fixed inset-y-0 left-0 z-50 flex w-64 transform flex-col text-white transition-all duration-500 will-change-transform
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
				class="border-maroon-700 relative flex h-16 flex-shrink-0 items-center justify-center overflow-hidden border-b"
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
			<!-- pb-24 - kasih ruang di bawah biar item menu terakhir gak ketutupan sama kotak
			     Shortcuts yang posisinya absolute di bawah sidebar -->
			<nav class="mt-5 flex-1 space-y-1 overflow-y-auto px-2 pb-24" role="list">
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

				<!-- Transactions (& Pembayaran Hutang menyatu di halaman ini) -->
				<a
					href="/dashboard/transactions"
					on:click={handleMenuClick}
					class="group hover:bg-maroon-700 focus:bg-maroon-700 flex items-center rounded-md px-2 py-3 text-base
						   font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg
						   focus:ring-2 focus:ring-white/20 focus:outline-none active:scale-95
						   {isActiveRoute('/dashboard/transactions')
						? 'bg-maroon-700 scale-105 shadow-lg ring-2 ring-white/20'
						: ''}"
					role="listitem"
					aria-current={isActiveRoute('/dashboard/transactions') ? 'page' : undefined}
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
							d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
						/>
					</svg>
					<span class="transition-all duration-200 group-hover:translate-x-1">Transaksi</span>
				</a>

				<!-- Gallon -->
				<a
					href="/dashboard/gallon"
					on:click={handleMenuClick}
					class="group hover:bg-maroon-700 focus:bg-maroon-700 flex items-center rounded-md px-2 py-3 text-base
						   font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg
						   focus:ring-2 focus:ring-white/20 focus:outline-none active:scale-95
						   {isActiveRoute('/dashboard/gallon')
						? 'bg-maroon-700 scale-105 shadow-lg ring-2 ring-white/20'
						: ''}"
					role="listitem"
					aria-current={isActiveRoute('/dashboard/gallon') ? 'page' : undefined}
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
							d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
						/>
					</svg>
					<span class="transition-all duration-200 group-hover:translate-x-1">Galon</span>
				</a>

				<!-- Hutang (semua role bisa lihat; tombol bayar disembunyikan di halamannya utk Driver) -->
				<a
					href="/dashboard/payments"
					on:click={handleMenuClick}
					class="group hover:bg-maroon-700 focus:bg-maroon-700 flex items-center rounded-md px-2 py-3 text-base
						   font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg
						   focus:ring-2 focus:ring-white/20 focus:outline-none active:scale-95
						   {isActiveRoute('/dashboard/payments')
						? 'bg-maroon-700 scale-105 shadow-lg ring-2 ring-white/20'
						: ''}"
					role="listitem"
					aria-current={isActiveRoute('/dashboard/payments') ? 'page' : undefined}
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
							d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
						/>
					</svg>
					<span class="transition-all duration-200 group-hover:translate-x-1">Hutang</span>
				</a>

				{#if $auth.user?.role === 'Admin'}
					<!-- User Management (Admin only) -->
					<a
						href="/dashboard/users"
						on:click={handleMenuClick}
						class="group hover:bg-maroon-700 focus:bg-maroon-700 flex items-center rounded-md px-2 py-3 text-base
							   font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg
							   focus:ring-2 focus:ring-white/20 focus:outline-none active:scale-95
							   {isActiveRoute('/dashboard/users')
							? 'bg-maroon-700 scale-105 shadow-lg ring-2 ring-white/20'
							: ''}"
						role="listitem"
						aria-current={isActiveRoute('/dashboard/users') ? 'page' : undefined}
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
								d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
							/>
						</svg>
						<span class="transition-all duration-200 group-hover:translate-x-1"
							>User Management</span
						>
					</a>

					<!-- Audit Log (Admin only) -->
					<a
						href="/dashboard/audit-logs"
						on:click={handleMenuClick}
						class="group hover:bg-maroon-700 focus:bg-maroon-700 flex items-center rounded-md px-2 py-3 text-base
							   font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg
							   focus:ring-2 focus:ring-white/20 focus:outline-none active:scale-95
							   {isActiveRoute('/dashboard/audit-logs')
							? 'bg-maroon-700 scale-105 shadow-lg ring-2 ring-white/20'
							: ''}"
						role="listitem"
						aria-current={isActiveRoute('/dashboard/audit-logs') ? 'page' : undefined}
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
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
						<span class="transition-all duration-200 group-hover:translate-x-1">Audit Log</span>
					</a>

					<!-- Kelola Armada (Admin only) -->
					<a
						href="/dashboard/armada"
						on:click={handleMenuClick}
						class="group hover:bg-maroon-700 focus:bg-maroon-700 flex items-center rounded-md px-2 py-3 text-base
							   font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg
							   focus:ring-2 focus:ring-white/20 focus:outline-none active:scale-95
							   {isActiveRoute('/dashboard/armada')
							? 'bg-maroon-700 scale-105 shadow-lg ring-2 ring-white/20'
							: ''}"
						role="listitem"
						aria-current={isActiveRoute('/dashboard/armada') ? 'page' : undefined}
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
								d="M8 17h8m-8 0a2 2 0 100 4 2 2 0 000-4zm8 0a2 2 0 100 4 2 2 0 000-4zm-8 0V9a1 1 0 011-1h6l4 4v5m-11 0H4a1 1 0 01-1-1v-3a1 1 0 011-1h1m14 0h1a1 1 0 001-1v-2a1 1 0 00-.293-.707L17 8"
							/>
						</svg>
						<span class="transition-all duration-200 group-hover:translate-x-1">Kelola Armada</span>
					</a>

					<!-- Kelola Wilayah (Admin only) -->
					<a
						href="/dashboard/regions"
						on:click={handleMenuClick}
						class="group hover:bg-maroon-700 focus:bg-maroon-700 flex items-center rounded-md px-2 py-3 text-base
							   font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg
							   focus:ring-2 focus:ring-white/20 focus:outline-none active:scale-95
							   {isActiveRoute('/dashboard/regions')
							? 'bg-maroon-700 scale-105 shadow-lg ring-2 ring-white/20'
							: ''}"
						role="listitem"
						aria-current={isActiveRoute('/dashboard/regions') ? 'page' : undefined}
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
								d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
							/>
						</svg>
						<span class="transition-all duration-200 group-hover:translate-x-1">Kelola Wilayah</span
						>
					</a>
				{/if}

				<!-- Reports -->
				<a
					href="/dashboard/reports"
					on:click={handleMenuClick}
					class="group hover:bg-maroon-700 focus:bg-maroon-700 flex items-center rounded-md px-2 py-3 text-base
						   font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg
						   focus:ring-2 focus:ring-white/20 focus:outline-none active:scale-95
						   {isActiveRoute('/dashboard/reports')
						? 'bg-maroon-700 scale-105 shadow-lg ring-2 ring-white/20'
						: ''}"
					role="listitem"
					aria-current={isActiveRoute('/dashboard/reports') ? 'page' : undefined}
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
							d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V7a2 2 0 012-2h2a2 2 0 012 2v2M7 7h10"
						/>
					</svg>
					<span class="transition-all duration-200 group-hover:translate-x-1">Laporan</span>
				</a>

				<!-- Panduan Penggunaan (semua role) -->
				<a
					href="/dashboard/help"
					on:click={handleMenuClick}
					class="group hover:bg-maroon-700 focus:bg-maroon-700 flex items-center rounded-md px-2 py-3 text-base
						   font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg
						   focus:ring-2 focus:ring-white/20 focus:outline-none active:scale-95
						   {isActiveRoute('/dashboard/help')
						? 'bg-maroon-700 scale-105 shadow-lg ring-2 ring-white/20'
						: ''}"
					role="listitem"
					aria-current={isActiveRoute('/dashboard/help') ? 'page' : undefined}
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
							d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<span class="transition-all duration-200 group-hover:translate-x-1">Panduan</span>
				</a>
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
						<p>Ctrl+K - Cari</p>
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
				<!-- Global Search (Admin & Editor saja, Driver tidak punya akses BE-nya) -->
				{#if $auth.user?.role !== 'Driver'}
					<button
						type="button"
						on:click={searchActions.open}
						title="Cari (Ctrl+K)"
						class="focus:ring-maroon-500/20 rounded-lg p-2 text-gray-600 transition-all duration-200
							   hover:scale-110 hover:bg-gray-100 hover:text-gray-900 hover:shadow-md focus:bg-gray-100
							   focus:text-gray-900 focus:ring-2 focus:outline-none active:scale-95"
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
							/>
						</svg>
					</button>
				{/if}

				<!-- User Avatar dengan Username Initial -->
				<div class="relative flex items-center">
					{#if $sidebar.isLoading}
						<div class="h-10 w-10 animate-pulse rounded-full bg-gray-300"></div>
						<div class="ml-3 h-6 w-16 animate-pulse rounded bg-gray-300"></div>
					{:else}
						<!-- 🆕 Custom User Avatar dengan Initial -->
						<button
							type="button"
							on:click={triggerBounce}
							class="user-avatar-btn focus:ring-maroon-500 flex max-w-xs items-center rounded-full text-sm
					   transition-all duration-200 hover:scale-110 focus:ring-2 focus:ring-offset-2 focus:outline-none
					   {isUserBouncing ? 'animate-bounce-cartoon' : ''}"
							title="Hello, {$auth.user?.username || 'User'}!"
						>
							<div
								class="user-initial-avatar flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white shadow-lg"
							>
								{getUserInitial($auth.user?.username)}
							</div>
						</button>

						<!-- Welcome Text -->
						<div class="ml-3 hidden sm:block">
							<p class="text-sm font-medium text-gray-700">Welcome back,</p>
							<p class="text-xs text-gray-500">
								{$auth.user?.username || 'User'} | {$auth.user?.role || 'Visit'}
							</p>
						</div>

						<!-- Logout Button -->
						<button
							on:click={handleLogout}
							disabled={$auth.isLoggingOut}
							class="bg-maroon-600 hover:bg-maroon-700 focus:ring-maroon-500/20 ml-3 rounded-lg border border-transparent px-4 py-2 text-sm font-medium
		   text-white transition-all duration-200 hover:scale-105 hover:shadow-lg
		   focus:ring-2 focus:outline-none active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
						>
							{#if $auth.isLoggingOut}
								<svg
									class="mr-2 -ml-1 h-4 w-4 animate-spin text-white"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
								>
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
								Logging out...
							{:else}
								Logout
							{/if}
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

<SearchOverlay />

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

	/* 🆕 Gradient Maroon to Gold yang Elegan */
	:global(.user-initial-avatar) {
		background: linear-gradient(
			135deg,
			#800020 0%,
			#a0002a 25%,
			#c41e3a 50%,
			#e6b800 75%,
			#ffd700 100%
		);
		box-shadow:
			0 4px 8px rgba(128, 0, 32, 0.3),
			0 2px 4px rgba(255, 215, 0, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
		position: relative;
		overflow: hidden;
	}

	/* 🆕 Efek Shimmer untuk Gold Touch */
	:global(.user-initial-avatar::before) {
		content: '';
		position: absolute;
		top: -50%;
		left: -50%;
		width: 200%;
		height: 200%;
		background: linear-gradient(45deg, transparent, rgba(255, 215, 0, 0.1), transparent);
		animation: shimmer 3s infinite;
		pointer-events: none;
	}

	/* 🆕 Bounce Kartun Animation */
	@keyframes bounce-cartoon {
		0% {
			transform: translateY(0) scale(1);
		}
		20% {
			transform: translateY(-8px) scale(1.05);
		}
		40% {
			transform: translateY(-4px) scale(1.02);
		}
		60% {
			transform: translateY(-6px) scale(1.03);
		}
		80% {
			transform: translateY(-2px) scale(1.01);
		}
		100% {
			transform: translateY(0) scale(1);
		}
	}

	/* 🆕 Shimmer Animation */
	@keyframes shimmer {
		0% {
			transform: translateX(-100%) translateY(-100%) rotate(45deg);
		}
		100% {
			transform: translateX(100%) translateY(100%) rotate(45deg);
		}
	}

	/* 🆕 Hover Bounce Effect */
	:global(.user-avatar-btn:hover .user-initial-avatar) {
		animation: bounce-cartoon 0.6s ease-in-out;
		transform: scale(1.1);
	}

	/* 🆕 Custom Bounce Animation Class */
	:global(.animate-bounce-cartoon) {
		animation: bounce-cartoon 0.6s ease-in-out;
	}

	/* 🆕 Enhanced Maroon Colors */
	:global(.bg-maroon-600) {
		background-color: #800020;
	}
	:global(.hover\:bg-maroon-700:hover) {
		background-color: #600018;
	}
	:global(.focus\:ring-maroon-500:focus) {
		--tw-ring-color: rgba(128, 0, 32, 0.2);
	}

	/* 🆕 Responsive Improvements */
	@media (max-width: 640px) {
		:global(.user-initial-avatar) {
			width: 36px;
			height: 36px;
			font-size: 0.75rem;
		}
	}
</style>
