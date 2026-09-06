// src/lib/stores/regions.js

import { writable } from 'svelte/store';
import { api } from '../services/api.js';
import toast from 'svelte-french-toast';

/**
 * Region & Sub-Region Store - Admin only utk CRUD, dibaca semua role
 * (dropdown filter Pelanggan, form Tambah Pelanggan).
 */

export const regions = writable([]);
export const subRegions = writable([]);
export const isLoading = writable(false);
export const error = writable(null);

export const regionActions = {
	async loadAll() {
		isLoading.set(true);
		error.set(null);

		try {
			const [regionsData, subRegionsData] = await Promise.all([
				api.regions.getAll(),
				api.regions.getSubRegions()
			]);
			regions.set(Array.isArray(regionsData) ? regionsData : []);
			subRegions.set(Array.isArray(subRegionsData) ? subRegionsData : []);
		} catch (err) {
			error.set(err.message);
			console.error('Failed to load regions:', err);
			throw err;
		} finally {
			isLoading.set(false);
		}
	},

	async createRegion(region_name, region_type) {
		try {
			const newRegion = await api.regions.create({ region_name, region_type });
			regions.update((current) =>
				[...current, newRegion].sort((a, b) => a.region_name.localeCompare(b.region_name))
			);
			toast.success('Kecamatan berhasil ditambahkan!');
			return newRegion;
		} catch (err) {
			toast.error(err.message || 'Gagal menambahkan kecamatan');
			throw err;
		}
	},

	async updateRegion(id, region_name, region_type) {
		try {
			const updated = await api.regions.update(id, { region_name, region_type });
			regions.update((current) =>
				current
					.map((r) => (r.id === id ? { ...r, ...updated } : r))
					.sort((a, b) => a.region_name.localeCompare(b.region_name))
			);
			toast.success('Kecamatan berhasil diupdate!');
			return updated;
		} catch (err) {
			toast.error(err.message || 'Gagal mengupdate kecamatan');
			throw err;
		}
	},

	async deleteRegion(id) {
		try {
			await api.regions.delete(id);
			regions.update((current) => current.filter((r) => r.id !== id));
			toast.success('Kecamatan berhasil dihapus!');
			return true;
		} catch (err) {
			toast.error(err.message || 'Gagal menghapus kecamatan');
			throw err;
		}
	},

	async createSubRegion(region_id, sub_region_name) {
		try {
			const newSubRegion = await api.regions.createSubRegion({ region_id, sub_region_name });
			// Reload biar region_name (hasil JOIN) ikut kebawa, bukan cuma region_id mentah
			await regionActions.loadAll();
			toast.success('Sub-wilayah berhasil ditambahkan!');
			return newSubRegion;
		} catch (err) {
			toast.error(err.message || 'Gagal menambahkan sub-wilayah');
			throw err;
		}
	},

	async updateSubRegion(id, region_id, sub_region_name) {
		try {
			const updated = await api.regions.updateSubRegion(id, { region_id, sub_region_name });
			await regionActions.loadAll();
			toast.success('Sub-wilayah berhasil diupdate!');
			return updated;
		} catch (err) {
			toast.error(err.message || 'Gagal mengupdate sub-wilayah');
			throw err;
		}
	},

	async deleteSubRegion(id) {
		try {
			await api.regions.deleteSubRegion(id);
			subRegions.update((current) => current.filter((sr) => sr.id !== id));
			toast.success('Sub-wilayah berhasil dihapus!');
			return true;
		} catch (err) {
			toast.error(err.message || 'Gagal menghapus sub-wilayah');
			throw err;
		}
	}
};
