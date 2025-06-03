// src/lib/services/customers.js

/**
 * Customer API Service
 * Handles all API calls related to customers
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Helper function untuk handle API calls dengan authentication
 * @param {string} endpoint - API endpoint
 * @param {object} options - Fetch options
 * @returns {Promise} API response
 */
async function apiCall(endpoint, options = {}) {
	// Get token from localStorage
	const token = localStorage.getItem('accessToken');

	const config = {
		headers: {
			'Content-Type': 'application/json',
			...options.headers
		},
		...options
	};

	// Add authorization header if token exists
	if (token) {
		config.headers['Authorization'] = `Bearer ${token}`;
	}

	try {
		const response = await fetch(`${BASE_URL}${endpoint}`, config);

		// Handle HTTP errors
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.message || `HTTP Error: ${response.status}`);
		}

		return await response.json();
	} catch (error) {
		console.error('API Call Error:', error);
		throw error;
	}
}

/**
 * Customer Service Object
 * Contains all customer-related API methods
 */
export const customerService = {
	/**
	 * Get all customers
	 * @returns {Promise<Array>} List of customers
	 */
	async getAllCustomers() {
		return await apiCall('/customers');
	},

	/**
	 * Get customer by ID
	 * @param {number} id - Customer ID
	 * @returns {Promise<Object>} Customer data
	 */
	async getCustomerById(id) {
		return await apiCall(`/customers/${id}`);
	},

	/**
	 * Create new customer
	 * @param {Object} customerData - Customer data
	 * @returns {Promise<Object>} Created customer
	 */
	async createCustomer(customerData) {
		console.log('Data being sent to API:', customerData);

		return await apiCall('/customers', {
			method: 'POST',
			body: JSON.stringify(customerData)
		});
	},

	/**
	 * Update existing customer
	 * @param {number} id - Customer ID
	 * @param {Object} customerData - Updated customer data
	 * @returns {Promise<Object>} Updated customer
	 */
	async updateCustomer(id, customerData) {
		return await apiCall(`/customers/${id}`, {
			method: 'PUT',
			body: JSON.stringify(customerData)
		});
	},

	/**
	 * Delete customer
	 * @param {number} id - Customer ID
	 * @returns {Promise<Object>} Delete confirmation
	 */
	async deleteCustomer(id) {
		return await apiCall(`/customers/${id}`, {
			method: 'DELETE'
		});
	}
};

export default customerService;
