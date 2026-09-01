// src/lib/actions/selectOnFocus.js

/**
 * Svelte action: select seluruh isi input saat difokus, supaya user bisa langsung
 * ketik angka baru tanpa harus hapus manual angka lama (mis. angka 0 default) dulu.
 * Pasang lewat `use:selectOnFocus` di input type="number"/"text" yang berisi angka.
 */
export function selectOnFocus(node) {
	const handleFocus = () => node.select();
	node.addEventListener('focus', handleFocus);

	return {
		destroy() {
			node.removeEventListener('focus', handleFocus);
		}
	};
}
