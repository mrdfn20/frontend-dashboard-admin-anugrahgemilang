// src/lib/stores/gallon.js

import { writable } from 'svelte/store';
import { api } from '../services/api.js';

/**
 * Gallon Store - Rekap galon yang belum kembali per pelanggan.
 * Read-only (data hasil hitungan BE dari transaksi, tidak di-CRUD manual dari sini).
 */

export const gallonStock = writable([]);
export const isLoading = writable(false);
export const error = writable(null);

// Riwayat pergerakan galon (semua pelanggan) - tab "Riwayat Pergerakan" di halaman Galon
export const movements = writable([]);
export const movementsLoading = writable(false);
export const movementsError = writable(null);

// Filter state - sesuai parameter yang didukung GET /gallon/stock/filter
export const filters = writable({
	customer_name: '',
	sub_region_name: '',
	stockLimit: null,
	sortBy: 'customer_name',
	sortOrder: 'ASC'
});

export const gallonActions = {
	/**
	 * Load rekap stok galon sesuai filter yang aktif.
	 * Endpoint /gallon/stock/filter wajib minimal 1 filter - sortBy/sortOrder
	 * default selalu dikirim supaya syarat itu otomatis terpenuhi.
	 */
	async loadStock() {
		isLoading.set(true);
		error.set(null);

		try {
			const currentFilters = await new Promise((resolve) => {
				filters.subscribe((f) => resolve(f))();
			});

			const params = { ...currentFilters };
			Object.keys(params).forEach((key) => {
				if (params[key] === null || params[key] === '') {
					delete params[key];
				}
			});

			const response = await api.gallon.getStockFilter(params);
			const data = Array.isArray(response) ? response : [];
			gallonStock.set(data);
			return data;
		} catch (err) {
			error.set(err.message);
			console.error('Failed to load gallon stock:', err);
			throw err;
		} finally {
			isLoading.set(false);
		}
	},

	/**
	 * Terapkan filter baru lalu reload.
	 * @param {Object} newFilters
	 */
	async applyFilters(newFilters) {
		filters.update((current) => ({ ...current, ...newFilters }));
		await this.loadStock();
	},

	/**
	 * Reset filter ke default lalu reload.
	 */
	async clearFilters() {
		filters.set({
			customer_name: '',
			sub_region_name: '',
			stockLimit: null,
			sortBy: 'customer_name',
			sortOrder: 'ASC'
		});
		await this.loadStock();
	},

	/**
	 * Load riwayat pergerakan galon semua pelanggan (flat, sudah termasuk saldo_galon berjalan
	 * per pelanggan dari BE). Diurutkan ulang di sini terbaru dulu biar enak dibaca sbg feed.
	 */
	async loadMovements() {
		movementsLoading.set(true);
		movementsError.set(null);

		try {
			const data = await api.gallonMovements.getAll();
			const sorted = (Array.isArray(data) ? data : []).slice().sort((a, b) => {
				return new Date(b.transaction_date) - new Date(a.transaction_date);
			});
			movements.set(sorted);
			return sorted;
		} catch (err) {
			movementsError.set(err.message);
			console.error('Failed to load gallon movements:', err);
			throw err;
		} finally {
			movementsLoading.set(false);
		}
	}
};
