// src/lib/stores/auditLogs.js

import { writable, get } from 'svelte/store';
import { api } from '../services/api.js';

/**
 * Audit Log Store (Admin only) - list-nya server-side paginated & search-nya juga
 * dijalankan di server (Phase 9) - BE join ke tabel users buat bisa search by username.
 */

export const logs = writable([]);
export const isLoading = writable(false);
export const error = writable(null);
export const searchTerm = writable('');
export const hasMore = writable(true);
export const pagination = writable({ page: 1, limit: 15, total: 0 });

// usersById: Map<id, username> - di-set dari luar (halaman) setelah users store ke-load,
// supaya audit log bisa nampilin username, bukan cuma user_id (BE gak nyertain username
// di kolom hasil, cuma dipakai internal buat filter search).
export const usersById = writable({});

export const auditLogActions = {
	/**
	 * Load 1 halaman audit log dari server sesuai search term aktif.
	 * `reset: true` -> balik ke halaman 1 & ganti isi `logs`. `reset: false` -> ambil
	 * halaman berikutnya & append (dipakai infinite scroll).
	 */
	async loadPage({ reset = false } = {}) {
		if (!reset && !get(hasMore)) return;

		isLoading.set(true);
		error.set(null);

		try {
			const currentPagination = get(pagination);
			const nextPage = reset ? 1 : currentPagination.page + 1;
			const search = get(searchTerm).trim();

			const params = { page: nextPage, limit: currentPagination.limit };
			if (search) params.search = search;

			const { data, meta } = await api.auditLogs.getLogsPaginated(params);

			if (reset) {
				logs.set(data);
			} else {
				logs.update((current) => [...current, ...data]);
			}

			const total = meta?.pagination?.total ?? data.length;
			pagination.update((p) => ({ ...p, page: nextPage, total }));
			hasMore.set(meta?.pagination?.hasNext ?? false);

			return data;
		} catch (err) {
			error.set(err.message);
			console.error('Failed to load audit logs:', err);
			throw err;
		} finally {
			isLoading.set(false);
		}
	},

	/** Load halaman pertama (nama lama dipertahankan, dipanggil dari onMount). */
	async loadLogs() {
		return await this.loadPage({ reset: true });
	},

	/** Ganti search term lalu reload dari halaman 1. */
	async search(term) {
		searchTerm.set(term);
		await this.loadPage({ reset: true });
	}
};
