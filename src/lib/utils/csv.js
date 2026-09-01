// src/lib/utils/csv.js

/**
 * Generate string CSV dari array of object, lalu trigger download di browser.
 * @param {Array<Object>} rows - Data yang mau diexport
 * @param {Array<{key: string, label: string}>} columns - Kolom yang diambil & urutannya
 * @param {string} filename - Nama file (tanpa .csv)
 */
export function exportToCsv(rows, columns, filename) {
	if (!rows || rows.length === 0) return;

	const escapeCell = (value) => {
		const str = value === null || value === undefined ? '' : String(value);
		// Bungkus quote kalau ada koma, quote, atau newline di dalamnya
		if (/[",\n]/.test(str)) {
			return `"${str.replace(/"/g, '""')}"`;
		}
		return str;
	};

	const header = columns.map((col) => escapeCell(col.label)).join(',');
	const body = rows
		.map((row) => columns.map((col) => escapeCell(row[col.key])).join(','))
		.join('\n');

	// BOM supaya Excel baca karakter non-ASCII (Rp, dll) dengan benar
	const BOM = String.fromCharCode(0xfeff);
	const csvContent = BOM + header + '\n' + body;
	const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
	const url = URL.createObjectURL(blob);

	const link = document.createElement('a');
	link.href = url;
	link.download = `${filename}.csv`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}
