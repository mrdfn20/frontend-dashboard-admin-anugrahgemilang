// src/lib/stores/reports.js

import { writable, get } from 'svelte/store';
import { api } from '../services/api.js';

/**
 * Laporan Store - ringkasan + detail transaksi dalam satu rentang tanggal,
 * opsional dipersempit ke 1 pelanggan (statement per pelanggan).
 */

function defaultDateRange() {
	const end = new Date();
	const start = new Date();
	start.setDate(start.getDate() - 29); // 30 hari terakhir termasuk hari ini
	const fmt = (d) => d.toISOString().slice(0, 10);
	return { startDate: fmt(start), endDate: fmt(end) };
}

export const dateRange = writable(defaultDateRange());
// null = laporan global (semua pelanggan). Diisi objek customer kalau mau statement 1 pelanggan.
export const reportCustomer = writable(null);
export const summary = writable(null);
export const regionSummary = writable([]);
export const transactions = writable([]);
export const isLoading = writable(false);
export const error = writable(null);
export const hasGenerated = writable(false);

export const reportActions = {
	async generateReport() {
		isLoading.set(true);
		error.set(null);

		try {
			const range = get(dateRange);
			const customer = get(reportCustomer);
			const customerId = customer?.id;

			// Ringkasan per wilayah gak relevan kalau lagi liat statement 1 pelanggan doang
			// (dia cuma ada di 1 wilayah) - skip biar gak ada request/tampilan yang gak perlu.
			const [summaryData, regionSummaryData, transactionsData] = await Promise.all([
				api.reports.getSummary(range.startDate, range.endDate, customerId),
				customerId
					? Promise.resolve([])
					: api.reports.getSummaryByRegion(range.startDate, range.endDate),
				api.transactions.getByFilter({
					startDate: range.startDate,
					endDate: range.endDate,
					...(customerId ? { customer_id: customerId } : {}),
					sortBy: 'transaction_date',
					sortOrder: 'DESC'
				})
			]);

			summary.set(summaryData);
			regionSummary.set(Array.isArray(regionSummaryData) ? regionSummaryData : []);
			transactions.set(Array.isArray(transactionsData) ? transactionsData : []);
			hasGenerated.set(true);
		} catch (err) {
			error.set(err.message);
			console.error('Failed to generate report:', err);
			throw err;
		} finally {
			isLoading.set(false);
		}
	},

	setDateRange(range) {
		dateRange.set(range);
	},

	setReportCustomer(customer) {
		reportCustomer.set(customer);
	}
};
