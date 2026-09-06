// src/lib/services/api.js
import { auth } from '$lib/stores/auth';
import { get } from 'svelte/store';

const BASE_URL = import.meta.env.VITE_API_URL;

// Queue untuk menyimpan request yang sedang menunggu token refresh
let isRefreshing = false;
let failedQueue = [];

// Process queue setelah token di-refresh
const processQueue = (error, token = null) => {
	failedQueue.forEach(({ resolve, reject }) => {
		if (error) {
			reject(error);
		} else {
			resolve(token);
		}
	});

	failedQueue = [];
};

// Main API interceptor function
async function apiCall(endpoint, options = {}) {
	const url = `${BASE_URL}${endpoint}`;

	// Prepare default options
	const defaultOptions = {
		headers: {
			'Content-Type': 'application/json',
			...options.headers
		},
		credentials: 'include', // Always include cookies
		...options
	};

	// Add authorization header if we have access token
	const authState = get(auth);
	if (authState.accessToken) {
		defaultOptions.headers['Authorization'] = `Bearer ${authState.accessToken}`;
	}

	try {
		let response = await fetch(url, defaultOptions);

		// Handle 401 Unauthorized (token expired)
		if (response.status === 401 && !options._retry) {
			// Check if we're already refreshing
			if (isRefreshing) {
				// Add this request to queue
				return new Promise((resolve, reject) => {
					failedQueue.push({ resolve, reject });
				}).then(() => {
					// Retry original request with new token
					const newAuthState = get(auth);
					return apiCall(endpoint, {
						...options,
						_retry: true,
						headers: {
							...options.headers,
							Authorization: `Bearer ${newAuthState.accessToken}`
						}
					});
				});
			}

			// Set refreshing flag
			isRefreshing = true;

			try {
				// Attempt to refresh token
				const refreshed = await auth.refreshToken();

				if (refreshed) {
					// Token refreshed successfully
					processQueue(null);

					// Retry original request with new token
					const newAuthState = get(auth);
					return apiCall(endpoint, {
						...options,
						_retry: true,
						headers: {
							...options.headers,
							Authorization: `Bearer ${newAuthState.accessToken}`
						}
					});
				} else {
					// Refresh failed, logout user
					processQueue(new Error('Token refresh failed'));
					await auth.logout();

					// Redirect to login page
					if (typeof window !== 'undefined') {
						window.location.href = '/';
					}

					throw new Error('Authentication failed. Please login again.');
				}
			} catch (error) {
				processQueue(error);
				await auth.logout();
				throw error;
			} finally {
				isRefreshing = false;
			}
		}

		// Handle other HTTP errors
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new APIError(
				errorData.message || `HTTP ${response.status}: ${response.statusText}`,
				response.status,
				errorData
			);
		}

		// Return successful response
		return response;
	} catch (error) {
		// Handle network errors
		if (error instanceof APIError) {
			throw error;
		}

		console.error('API call failed:', error);
		throw new APIError('Network error. Please check your connection.', 0, {
			originalError: error.message
		});
	}
}

// Custom error class for API errors
class APIError extends Error {
	constructor(message, status, data = {}) {
		super(message);
		this.name = 'APIError';
		this.status = status;
		this.data = data;
	}
}

// Backend selalu membungkus response sukses sebagai { success, message, data }.
// Unwrap di sini supaya semua caller cukup terima data-nya langsung.
// Endpoint yang belum pakai envelope (mis. gallon) tetap dikembalikan apa adanya.
function unwrap(payload) {
	return payload && Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : payload;
}

