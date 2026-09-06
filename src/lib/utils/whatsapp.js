// src/lib/utils/whatsapp.js

/**
 * Buka WhatsApp (app kalau di HP, WhatsApp Web kalau di desktop) dengan teks
 * yang udah diisi otomatis, siap dipilih mau dikirim ke siapa.
 *
 * CATATAN: WhatsApp gak punya cara resmi buat nempelin FILE (PDF/gambar) lewat
 * link kayak gini - cuma bisa teks. Kalau butuh kirim file PDF-nya juga, harus
 * di-export dulu (tombol Export PDF), baru dilampirkan manual dari WhatsApp
 * (pilih file dari folder Download).
 * @param {string} text - Isi pesan
 */
export function shareToWhatsApp(text) {
	const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
	window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Susun teks ringkasan laporan buat di-share ke WhatsApp.
 */
export function buildReportShareText({ dateRange, customer, summary }) {
	const formatRp = (amount) =>
		new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(amount || 0);

	const title = customer
		? `Statement ${customer.title || ''} ${customer.customer_name}`
		: 'Laporan Transaksi';

	return [
		`*CV. Anugrah Gemilang - ${title}*`,
		`Periode: ${dateRange.startDate} s/d ${dateRange.endDate}`,
		'',
		`Total Transaksi: ${summary.total_transactions}`,
		`Total Pendapatan: ${formatRp(summary.total_income)}`,
		`Total Nilai Penjualan: ${formatRp(summary.total_sales)}`,
		`Sisa Hutang: ${formatRp(summary.remaining_debt)}`
	].join('\n');
}
