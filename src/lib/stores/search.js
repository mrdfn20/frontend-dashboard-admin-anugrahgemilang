// src/lib/stores/search.js

import { writable } from 'svelte/store';
import { api } from '../services/api.js';

/**
 * Global Search Store - overlay pencarian lintas Pelanggan/Transaksi/Hutang.
 * Debounced supaya nggak nembak API tiap keystroke.
 */

export const isOpen = writable(false);
export const query = writable('');
export const results = writable({ customers: [], transactions: [], debts: [] });
export const isLoading = writable(false);
export const error = writable(null);

let debounceTimer;
const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

async function runSearch(term) {
	isLoading.set(true);
	error.set(null);

	try {
		const data = await api.search(term);
		results.set({
			customers: data?.customers || [],
			transactions: data?.transactions || [],
			debts: data?.debts || []
		});
	} catch (err) {
		error.set(err.message);
		console.error('Global search failed:', err);
	} finally {
		isLoading.set(false);
	}
}

export const searchActions = {
	open() {
		isOpen.set(true);
	},

	close() {
		isOpen.set(false);
		clearTimeout(debounceTimer);
		query.set('');
		results.set({ customers: [], transactions: [], debts: [] });
		error.set(null);
		isLoading.set(false);
	},

	/**
	 * @param {string} value - teks yang baru diketik user
	 */
	setQuery(value) {
		query.set(value);
		clearTimeout(debounceTimer);

		const term = value.trim();
		if (term.length < MIN_QUERY_LENGTH) {
			results.set({ customers: [], transactions: [], debts: [] });
			isLoading.set(false);
			return;
		}

		debounceTimer = setTimeout(() => runSearch(term), DEBOUNCE_MS);
	}
};
