// src/lib/utils/pdf.js

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

function formatRp(amount) {
	return new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		minimumFractionDigits: 0
	}).format(amount || 0);
}

/**
 * Generate PDF laporan (ringkasan + tabel per-wilayah atau per-transaksi) dan
 * trigger download di browser. Dipakai halaman Laporan.
 * @param {Object} params
 * @param {{startDate: string, endDate: string}} params.dateRange
 * @param {Object|null} params.customer - kalau diisi, laporan statement 1 pelanggan
 * @param {Object} params.summary - hasil GET /reports/summary
 * @param {Array} params.regionSummary - hasil GET /reports/summary-by-region (kosong kalau per-pelanggan)
 * @param {Array} params.transactions - detail transaksi
 * @param {(id: number) => string} params.getCustomerName
 * @returns {string} nama file yang di-generate (buat dipakai lagi di share WA)
 */
export function generateReportPdf({
	dateRange,
	customer,
	summary,
	regionSummary,
	transactions,
	getCustomerName
}) {
	const doc = new jsPDF();
	const pageWidth = doc.internal.pageSize.getWidth();
	let y = 15;

	doc.setFontSize(16);
	doc.setFont(undefined, 'bold');
	doc.text('CV. Anugrah Gemilang', pageWidth / 2, y, { align: 'center' });
	y += 7;

	doc.setFontSize(11);
	doc.setFont(undefined, 'normal');
	doc.text(
		customer
			? `Statement Pelanggan: ${customer.title || ''} ${customer.customer_name}`
			: 'Laporan Transaksi',
		pageWidth / 2,
		y,
		{ align: 'center' }
	);
	y += 6;

	doc.setFontSize(9);
	doc.setTextColor(100);
	doc.text(`Periode: ${dateRange.startDate} s/d ${dateRange.endDate}`, pageWidth / 2, y, {
		align: 'center'
	});
	y += 4;
	doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, pageWidth / 2, y, { align: 'center' });
	doc.setTextColor(0);
	y += 10;

	// Ringkasan
	doc.setFontSize(11);
	doc.setFont(undefined, 'bold');
	doc.text('Ringkasan', 14, y);
	y += 6;

	autoTable(doc, {
		startY: y,
		theme: 'plain',
		styles: { fontSize: 10 },
		body: [
			['Total Transaksi', String(summary.total_transactions)],
			['Tunai / Hutang', `${summary.cash_count} / ${summary.debt_count}`],
			['Total Pendapatan', formatRp(summary.total_income)],
			['Total Nilai Penjualan', formatRp(summary.total_sales)],
			['Total Galon Terisi', `${summary.total_gallon_filled} galon`],
			['Sisa Hutang (periode ini)', formatRp(summary.remaining_debt)]
		],
		columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } }
	});
	y = doc.lastAutoTable.finalY + 8;

	// Per wilayah (skip kalau statement 1 pelanggan)
	if (!customer && regionSummary?.length > 0) {
		doc.setFontSize(11);
		doc.setFont(undefined, 'bold');
		doc.text('Omzet & Hutang per Wilayah', 14, y);
		y += 4;

		autoTable(doc, {
			startY: y,
			head: [['Kecamatan', 'Transaksi', 'Pendapatan', 'Penjualan', 'Sisa Hutang']],
			body: regionSummary.map((r) => [
				r.region_name,
				String(r.total_transactions),
				formatRp(r.total_income),
				formatRp(r.total_sales),
				formatRp(r.remaining_debt)
			]),
			styles: { fontSize: 8 },
			headStyles: { fillColor: [128, 0, 32] }
		});
		y = doc.lastAutoTable.finalY + 8;
	}

	// Detail transaksi
	if (transactions?.length > 0) {
		doc.setFontSize(11);
		doc.setFont(undefined, 'bold');
		doc.text('Detail Transaksi', 14, y);
		y += 4;

		autoTable(doc, {
			startY: y,
			head: [['Tanggal', 'Pelanggan', 'Jenis', 'Total', 'Dibayar']],
			body: transactions.map((tx) => [
				tx.transaction_date,
				getCustomerName(tx.customer_id),
				tx.transaction_type,
				formatRp(tx.total_price),
				formatRp(tx.payment_amount)
			]),
			styles: { fontSize: 8 },
			headStyles: { fillColor: [128, 0, 32] }
		});
	}

	const filenamePart = customer
		? `statement-${customer.id}-${customer.customer_name}`
		: 'laporan-transaksi';
	const filename = `${filenamePart}-${dateRange.startDate}_${dateRange.endDate}.pdf`;
	doc.save(filename);
	return filename;
}
