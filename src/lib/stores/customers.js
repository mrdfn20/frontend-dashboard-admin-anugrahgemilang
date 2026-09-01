// src/lib/stores/customers.js

import { writable, derived, get } from 'svelte/store';
import customerService from '../services/customers.js';
import { formatCustomerForDisplay } from '../models/customer.js';
import toast from 'svelte-french-toast';

/**
 * Customer Store - Manages customer data state
 */

// Base stores
export const customers = writable([]);
export const selectedCustomer = writable(null);
export const isLoading = writable(false);
export const error = writable(null);

// 🆕 Search functionality stores
export const searchTerm = writable('');

// 🆕 Filtered customers based on search term
export const filteredCustomers = derived([customers, searchTerm], ([$customers, $searchTerm]) => {
	// Jika search term kosong, return semua customers
	if (!$searchTerm.trim()) {
		return $customers;
	}

	// 🆕 Check if search term is ID format (/123)
	const idMatch = $searchTerm.match(/^\/(\d+)$/);
	if (idMatch) {
		const searchId = parseInt(idMatch[1]);
		return $customers.filter((customer) => customer.id === searchId);
	}

	// Filter customers berdasarkan multiple fields (existing logic)
	return $customers.filter(
		(customer) =>
			// Customer name
			(customer.customer_name || '').toLowerCase().includes($searchTerm.toLowerCase()) ||
			// Customer ID (string match for partial)
			customer.id.toString().includes($searchTerm) ||
			// WhatsApp number
			(customer.whatsapp_number && customer.whatsapp_number.includes($searchTerm)) ||
			// Address
			(customer.address || '').toLowerCase().includes($searchTerm.toLowerCase()) ||
			// Sub region name
			(customer.sub_region_name || '').toLowerCase().includes($searchTerm.toLowerCase())
	);
});

// Derived stores for computed values
export const customersCount = derived(customers, ($customers) => $customers.length);
export const filteredCustomersCount = derived(
	filteredCustomers,
	($filteredCustomers) => $filteredCustomers.length
);

export const formattedCustomers = derived(customers, ($customers) =>
	$customers.map((customer) => formatCustomerForDisplay(customer))
);

/**
 * Customer Store Actions
 * Semua fungsi untuk manipulasi data customer
 */
export const customerActions = {
	/**
	 * Load all customers from API
	 */
	async loadCustomers() {
		isLoading.set(true);
		error.set(null);

		try {
			const data = await customerService.getAllCustomers();
			customers.set(data);
			// Reset search ketika load customers baru
			searchTerm.set('');
			return data;
		} catch (err) {
			error.set(err.message);
			console.error('Failed to load customers:', err);
			throw err;
		} finally {
			isLoading.set(false);
		}
	},

	/**
	 * Load single customer by ID
	 * @param {number} id - Customer ID
	 */
	async loadCustomer(id) {
		isLoading.set(true);
		error.set(null);

		try {
			const customer = await customerService.getCustomerById(id);
			selectedCustomer.set(customer);
			return customer;
		} catch (err) {
			error.set(err.message);
			console.error('Failed to load customer:', err);
			throw err;
		} finally {
			isLoading.set(false);
		}
	},

	/**
	 * Create new customer
	 * @param {Object} customerData - Customer data
	 */
	async createCustomer(customerData) {
		isLoading.set(true);
		error.set(null);

		try {
			const newCustomer = await customerService.createCustomer(customerData);

			// Update store with proper response handling
			const customerToAdd = newCustomer.data || newCustomer;
			customers.update((list) => [...list, customerToAdd]);

			// Success toast
			toast.success('Customer berhasil ditambahkan!');
			return newCustomer;
		} catch (err) {
			// Error toast
			toast.error(err.message || 'Gagal menambahkan customer');
			throw err;
		} finally {
			isLoading.set(false);
		}
	},

	/**
	 * Update existing customer
	 * @param {number} id - Customer ID
	 * @param {Object} customerData - Updated customer data
	 */
	async updateCustomer(id, customerData) {
		isLoading.set(true);
		error.set(null);

		try {
			const updatedCustomer = await customerService.updateCustomer(id, customerData);

			// Update local store
			customers.update((list) =>
				list.map((customer) =>
					customer.id === id ? { ...customer, ...updatedCustomer } : customer
				)
			);

			// Update selected customer if it's the one being updated
			selectedCustomer.update((current) =>
				current && current.id === id ? { ...current, ...updatedCustomer } : current
			);

			toast.success('Customer berhasil diupdate!');
			return updatedCustomer;
		} catch (err) {
			toast.error(err.message || 'Gagal mengupdate customer');
			console.error('Failed to update customer:', err);
			throw err;
		} finally {
			isLoading.set(false);
		}
	},

	/**
	 * Delete customer
	 * @param {number} id - Customer ID
	 */
	async deleteCustomer(id) {
		isLoading.set(true);
		error.set(null);

		try {
			await customerService.deleteCustomer(id);

			// Remove from local store
			customers.update((list) => list.filter((customer) => customer.id !== id));

			// Clear selected customer if it's the deleted one
			selectedCustomer.update((current) => (current && current.id === id ? null : current));

			toast.success('Customer berhasil dihapus!');
			return true;
		} catch (err) {
			toast.error(err.message || 'Gagal menghapus customer');
			console.error('Failed to delete customer:', err);
			throw err;
		} finally {
			isLoading.set(false);
		}
	},

	/**
	 * Clear all stores (useful for logout, navigation)
	 */
	clearStore() {
		customers.set([]);
		selectedCustomer.set(null);
		isLoading.set(false);
		error.set(null);
		// 🆕 Reset search term
		searchTerm.set('');
	},

	/**
	 * Set search term (untuk manual control jika diperlukan)
	 * @param {string} term - Search term
	 */
	setSearchTerm(term) {
		searchTerm.set(term || '');
	},

	/**
	 * Clear search (shortcut)
	 */
	clearSearch() {
		searchTerm.set('');
	},

	/**
	 * 🔄 Updated: Search customers by multiple fields
	 * Sekarang return current filtered result, bukan derived store
	 * @param {string} term - Search term (optional, kalau kosong ambil dari store)
	 */
	searchCustomers(term) {
		if (term !== undefined) {
			searchTerm.set(term);
		}
		// Return current filtered customers
		return get(filteredCustomers);
	}
};
