// src/lib/stores/transactions.js

import { writable, derived, get } from 'svelte/store';
import { api } from '../services/api.js';
import toast from 'svelte-french-toast';

/**
 * Transaction Store - Manages transaction data state.
 * List-nya server-side paginated (Phase 9) - `transactions` menyimpan halaman-halaman
 * yang sudah di-load & di-append (bukan load semua sekaligus), infinite scroll manggil
 * `loadPage()` buat ambil halaman berikutnya dari server tiap kali sentinel kena scroll.
 */

// Base stores
export const transactions = writable([]);
export const selectedTransaction = writable(null);
export const isLoading = writable(false);
export const error = writable(null);
export const hasMore = writable(true);
export const deletedTransactions = writable([]); // buat fitur restore

// Filter state - sesuai dengan backend API parameters
export const filters = writable({
	customer_id: null,
	customer_name: '',
	transactionId: null, // Note: backend uses 'transactionId', not 'transaction_id'
	sub_region_id: null,
	sub_region_name: '',
	startDate: null,
	endDate: null,
	sortBy: 'transaction_date',
	sortOrder: 'DESC'
});

// Pagination state (server-driven - `total` datang dari BE, bukan estimasi)
export const pagination = writable({
	page: 1,
	limit: 10,
	total: 0
});

// Derived stores for computed values
export const transactionsCount = derived(transactions, ($transactions) => $transactions.length);

export const pendingTransactions = derived(transactions, ($transactions) =>
	$transactions.filter((t) => t.transaction_type === 'Hutang' && t.remaining_debt > 0)
);

export const todayTransactions = derived(transactions, ($transactions) => {
	const today = new Date().toISOString().split('T')[0];
	return $transactions.filter((t) => t.transaction_date.startsWith(today));
});

/**
 * Transaction Store Actions
 * Semua fungsi untuk manipulasi data transaction
 */
