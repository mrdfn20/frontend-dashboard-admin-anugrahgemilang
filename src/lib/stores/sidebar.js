// src/lib/stores/sidebar.js - Enhanced Final Version
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createSidebarStore() {
	const { subscribe, set, update } = writable({
		isOpen: false,
		isMobile: false,
		isLoading: true, // 🆕 Loading state
		isAnimating: false, // 🆕 Animation state
		swipeProgress: 0, // 🆕 Swipe progress (0-100)
		isSwipeActive: false // 🆕 Swipe state
	});

	let resizeTimeout;
	let touchCleanup;
	let loadingTimeout;

	// Performance: Reduced motion detection
	function prefersReducedMotion() {
		if (!browser) return false;
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	// Check if screen is mobile
	function checkIsMobile() {
		if (!browser) return false;
		return window.innerWidth < 768;
	}

	// 🆕 Touch Gesture Handler
	function setupTouchGestures(element) {
		if (!browser || !element) return;

		let startX = 0;
		let currentX = 0;
		let isDragging = false;
		let startTime = 0;
		const SWIPE_THRESHOLD = 100; // pixels
		const VELOCITY_THRESHOLD = 0.5; // pixels per ms
		const MAX_SWIPE_DISTANCE = 250; // Max distance for progress calculation

		function handleTouchStart(e) {
			startX = e.touches[0].clientX;
			startTime = Date.now();
			isDragging = true;

			update((state) => ({
				...state,
				isSwipeActive: true,
				swipeProgress: 0
			}));
		}

		function handleTouchMove(e) {
			if (!isDragging) return;

			currentX = e.touches[0].clientX;
			const deltaX = startX - currentX; // Negative = swipe right, Positive = swipe left

			// Only handle left swipe (closing gesture)
			if (deltaX > 0) {
				const progress = Math.min((deltaX / MAX_SWIPE_DISTANCE) * 100, 100);

				update((state) => ({
					...state,
					swipeProgress: progress
				}));

				// Prevent page scroll during swipe
				e.preventDefault();
			}
		}

		function handleTouchEnd(e) {
			if (!isDragging) return;

			const endX = e.changedTouches[0].clientX;
			const deltaX = startX - endX;
			const deltaTime = Date.now() - startTime;
			const velocity = Math.abs(deltaX) / deltaTime;

			// Determine if should close
			const shouldClose = deltaX > SWIPE_THRESHOLD || velocity > VELOCITY_THRESHOLD;

			if (shouldClose && deltaX > 0) {
				close();
			}

			// Reset swipe state
			update((state) => ({
				...state,
				isSwipeActive: false,
				swipeProgress: 0
			}));

			isDragging = false;
		}

		// Add touch listeners
		element.addEventListener('touchstart', handleTouchStart, { passive: false });
		element.addEventListener('touchmove', handleTouchMove, { passive: false });
		element.addEventListener('touchend', handleTouchEnd, { passive: true });

		// Return cleanup function
		return () => {
			element.removeEventListener('touchstart', handleTouchStart);
			element.removeEventListener('touchmove', handleTouchMove);
			element.removeEventListener('touchend', handleTouchEnd);
		};
	}

	// 🆕 Initialize with loading state
	function init() {
		if (!browser) return;

		// Start with loading
		set({
			isOpen: false,
			isMobile: false,
			isLoading: true,
			isAnimating: false,
			swipeProgress: 0,
			isSwipeActive: false
		});

		// Simulate component loading (real scenario: wait for auth check, etc.)
		loadingTimeout = setTimeout(() => {
			const isMobile = checkIsMobile();

			update((state) => ({
				...state,
				isOpen: !isMobile, // Desktop: open, Mobile: closed
				isMobile,
				isLoading: false
			}));

			setupKeyboardShortcuts();
		}, 800); // 800ms loading simulation
	}

	// Enhanced toggle with animation state
	function toggle() {
		update((state) => {
			if (state.isAnimating) return state; // Prevent double-toggle

			return {
				...state,
				isOpen: !state.isOpen,
				isAnimating: true
			};
		});

		// Reset animation state after transition
		const duration = prefersReducedMotion() ? 0 : 500;
		setTimeout(() => {
			update((state) => ({
				...state,
				isAnimating: false
			}));
		}, duration);
	}

	// Enhanced close with animation
	function close() {
		update((state) => {
			if (!state.isOpen || state.isAnimating) return state;

			return {
				...state,
				isOpen: false,
				isAnimating: true
			};
		});

		const duration = prefersReducedMotion() ? 0 : 500;
		setTimeout(() => {
			update((state) => ({
				...state,
				isAnimating: false
			}));
		}, duration);
	}

	// Enhanced open with animation
	function open() {
		update((state) => {
			if (state.isOpen || state.isAnimating) return state;

			return {
				...state,
				isOpen: true,
				isAnimating: true
			};
		});

		const duration = prefersReducedMotion() ? 0 : 500;
		setTimeout(() => {
			update((state) => ({
				...state,
				isAnimating: false
			}));
		}, duration);
	}

	// Rest of the existing functions remain the same...
	function closeOnMobile() {
		update((state) => ({
			...state,
			isOpen: state.isMobile ? false : state.isOpen
		}));
	}

	function handleResize() {
		if (!browser) return;

		clearTimeout(resizeTimeout);
		resizeTimeout = setTimeout(() => {
			const isMobile = checkIsMobile();

			update((state) => {
				const wasMobile = state.isMobile;
				const newState = { ...state, isMobile };

				if (wasMobile && !isMobile) {
					newState.isOpen = true;
				} else if (!wasMobile && isMobile) {
					newState.isOpen = false;
				} else if (!isMobile) {
					newState.isOpen = true;
				}

				return newState;
			});
		}, 150);
	}

	// Keyboard shortcuts
	let keyboardCleanup;
	function setupKeyboardShortcuts() {
		if (!browser) return;

		function handleKeydown(event) {
			if (event.key === 'Escape') {
				close();
			}
			if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'B') {
				event.preventDefault();
				toggle();
			}
		}

		document.addEventListener('keydown', handleKeydown);
		keyboardCleanup = () => {
			document.removeEventListener('keydown', handleKeydown);
		};
	}

	// Cleanup function
	function destroy() {
		if (keyboardCleanup) keyboardCleanup();
		if (touchCleanup) touchCleanup();
		if (resizeTimeout) clearTimeout(resizeTimeout);
		if (loadingTimeout) clearTimeout(loadingTimeout);
	}

	// Setup event listeners
	if (browser) {
		window.addEventListener('resize', handleResize);
		init();
	}

	return {
		subscribe,
		toggle,
		open,
		close,
		closeOnMobile,
		init,
		destroy,
		setupTouchGestures
	};
}

export const sidebar = createSidebarStore();
