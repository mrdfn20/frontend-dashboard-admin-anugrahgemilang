// src/lib/stores/users.js

import { writable } from 'svelte/store';
import { api } from '../services/api.js';
import toast from 'svelte-french-toast';

/**
 * User Management Store (Admin only)
 */

export const users = writable([]);
export const isLoading = writable(false);
export const error = writable(null);

export const userActions = {
	/**
	 * Load semua user
	 */
	async loadUsers() {
		isLoading.set(true);
		error.set(null);

		try {
			const data = await api.users.getAll();
			users.set(Array.isArray(data) ? data : []);
			return data;
		} catch (err) {
			error.set(err.message);
			console.error('Failed to load users:', err);
			throw err;
		} finally {
			isLoading.set(false);
		}
	},

	/**
	 * Daftarkan user baru
	 * @param {Object} data - { username, password, role }
	 */
	async registerUser(data) {
		isLoading.set(true);
		error.set(null);

		try {
			const newUser = await api.users.register(data);
			// Response register cuma { id, ... } dari insert - reload list biar dapat data lengkap
			await this.loadUsers();
			toast.success('User berhasil didaftarkan!');
			return newUser;
		} catch (err) {
			error.set(err.message);
			toast.error(err.message || 'Gagal mendaftarkan user');
			console.error('Failed to register user:', err);
			throw err;
		} finally {
			isLoading.set(false);
		}
	},

	/**
	 * Hapus user berdasarkan username
	 * @param {string} username
	 */
	async deleteUser(username) {
		isLoading.set(true);
		error.set(null);

		try {
			await api.users.delete(username);
			users.update((current) => current.filter((u) => u.username !== username));
			toast.success('User berhasil dihapus!');
			return true;
		} catch (err) {
			error.set(err.message);
			toast.error(err.message || 'Gagal menghapus user');
			console.error('Failed to delete user:', err);
			throw err;
		} finally {
			isLoading.set(false);
		}
	}
};