// Convenience methods for different HTTP methods
const api = {
	// GET request
	get: async (endpoint, params = {}) => {
		const searchParams = new URLSearchParams(params);
		const url = searchParams.toString() ? `${endpoint}?${searchParams}` : endpoint;

		const response = await apiCall(url, { method: 'GET' });
		return unwrap(await response.json());
	},

	// GET request server-side paginated - BEDA dari api.get(): TIDAK di-unwrap, karena
	// halaman yang butuh ini (Transaksi/Audit Log/Hutang) perlu baca `meta.pagination`
	// (total, hasNext, dst), bukan cuma `.data`. Return `{ data, meta }` utuh.
	getPaginated: async (endpoint, params = {}) => {
		const searchParams = new URLSearchParams(params);
		const url = searchParams.toString() ? `${endpoint}?${searchParams}` : endpoint;

		const response = await apiCall(url, { method: 'GET' });
		const payload = await response.json();
		return { data: payload?.data ?? [], meta: payload?.meta ?? null };
	},

	// POST request
	post: async (endpoint, data = {}) => {
		const response = await apiCall(endpoint, {
			method: 'POST',
			body: JSON.stringify(data)
		});
		return unwrap(await response.json());
	},

	// PUT request
	put: async (endpoint, data = {}) => {
		const response = await apiCall(endpoint, {
			method: 'PUT',
			body: JSON.stringify(data)
		});
		return unwrap(await response.json());
	},

	// DELETE request (data opsional - beberapa endpoint butuh body di DELETE, mis. /user)
	delete: async (endpoint, data) => {
		const response = await apiCall(endpoint, {
			method: 'DELETE',
			...(data !== undefined && { body: JSON.stringify(data) })
		});
		return unwrap(await response.json());
	},

	// PATCH request
	patch: async (endpoint, data = {}) => {
		const response = await apiCall(endpoint, {
			method: 'PATCH',
			body: JSON.stringify(data)
		});
		return unwrap(await response.json());
	},

	// File upload (multipart/form-data)
	upload: async (endpoint, formData) => {
		const response = await apiCall(endpoint, {
			method: 'POST',
			body: formData,
			headers: {} // Don't set Content-Type, let browser set it for multipart
		});
		return unwrap(await response.json());
	},

	// Dashboard specific endpoints
	dashboard: {
		getSummary: () => api.get('/dashboard/summary'),
		getIncomeSummary: () => api.get('/dashboard/income-summary'),
		getGallonSummary: () => api.get('/dashboard/gallon-summary'),
		getActiveCustomers: () => api.get('/dashboard/active-customers'),
		getDebtStatus: () => api.get('/dashboard/debt-status'),
		getTodayActivity: () => api.get('/dashboard/today-activity')
	},

	// Customer endpoints
	customers: {
		getAll: () => api.get('/customers'),
		getById: (id) => api.get(`/customers/${id}`),
		create: (data) => api.post('/customers', data),
		update: (id, data) => api.put(`/customers/${id}`, data),
		delete: (id) => api.delete(`/customers/${id}`),
		restore: (id) => api.put(`/customers/restore/${id}`),
		getDeleted: () => api.get('/customers/deleted'),
		getActivitySummary: () => api.get('/customers/activity-summary')
	},

	// Region & sub-region (read-only, buat dropdown filter/form)
	regions: {
		getAll: () => api.get('/regions'),
		getSubRegions: () => api.get('/regions/sub-regions')
	},

	// Transaction endpoints
	transactions: {
		getAll: () => api.get('/transactions'),
		getById: (id) => api.get(`/transactions/${id}`),
		getByCustomerId: (customerId) => api.get(`/transactions/customer/${customerId}`),
		getByFilter: (filters) => api.get('/transactions/filter', filters),
		// Versi paginated (page/limit) - dipakai halaman Transaksi. BEDA dari getByFilter:
		// return `{ data, meta }` (bukan cuma array) supaya halaman transaksi tau
		// `meta.pagination.total`/`hasNext` buat infinite scroll server-side.
		getByFilterPaginated: (filters) => api.getPaginated('/transactions/filter', filters),
		getDeleted: () => api.get('/transactions/deleted'),
		create: (data) => api.post('/transactions', data),
		delete: (id) => api.delete(`/transactions/${id}`),
		restore: (id) => api.put(`/transactions/restore/${id}`)
	},

	// Payment endpoints
	payments: {
		getAll: () => api.get('/paymentlogs'),
		getById: (id) => api.get(`/paymentlogs/${id}`),
		getByTransactionId: (transactionId) => api.get(`/paymentlogs/transaction/${transactionId}`),
		getDebts: (filters) => api.get('/paymentlogs/getdebts', filters),
		// Versi paginated (page/limit) - dipakai halaman Hutang Pelanggan.
		getDebtsPaginated: (filters) => api.getPaginated('/paymentlogs/getdebts', filters),
		create: (data) => api.post('/paymentlogs', data),
		payDebt: (data) => api.post('/paymentlogs/paydebt', data)
	},

	// Customer balance endpoints
	customerBalance: {
		getAll: () => api.get('/customerbalance'),
		getById: (customerId) => api.get(`/customerbalance/${customerId}`),
		add: (data) => api.post('/customerbalance', data),
		// data: { customer_id, balance } - balance = jumlah yang DITAMBAHKAN (increment), bukan nilai akhir
		update: (data) => api.put('/customerbalance', data),
		// data: { customer_id, balance } - balance = NILAI AKHIR (menimpa, bukan menambah). Admin only.
		set: (data) => api.put('/customerbalance/set', data)
	},

	// Gallon stock endpoints
	gallon: {
		getStock: () => api.get('/gallon/stock'),
		getStockByCustomer: (customerId) => api.get(`/gallon/stock/${customerId}`),
		getStockFilter: (filters) => api.get('/gallon/stock/filter', filters),
		getPrice: (customerId) => api.get(`/gallon/price/${customerId}`)
	},

	// Gallon movements endpoints
	gallonMovements: {
		getAll: (grouped) => api.get('/gallonmovements', grouped ? { grouped: 'true' } : {}),
		getByCustomer: (customerId) => api.get(`/gallonmovements/${customerId}`)
	},

	// User management endpoints (Admin only)
	users: {
		getAll: () => api.get('/user'),
		register: (data) => api.post('/auth/register', data), // {username, password, role}
		delete: (username) => api.delete('/user', { username })
	},

	// Audit log endpoints (Admin only)
	auditLogs: {
		getAll: () => api.get('/auditlogs'),
		// Versi paginated (search/page/limit) - dipakai halaman Audit Log.
		getLogsPaginated: (filters) => api.getPaginated('/auditlogs', filters)
	},

	// Report endpoints
	reports: {
		getSummary: (startDate, endDate) => api.get('/reports/summary', { startDate, endDate })
	},

	// Armada (fleet) endpoints
	armadas: {
		getAll: () => api.get('/armadas'),
		create: (data) => api.post('/armadas', data), // { armada_name }
		update: (id, data) => api.put(`/armadas/${id}`, data),
		delete: (id) => api.delete(`/armadas/${id}`)
	},

	// Search endpoint
	search: (query) => api.get('/search', { q: query }),

	// Auth endpoints (these don't use interceptor to avoid infinite loops)
	auth: {
		login: async (username, password) => {
			const response = await fetch(`${BASE_URL}/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ username, password })
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new APIError(errorData.message || 'Login failed', response.status, errorData);
			}

			return response.json();
		},

		logout: async () => {
			const response = await fetch(`${BASE_URL}/auth/logout`, {
				method: 'POST',
				credentials: 'include'
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new APIError(errorData.message || 'Logout failed', response.status, errorData);
			}

			return response.json();
		},

		refreshToken: async () => {
			const response = await fetch(`${BASE_URL}/auth/refresh-token`, {
				method: 'POST',
				credentials: 'include'
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new APIError(errorData.message || 'Token refresh failed', response.status, errorData);
			}

			return response.json();
		}
	}
};

export { api, APIError };
