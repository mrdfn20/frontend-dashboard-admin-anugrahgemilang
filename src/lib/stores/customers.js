// src/lib/stores/customers.js

import { writable, derived } from 'svelte/store';
import customerService from '../services/customers.js';
import { formatCustomerForDisplay } from '../models/customer.js';

/**
 * Customer Store - Manages customer data state
 */

// Base stores
export const customers = writable([]);
export const selectedCustomer = writable(null);
export const isLoading = writable(false);
export const error = writable(null);

// Derived stores for computed values
export const customersCount = derived(customers, ($customers) => $customers.length);

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

			// Update local store
			customers.update((list) => [...list, newCustomer.data || newCustomer]);

			return newCustomer;
		} catch (err) {
			error.set(err.message);
			console.error('Failed to create customer:', err);
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

			return updatedCustomer;
		} catch (err) {
			error.set(err.message);
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

			return true;
		} catch (err) {
			error.set(err.message);
			console.error('Failed to delete customer:', err);
			throw err;
		} finally {
			isLoading.set(false);
		}
	},

	/**
	 * Clear all stores (useful for logout)
	 */
	clearStore() {
		customers.set([]);
		selectedCustomer.set(null);
		isLoading.set(false);
		error.set(null);
	},

	/**
	 * Search customers by multiple fields
	 * @param {string} searchTerm - Search term
	 */
	searchCustomers(searchTerm) {
		if (!searchTerm.trim()) {
			return derived(customers, ($customers) => $customers);
		}

		return derived(customers, ($customers) =>
			$customers.filter(
				(customer) =>
					// Customer name
					(customer.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
					// Customer ID
					customer.id.toString().includes(searchTerm) ||
					// WhatsApp number
					(customer.whatsapp_number && customer.whatsapp_number.includes(searchTerm)) ||
					// Address
					(customer.address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
					// Sub region name
					(customer.sub_region_name || '').toLowerCase().includes(searchTerm.toLowerCase())
			)
		);
	}
};
