<!-- src/routes/dashboard/help/+page.svelte -->
<script>
	import { auth } from '$lib/stores/auth';

	const sections = [
		{
			title: '👥 Pelanggan',
			items: [
				{
					q: 'Cara nambah pelanggan baru',
					a: 'Buka menu Pelanggan → klik "Tambah Pelanggan" di pojok kanan atas → isi semua data (nama, alamat, harga galon, dll) → Simpan.'
				},
				{
					q: 'Cara edit data pelanggan',
					a: 'Klik ikon pensil (Edit) di baris pelanggan yang mau diubah, atau buka detail pelanggan dulu lalu klik Edit.'
				},
				{
					q: 'Cara cari pelanggan',
					a: 'Ketik apa aja di kotak pencarian (nama, alamat, no WA) - hasilnya langsung nyaring. Kalau tahu ID persis, ketik "/" diikuti angkanya, misal "/123".'
				},
				{
					q: 'Cara pakai filter (Tipe, Harga Galon, Hutang, Kecamatan, Sub-Wilayah)',
					a: 'Ada beberapa dropdown filter di atas tabel Pelanggan. Bisa dipakai bareng-bareng (misal: Tipe = Rumah DAN ada Hutang). Klik "Reset filter" buat balikin semua ke normal.'
				},
				{
					q: 'Kartu "Aktif Transaksi Bulan Ini" & "Tidak Aktif Bulan Ini" itu apa?',
					a: 'Angka pelanggan yang punya/gak punya transaksi bulan berjalan. Klik kartunya buat langsung nyaring daftar pelanggan sesuai itu - klik lagi buat batalin.'
				},
				{
					q: 'Cara hapus pelanggan, dan kalau salah hapus gimana?',
					a: 'Klik ikon tempat sampah (Hapus) di baris pelanggan. Kalau kelewat/salah hapus, buka tombol "Pelanggan Terhapus" di pojok kanan atas halaman Pelanggan, cari pelanggannya, klik "Kembalikan".'
				},
				{
					q: 'Cara koreksi saldo pelanggan (kalau salah input)',
					a: 'Buka detail pelanggan → tombol "Koreksi Saldo" (khusus Admin). Beda dari "+ Tambah Saldo" (yang cuma NAMBAH), "Koreksi Saldo" langsung MENIMPA ke angka yang kamu masukkan - bisa juga diisi 0 buat ngosongin saldo.'
				},
				{
					q: 'Cara lihat riwayat transaksi/hutang 1 pelanggan tertentu',
					a: 'Buka detail pelanggan tersebut - ada tabel "Riwayat Transaksi" di bagian bawah, isinya semua transaksi pelanggan itu beserta status Lunas/Belum Lunas, lengkap dengan tombol Bayar buat yang masih hutang. Cara cepat lain: dari halaman Transaksi, klik nama pelanggan di baris manapun - otomatis masuk ke detail pelanggan itu.'
				}
			]
		},
		{
			title: '💰 Transaksi',
			items: [
				{
					q: 'Cara input transaksi harian',
					a: 'Buka menu Transaksi → "Tambah Transaksi" → ketik nama pelanggan di kotak pencarian (gak perlu scroll dropdown panjang) → isi jumlah galon isi/kosong/kembali → pilih armada → pilih Tunai atau Hutang → isi jumlah yang dibayar (kalau Tunai, otomatis dianggap lunas) → Simpan.'
				},
				{
					q: 'Bedanya Tunai dan Hutang',
					a: 'Tunai = dibayar lunas saat itu juga. Hutang = belum dibayar penuh - sistem otomatis pakai saldo pelanggan (kalau ada) buat nutup sebagian, sisanya tercatat sebagai hutang aktif.'
				},
				{
					q: 'Cara bayar hutang pelanggan',
					a: 'Buka menu Hutang → cari transaksi hutang yang mau dibayar → klik "Bayar" → isi jumlah yang dibayar. Kalau bayarnya lebih dari sisa hutang, kelebihannya otomatis jadi saldo buat transaksi berikutnya.'
				},
				{
					q: 'Cara batalin transaksi yang salah input',
					a: 'Transaksi bisa dihapus (soft-delete, bisa di-restore) dalam waktu 60 menit setelah dibuat untuk role Editor; Admin gak ada batas waktu. Cari transaksinya di daftar, klik Hapus.'
				}
			]
		},
		{
			title: '🚰 Galon',
			items: [
				{
					q: 'Cara lihat stok galon yang belum kembali',
					a: 'Menu Galon menampilkan berapa galon yang masih di tangan tiap pelanggan (galon terkirim dikurangi yang udah balik). Ada juga tab riwayat pergerakan galon keseluruhan.'
				}
			]
		},
		{
			title: '🚚 Kelola Armada (khusus Admin)',
			items: [
				{
					q: 'Cara nambah/edit/hapus kendaraan',
					a: 'Menu Kelola Armada → Tambah/Edit/Hapus seperti biasa. Kendaraan yang masih dipakai di transaksi lama gak bisa dihapus (biar riwayat transaksi gak nyangkut ke data yang hilang) - hapus/ubah transaksinya dulu kalau memang perlu.'
				}
			]
		},
		{
			title: '🗺️ Kelola Wilayah (khusus Admin)',
			items: [
				{
					q: 'Cara nambah kecamatan / sub-wilayah baru',
					a: 'Menu Kelola Wilayah → ada 2 tabel: Kecamatan (kiri) dan Sub-Wilayah (kanan). Tambah kecamatan dulu kalau belum ada, baru tambah sub-wilayah di bawahnya (pilih kecamatan induknya).'
				},
				{
					q: 'Kenapa gak bisa hapus kecamatan/sub-wilayah tertentu?',
					a: 'Kecamatan gak bisa dihapus kalau masih ada sub-wilayah di bawahnya. Sub-wilayah gak bisa dihapus kalau masih ada pelanggan yang pakai wilayah itu. Pindahin/hapus dulu yang di bawahnya sebelum hapus yang di atas.'
				},
				{
					q: 'Wilayah ini kepake buat apa aja?',
					a: 'Buat filter di halaman Pelanggan (Kecamatan/Sub-Wilayah), dan buat laporan omzet/hutang per wilayah di halaman Laporan.'
				}
			]
		},
		{
			title: '📊 Laporan',
			items: [
				{
					q: 'Cara buat laporan',
					a: 'Menu Laporan → pilih rentang tanggal (Dari - Sampai) → klik "Buat Laporan". Muncul ringkasan (total transaksi, pendapatan, penjualan, hutang), tabel omzet/hutang per wilayah, dan daftar detail transaksinya.'
				},
				{
					q: 'Cara export ke Excel/CSV',
					a: 'Setelah laporan muncul, klik "Export CSV" - file bisa dibuka di Excel/Google Sheets.'
				}
			]
		},
		{
			title: '👤 Manajemen User (khusus Admin)',
			items: [
				{
					q: 'Apa bedanya role Admin, Editor, Driver?',
					a: 'Admin: akses penuh ke semua fitur termasuk kelola user, armada, wilayah, dan koreksi saldo. Editor: bisa nambah/edit pelanggan & transaksi sehari-hari, tapi gak bisa kelola user/armada/wilayah atau koreksi saldo. Driver: cuma bisa lihat data (gak bisa nambah/edit apapun) - cocok buat kurir yang perlu cek alamat/stok galon di lapangan.'
				}
			]
		}
	];

	let openIndex = null;
	function toggle(sectionIdx, itemIdx) {
		const key = `${sectionIdx}-${itemIdx}`;
		openIndex = openIndex === key ? null : key;
	}
