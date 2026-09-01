// src/lib/stores/armada.js

import { writable } from 'svelte/store';
import { api } from '../services/api.js';
import toast from 'svelte-french-toast';

/**
 * Armada (Fleet) Store - Admin only utk CRUD, dibaca semua role (dropdown Tambah Transaksi)
 */

export const armadas = writable([]);
export const isLoading = writable(false);
export const error = writable(null);

export const armadaActions = {
	async loadArmadas() {
		isLoading.set(true);
		error.set(null);

		try {
			const data = await api.armadas.getAll();
			armadas.set(Array.isArray(data) ? data : []);
			return data;
		} catch (err) {
			error.set(err.message);
			console.error('Failed to load armadas:', err);
			throw err;
		} finally {
			isLoading.set(false);
		}
	},

	async createArmada(armada_name) {
		isLoading.set(true);
		error.set(null);

		try {
			const newArmada = await api.armadas.create({ armada_name });
			armadas.update((current) => [...current, newArmada]);
			toast.success('Armada berhasil ditambahkan!');
			return newArmada;
		} catch (err) {
			toast.error(err.message || 'Gagal menambahkan armada');
			throw err;
		} finally {
			isLoading.set(false);
		}
	},

	async updateArmada(id, armada_name) {
		isLoading.set(true);
		error.set(null);

		try {
			const updated = await api.armadas.update(id, { armada_name });
			armadas.update((current) => current.map((a) => (a.id === id ? { ...a, ...updated } : a)));
			toast.success('Armada berhasil diupdate!');
			return updated;
		} catch (err) {
			toast.error(err.message || 'Gagal mengupdate armada');
			throw err;
		} finally {
			isLoading.set(false);
		}
	},

	async deleteArmada(id) {
		isLoading.set(true);
		error.set(null);

		try {
			await api.armadas.delete(id);
			armadas.update((current) => current.filter((a) => a.id !== id));
			toast.success('Armada berhasil dihapus!');
			return true;
		} catch (err) {
			toast.error(err.message || 'Gagal menghapus armada');
			throw err;
		} finally {
			isLoading.set(false);
		}
	}
};