export const transactionActions = {
	/**
	 * Load 1 halaman transaksi dari server sesuai filter aktif.
	 * `reset: true` -> balik ke halaman 1 & ganti isi `transactions` (dipakai pas pertama
	 * buka halaman / filter berubah). `reset: false` -> ambil halaman BERIKUTNYA & append
	 * (dipakai infinite scroll).
	 */
	async loadPage({ reset = false } = {}) {
		if (!reset && !get(hasMore)) return; // gak ada halaman berikutnya

		isLoading.set(true);
		error.set(null);

		try {
			const currentFilters = get(filters);
			const currentPagination = get(pagination);
			const nextPage = reset ? 1 : currentPagination.page + 1;

			const params = {
				...currentFilters,
				page: nextPage,
				limit: currentPagination.limit
			};

			// Remove null/empty values
			Object.keys(params).forEach((key) => {
				if (params[key] === null || params[key] === '') {
					delete params[key];
				}
			});

			const { data, meta } = await api.transactions.getByFilterPaginated(params);

			if (reset) {
				transactions.set(data);
			} else {
				transactions.update((current) => [...current, ...data]);
			}

			const total = meta?.pagination?.total ?? data.length;
			pagination.update((p) => ({ ...p, page: nextPage, total }));
			hasMore.set(meta?.pagination?.hasNext ?? false);

			return data;
		} catch (err) {
			error.set(err.message);
			console.error('Failed to load transactions:', err);
			throw err;
		} finally {
			isLoading.set(false);
		}
	},

	/**
	 * Load initial transactions from API (alias `loadPage({ reset: true })` - nama lama
	 * dipertahankan karena dipanggil dari beberapa tempat).
	 */
	async loadTransactions() {
		return await this.loadPage({ reset: true });
	},

	/**
	 * Apply filters and reload transactions
	 * @param {Object} newFilters - Filter parameters
	 */
	async applyFilters(newFilters) {
		filters.update((current) => ({
			...current,
			...newFilters
		}));

		await this.loadPage({ reset: true });
	},

	/**
	 * Clear all filters and reload
	 */
	async clearFilters() {
		filters.set({
			customer_id: null,
			customer_name: '',
			transactionId: null,
			sub_region_id: null,
			sub_region_name: '',
			startDate: null,
			endDate: null,
			sortBy: 'transaction_date',
			sortOrder: 'DESC'
		});

		await this.loadPage({ reset: true });
	},

	/**
	 * Load single transaction by ID
	 * @param {number} id - Transaction ID
	 */
	async loadTransaction(id) {
		isLoading.set(true);
		error.set(null);

		try {
			const transaction = await api.transactions.getById(id);
			// Backend returns object directly, no .data wrapper
			selectedTransaction.set(transaction);
			return transaction;
		} catch (err) {
			error.set(err.message);
			console.error('Failed to load transaction:', err);
			throw err;
		} finally {
			isLoading.set(false);
		}
	},

	/**
	 * Create new transaction
	 * @param {Object} transactionData - Transaction data
	 */
	async createTransaction(transactionData) {
		isLoading.set(true);
		error.set(null);

		try {
			// Response addTransaction sudah lengkap (id + semua field transaksi), pakai langsung
			const newTransaction = await api.transactions.create(transactionData);

			// Add to the beginning of the list (latest first)
			transactions.update((current) => [newTransaction, ...current]);
			pagination.update((p) => ({ ...p, total: p.total + 1 }));

			toast.success('Transaksi berhasil ditambahkan!');
			return newTransaction;
		} catch (err) {
			error.set(err.message);
			toast.error(err.message || 'Gagal menambahkan transaksi');
			console.error('Failed to create transaction:', err);
			throw err;
		} finally {
			isLoading.set(false);
		}
	},

	/**
	 * Delete transaction (soft delete)
	 * @param {number} id - Transaction ID
	 */
	async deleteTransaction(id) {
		isLoading.set(true);
		error.set(null);

		try {
			await api.transactions.delete(id);

			// Remove from local store
			transactions.update((current) => current.filter((transaction) => transaction.id !== id));
			pagination.update((p) => ({ ...p, total: Math.max(0, p.total - 1) }));

			toast.success('Transaksi berhasil dihapus!');
			return true;
		} catch (err) {
			error.set(err.message);
			toast.error(err.message || 'Gagal menghapus transaksi');
			console.error('Failed to delete transaction:', err);
			throw err;
		} finally {
			isLoading.set(false);
		}
	},

	/**
	 * Restore deleted transaction
	 * @param {number} id - Transaction ID
	 */
	async restoreTransaction(id) {
		isLoading.set(true);
		error.set(null);

		try {
			// Response restore BE cuma { id, restoredAt }, bukan record transaksi lengkap -
			// ambil data lengkapnya dulu sebelum ditampilkan di list.
			await api.transactions.restore(id);
			const restoredTransaction = await api.transactions.getById(id);

			// Add back to the list
			transactions.update((current) => [restoredTransaction, ...current]);

			// Hilangkan dari daftar "terhapus" juga
			deletedTransactions.update((current) => current.filter((t) => t.id !== id));

			pagination.update((p) => ({ ...p, total: p.total + 1 }));

			toast.success('Transaksi berhasil dipulihkan!');
			return restoredTransaction;
		} catch (err) {
			error.set(err.message);
			toast.error(err.message || 'Gagal memulihkan transaksi');
			console.error('Failed to restore transaction:', err);
			throw err;
		} finally {
			isLoading.set(false);
		}
	},

	/**
	 * Load transaksi yang sudah dihapus (soft delete) - buat fitur restore
	 */
	async loadDeletedTransactions() {
		isLoading.set(true);
		error.set(null);

		try {
			const data = await api.transactions.getDeleted();
			deletedTransactions.set(Array.isArray(data) ? data : []);
			return data;
		} catch (err) {
			error.set(err.message);
			console.error('Failed to load deleted transactions:', err);
			throw err;
		} finally {
			isLoading.set(false);
		}
	},

	/**
	 * Pay debt for a transaction
	 * @param {number} transactionId - Transaction ID
	 * @param {number} amount - Payment amount
	 * @param {string} paymentDate - Payment date (optional)
	 */
	async payDebt(transactionId, amount, paymentDate = null) {
		isLoading.set(true);
		error.set(null);

		try {
			const paymentData = {
				transaction_id: transactionId,
				amount_paid: amount,
				payment_date: paymentDate
			};

			const result = await api.payments.payDebt(paymentData);

			// Update transaction in local store - pakai remainingDebt otoritatif dari BE
			// (bukan dihitung ulang di client, karena ada logika saldo pelanggan yang
			// tidak direplikasi di FE dan bisa bikin angka meleset).
			if (result.transactionId && result.remainingDebt !== undefined) {
				transactions.update((current) =>
					current.map((transaction) => {
						if (transaction.id === transactionId) {
							return {
								...transaction,
								remaining_debt: result.remainingDebt,
								status_hutang: result.remainingDebt > 0 ? 'Belum Lunas' : 'Lunas'
							};
						}
						return transaction;
					})
				);
			}

			toast.success(result.message || 'Pembayaran berhasil dicatat!');
			return result;
		} catch (err) {
			error.set(err.message);
			toast.error(err.message || 'Gagal mencatat pembayaran');
			console.error('Failed to pay debt:', err);
			throw err;
		} finally {
			isLoading.set(false);
		}
	},

	/**
	 * Search transactions by text
	 * @param {string} searchTerm - Search term
	 */
	async searchTransactions(searchTerm) {
		// Update filter with search term
		await this.applyFilters({
			customer_name: searchTerm
		});
	},

	/**
	 * Reset all state to initial values
	 */
	reset() {
		transactions.set([]);
		selectedTransaction.set(null);
		isLoading.set(false);
		error.set(null);
		hasMore.set(true);

		filters.set({
			customer_id: null,
			customer_name: '',
			transactionId: null,
			sub_region_id: null,
			sub_region_name: '',
			startDate: null,
			endDate: null,
			sortBy: 'transaction_date',
			sortOrder: 'DESC'
		});

		pagination.set({
			page: 1,
			limit: 10,
			total: 0
		});
	}
};

/**
 * Utility functions for formatting transaction data
 */
export const transactionHelpers = {
	/**
	 * Format currency for display
	 * @param {number} amount - Amount to format
	 */
	formatCurrency(amount) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(amount || 0);
	},

	/**
	 * Format date for display
	 * @param {string} dateString - Date string
	 */
	formatDate(dateString) {
		if (!dateString) return '-';
		return new Date(dateString).toLocaleDateString('id-ID', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	},

	/**
	 * Get status badge class
	 * @param {string} transactionType - Transaction type
	 * @param {number} remainingDebt - Remaining debt amount
	 */
	getStatusClass(transactionType, remainingDebt = 0) {
		if (transactionType === 'Tunai') {
			return 'bg-green-100 text-green-800';
		}

		if (transactionType === 'Hutang') {
			return remainingDebt > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800';
		}

		return 'bg-gray-100 text-gray-800';
	},

	/**
	 * Get status label
	 * @param {string} transactionType - Transaction type
	 * @param {number} remainingDebt - Remaining debt amount
	 */
	getStatusLabel(transactionType, remainingDebt = 0) {
		if (transactionType === 'Tunai') {
			return 'Lunas';
		}

		if (transactionType === 'Hutang') {
			return remainingDebt > 0 ? 'Belum Lunas' : 'Lunas';
		}

		return 'Unknown';
	}
};