</script>

<div class="p-6">
	<div class="mb-6">
		<h1 class="text-2xl font-semibold text-gray-900">Panduan Penggunaan</h1>
		<p class="text-gray-500">
			Cara pakai fitur-fitur di dashboard ini. Login sebagai
			<span class="font-medium">{$auth.user?.role || '-'}</span> - beberapa fitur di bawah cuma kelihatan/bisa
			dipakai kalau role kamu Admin.
		</p>
	</div>

	<div class="space-y-6">
		{#each sections as section, sectionIdx (section.title)}
			<div class="rounded-lg bg-white shadow">
				<div class="border-b border-gray-200 px-4 py-3">
					<h2 class="text-base font-semibold text-gray-900">{section.title}</h2>
				</div>
				<div class="divide-y divide-gray-200">
					{#each section.items as item, itemIdx (item.q)}
						<div>
							<button
								type="button"
								on:click={() => toggle(sectionIdx, itemIdx)}
								class="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50"
							>
								<span>{item.q}</span>
								<svg
									class="h-4 w-4 flex-shrink-0 text-gray-400 transition-transform {openIndex ===
									`${sectionIdx}-${itemIdx}`
										? 'rotate-180'
										: ''}"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 9l-7 7-7-7"
									/>
								</svg>
							</button>
							{#if openIndex === `${sectionIdx}-${itemIdx}`}
								<div class="px-4 pb-4 text-sm text-gray-600">{item.a}</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>
