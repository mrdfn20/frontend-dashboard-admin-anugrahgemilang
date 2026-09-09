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
// 🆕 Ringkasan (count + total sisa hutang) dari SELURUH data yang cocok filter, bukan cuma
// yang udah ke-load lewat infinite scroll - fix bug kartu ringkasan nunjukin angka lebih
// kecil dari yang sebenarnya sebelum di-scroll sampai habis. Lihat GET /getdebts/summary.
export const summary = writable({ count: 0, totalRemaining: 0 });
// 🐛 Bug ditemuin user (2026-09-10): `summary` di atas defaultnya {count:0, totalRemaining:0}
// - dan loadDebts() manggil loadPage() (yang punya `isLoading` sendiri) DULU baru
// loadSummary() SETELAHNYA. Jadi begitu tabel selesai kebuka (isLoading udah false, ada
// data), summary masih pending sejenak nunjukin 0/Rp0 seolah beneran kosong, baru bener
// pas loadSummary() kelar. summaryLoading dipisah dari isLoading (isLoading punya arti
// beda - punya list) biar halaman bisa nampilin skeleton di kartunya doang, bukan "0".
export const summaryLoading = writable(false);

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

	/**
	 * Ambil ringkasan (count + total sisa hutang) sesuai filter aktif - dipanggil bareng
	 * tiap kali list di-reset (load awal, ganti filter, reset filter, abis bayar hutang),
	 * biar kartu ringkasan selalu nunjukin angka SEBENARNYA (bukan cuma yang ke-load).
	 */
	async loadSummary() {
		summaryLoading.set(true);
		try {
			const currentFilters = get(filters);
			const params = { ...currentFilters };
			delete params.sortBy;
			delete params.sortOrder;
			Object.keys(params).forEach((key) => {
				if (params[key] === null || params[key] === '') {
					delete params[key];
				}
			});

			const result = await api.payments.getDebtsSummary(params);
			summary.set({
				count: result?.count ?? 0,
				totalRemaining: Number(result?.totalRemaining ?? 0)
			});
		} catch (err) {
			console.error('Failed to load debts summary:', err);
		} finally {
			summaryLoading.set(false);
		}
	},

	/** Load halaman pertama (nama lama dipertahankan, dipanggil dari onMount & setelah bayar hutang). */
	async loadDebts() {
		const result = await this.loadPage({ reset: true });
		await this.loadSummary();
		return result;
	},

	/**
	 * Terapkan filter baru lalu reload dari halaman 1.
	 * @param {Object} newFilters
	 */
	async applyFilters(newFilters) {
		filters.update((current) => ({ ...current, ...newFilters }));
		await this.loadPage({ reset: true });
		await this.loadSummary();
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
		await this.loadSummary();
	}
};
