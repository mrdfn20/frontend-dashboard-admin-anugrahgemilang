// src/lib/stores/auth.js
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
				if (decodedToken && !isTokenExpired(decodedToken)) {
					// Simpan user dari decoded token
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
				} else {
					// Token tidak valid atau expired
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

	// Helper function untuk refresh token
	const refreshToken = async () => {
		try {
			const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/refresh-token`, {
				method: 'POST',
				credentials: 'include' // Penting untuk mengirim cookie
			});

			if (response.ok) {
				const data = await response.json();
				const newAccessToken = data.data.newAccessToken;
				const decodedToken = decodeToken(newAccessToken);

				if (decodedToken) {
					const user = {
						id: decodedToken.id,
						username: decodedToken.username,
						role: decodedToken.role
					};

					if (browser) {
						localStorage.setItem('accessToken', newAccessToken);
						localStorage.setItem('user', JSON.stringify(user));
					}

					update((state) => ({
						...state,
						accessToken: newAccessToken,
						user,
						isAuthenticated: true
					}));

					return true;
				}
			}
			return false;
		} catch (error) {
			console.error('Token refresh error:', error);
			return false;
		}
	};

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
					isLoading: false,
					error: null
				}));

				return true;
			} catch (error) {
				console.error('Login error:', error);
				update((state) => ({
					...state,
					error: error.message,
					isLoading: false,
					isAuthenticated: false,
					accessToken: null,
					user: null
				}));
				return false;
			}
		},

		logout: async () => {
			try {
				// Call backend logout untuk hapus refresh token
				await fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
					method: 'POST',
					credentials: 'include' // Penting untuk mengirim cookie refreshToken
				});
			} catch (err) {
				console.error('Logout API error:', err);
			}

			// Clear local storage dan state
			if (browser) {
				localStorage.removeItem('accessToken');
				localStorage.removeItem('user');
			}

			set({
				user: null,
				accessToken: null,
				isAuthenticated: false,
				isLoading: false,
				error: null
			});
		},

		checkAuth: async () => {
			if (!browser) return false;

			const accessToken = localStorage.getItem('accessToken');

			if (!accessToken) {
				// Tidak ada access token, coba refresh
				return await refreshToken();
			}

			const decodedToken = decodeToken(accessToken);

			// Cek apakah token akan expired dalam 5 menit
			if (!decodedToken || isTokenExpired(decodedToken) || isTokenExpiringSoon(decodedToken)) {
				// Token expired atau akan expired, coba refresh
				const refreshed = await refreshToken();
				if (!refreshed) {
					// Refresh gagal, clear state
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
				return true;
			}

			// Token masih valid, update state jika belum
			const user = {
				id: decodedToken.id,
				username: decodedToken.username,
				role: decodedToken.role
			};

			update((state) => ({
				...state,
				accessToken,
				user,
				isAuthenticated: true
			}));

			return true;
		},

		// Expose refresh function untuk digunakan API interceptor
		refreshToken
	};
}

// Helper functions
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

function isTokenExpired(decodedToken) {
	if (!decodedToken || !decodedToken.exp) return true;
	const currentTime = Math.floor(Date.now() / 1000);
	return decodedToken.exp < currentTime;
}

function isTokenExpiringSoon(decodedToken, bufferMinutes = 5) {
	if (!decodedToken || !decodedToken.exp) return true;
	const currentTime = Math.floor(Date.now() / 1000);
	const bufferTime = bufferMinutes * 60; // Convert minutes to seconds
	return decodedToken.exp < currentTime + bufferTime;
}

export const auth = createAuthStore();
