const BASE_URL = import.meta.env.VITE_API_URL;

async function fetchWithAuth(endpoint, options = {}) {
	const token = localStorage.getItem('token');

	const headers = {
		'Content-Type': 'application/json',
		...options.headers
	};

	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
	}

	const response = await fetch(`${BASE_URL}${endpoint}`, {
		...options,
		headers
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.message || 'Something went wrong');
	}

	return data;
}

export const api = {
	// Dashboard endpoints
	getDashboardSummary: () => fetchWithAuth('/dashboard/summary'),
	getIncomeSummary: () => fetchWithAuth('/dashboard/income-summary'),
	getGallonSummary: () => fetchWithAuth('/dashboard/gallon-summary'),
	getActiveCustomers: () => fetchWithAuth('/dashboard/active-customers'),
	getDebtStatus: () => fetchWithAuth('/dashboard/debt-status'),
	getTodayActivity: () => fetchWithAuth('/dashboard/today-activity'),

	// Auth endpoints
	login: (username, password) =>
		fetch(`${BASE_URL}/auth/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username, password })
		}).then((res) => res.json())

	// Add more API calls as needed
};
