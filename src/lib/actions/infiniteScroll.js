// src/lib/actions/infiniteScroll.js

/**
 * Svelte action: taruh di elemen sentinel (biasanya div kosong di bawah list/tabel).
 * Ketika sentinel masuk viewport dan masih ada data (`hasMore`), panggil `onLoadMore`
 * buat nambah jumlah item yang ditampilkan (data sendiri sudah full di-fetch di store,
 * jadi ini murni reveal bertahap dari array yang sudah ada - bukan fetch baru ke server).
 *
 * Pemakaian:
 *   <div use:infiniteScroll={{ hasMore, onLoadMore: () => (visibleCount += itemsPerPage) }}></div>
 */
export function infiniteScroll(node, params) {
	let current = params;

	const observer = new IntersectionObserver(
		(entries) => {
			if (entries[0].isIntersecting && current?.hasMore) {
				current.onLoadMore();
			}
		},
		{ rootMargin: '200px' }
	);

	observer.observe(node);

	return {
		update(newParams) {
			current = newParams;
		},
		destroy() {
			observer.disconnect();
		}
	};
}
