// src/lib/stores/payments.js

import { writable, get } from 'svelte/store';
import { api } from '../services/api.js';

/**
 * Payments/Debts Store - daftar hutang pelanggan lintas semua transaksi (GET /paymentlogs/getdebts).
 * List-nya server-side paginated (Phase 9), termasuk filter `customer_name` (BE sudah JOIN
 * ke tabel customers). Pembayaran sendiri lewat transactionActions.payDebt via PayDebtModal,
 * store ini cuma refresh listnya setelah itu.
 */

export const debts = writable([]);
export const isLoading = writable(false);
export const error = writable(null);
export const hasMore = writable(true);
export const pagination = writable({ page: 1, limit: 15, total: 0 });

// Filter state - sesuai parameter yang didukung GET /paymentlogs/getdebts
export const filters = writable({
	customer_name: '',
	status: 'Belum Lunas',
	startDate: null,
	endDate: null,
	sortBy: 'transaction_date',
	sortOrder: 'DESC'
});

export const paymentActions = {
	/**
	 * Load 1 halaman hutang dari server sesuai filter aktif.
	 * `reset: true` -> balik ke halaman 1 & ganti isi `debts`. `reset: false` -> ambil
	 * halaman berikutnya & append (dipakai infinite scroll).
	 */
	async loadPage({ reset = false } = {}) {
		if (!reset && !get(hasMore)) return;

		isLoading.set(true);
		error.set(null);

		try {
			const currentFilters = get(filters);
			const currentPagination = get(pagination);
			const nextPage = reset ? 1 : currentPagination.page + 1;

			const params = { ...currentFilters, page: nextPage, limit: currentPagination.limit };
			Object.keys(params).forEach((key) => {
				if (params[key] === null || params[key] === '') {
					delete params[key];
				}
			});

			const { data, meta } = await api.payments.getDebtsPaginated(params);

			if (reset) {
				debts.set(data);
			} else {
				debts.update((current) => [...current, ...data]);
			}

			const total = meta?.pagination?.total ?? data.length;
			pagination.update((p) => ({ ...p, page: nextPage, total }));
			hasMore.set(meta?.pagination?.hasNext ?? false);

			return data;
		} catch (err) {
			error.set(err.message);
			console.error('Failed to load debts:', err);
			throw err;
		} finally {
			isLoading.set(false);
		}
	},

	/** Load halaman pertama (nama lama dipertahankan, dipanggil dari onMount & setelah bayar hutang). */
	async loadDebts() {
		return await this.loadPage({ reset: true });
	},

	/**
	 * Terapkan filter baru lalu reload dari halaman 1.
	 * @param {Object} newFilters
	 */
	async applyFilters(newFilters) {
		filters.update((current) => ({ ...current, ...newFilters }));
		await this.loadPage({ reset: true });
	},

	/**
	 * Reset filter ke default lalu reload.
	 */
	async clearFilters() {
		filters.set({
			customer_name: '',
			status: 'Belum Lunas',
			startDate: null,
			endDate: null,
			sortBy: 'transaction_date',
			sortOrder: 'DESC'
		});
		await this.loadPage({ reset: true });
	}
};
