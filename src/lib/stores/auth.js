import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createAuthStore() {
	const { subscribe, set, update } = writable({
		user: null,
		accessToken: null,
		isAuthenticated: false,
		isLoading: false,
		error: null
	});

	// Inisialisasi store dari localStorage jika ada
	if (browser) {
		try {
			const accessToken = localStorage.getItem('accessToken');

			if (accessToken) {
				// Decode token untuk mendapatkan user info
				const decodedToken = decodeToken(accessToken);

				// Jika token valid dan bisa di-decode
				if (decodedToken) {
					// Simpan user dari decoded token
					localStorage.setItem(
						'user',
						JSON.stringify({
							id: decodedToken.id,
							username: decodedToken.username,
							role: decodedToken.role
						})
					);

					update((state) => ({
						...state,
						accessToken,
						user: decodedToken,
						isAuthenticated: true
					}));
				} else {
					// Token tidak valid atau tidak bisa di-decode
					localStorage.removeItem('accessToken');
					localStorage.removeItem('user');
				}
			}
		} catch (error) {
			console.error('Error initializing auth store:', error);
			// Hapus data yang mungkin rusak
			localStorage.removeItem('accessToken');
			localStorage.removeItem('user');
		}
	}

	return {
		subscribe,
		login: async (username, password) => {
			update((state) => ({ ...state, isLoading: true, error: null }));

			try {
				const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include', // Penting untuk menerima cookie
					body: JSON.stringify({ username, password })
				});

				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.message || 'Login gagal');
				}

				// Pastikan data yang diterima valid
				if (!data.data?.accessToken) {
					throw new Error('Token tidak ditemukan dalam respons');
				}

				const accessToken = data.data.accessToken;

				// Decode token untuk mendapatkan user info
				const decodedToken = decodeToken(accessToken);

				if (!decodedToken) {
					throw new Error('Token tidak valid');
				}

				// Simpan user dari decoded token
				const user = {
					id: decodedToken.id,
					username: decodedToken.username,
					role: decodedToken.role
				};

				if (browser) {
					localStorage.setItem('accessToken', accessToken);
					localStorage.setItem('user', JSON.stringify(user));
				}

				update((state) => ({
					...state,
					accessToken,
					user,
					isAuthenticated: true,
					isLoading: false
				}));

				return true;
			} catch (error) {
				console.error('Login error:', error);
				update((state) => ({
					...state,
					error: error.message,
					isLoading: false
				}));
				return false;
			}
		},
		logout: () => {
			if (browser) {
				localStorage.removeItem('accessToken');
				localStorage.removeItem('user');

				// Tambahkan API call untuk logout di server (hapus refreshToken)
				fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
					method: 'POST',
					credentials: 'include' // Penting untuk mengirim cookie refreshToken
				}).catch((err) => console.error('Logout error:', err));
			}

			set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false, error: null });
		},
		checkAuth: async () => {
			if (!browser) return false;

			const accessToken = localStorage.getItem('accessToken');

			if (!accessToken) return false;

			try {
				// Verifikasi token dengan backend
				const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/verify`, {
					method: 'GET',
					headers: {
						Authorization: `Bearer ${accessToken}`
					},
					credentials: 'include'
				});

				if (!response.ok) {
					// Token tidak valid, hapus dari localStorage
					localStorage.removeItem('accessToken');
					localStorage.removeItem('user');
					set({
						user: null,
						accessToken: null,
						isAuthenticated: false,
						isLoading: false,
						error: null
					});
					return false;
				}

				// Decode token untuk mendapatkan user yang terupdate
				const decodedToken = decodeToken(accessToken);

				if (!decodedToken) {
					localStorage.removeItem('accessToken');
					localStorage.removeItem('user');
					set({
						user: null,
						accessToken: null,
						isAuthenticated: false,
						isLoading: false,
						error: null
					});
					return false;
				}

				// Update user dari decoded token
				const user = {
					id: decodedToken.id,
					username: decodedToken.username,
					role: decodedToken.role
				};

				localStorage.setItem('user', JSON.stringify(user));

				update((state) => ({
					...state,
					accessToken,
					user,
					isAuthenticated: true
				}));

				return true;
			} catch (error) {
				console.error('Auth check error:', error);
				localStorage.removeItem('accessToken');
				localStorage.removeItem('user');
				set({
					user: null,
					accessToken: null,
					isAuthenticated: false,
					isLoading: false,
					error: null
				});
				return false;
			}
		}
	};
}

function decodeToken(token) {
	try {
		// Split token menjadi 3 bagian (header, payload, signature)
		const base64Url = token.split('.')[1];
		// Decode base64 dari payload
		const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
		// Parse JSON dari payload yang sudah di-decode
		return JSON.parse(window.atob(base64));
	} catch (error) {
		console.error('Error decoding token:', error);
		return null;
	}
}

export const auth = createAuthStore();
