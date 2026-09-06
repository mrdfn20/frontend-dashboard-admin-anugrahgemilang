// src/lib/actions/lockBodyScroll.js

// Berapa modal yang lagi "minta" body dikunci - dihitung bareng (bukan boolean doang)
// biar aman kalau suatu saat ada 2 modal numpuk (modal konfirmasi di atas modal form,
// dsb) - body baru dibuka lagi kalau modal yang terakhir juga ditutup.
let lockCount = 0;
let previousOverflow = '';

/**
 * Svelte action: kunci scroll halaman belakang selama modal ini terpasang di DOM,
 * balikin lagi begitu modal ditutup/di-destroy. Pasang lewat `use:lockBodyScroll`
 * di elemen overlay paling luar tiap modal (`<div class="fixed inset-0 z-50 ...">`).
 */
export function lockBodyScroll() {
	if (lockCount === 0) {
		previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
	}
	lockCount++;

	return {
		destroy() {
			lockCount = Math.max(0, lockCount - 1);
			if (lockCount === 0) {
				document.body.style.overflow = previousOverflow;
			}
		}
	};
}
