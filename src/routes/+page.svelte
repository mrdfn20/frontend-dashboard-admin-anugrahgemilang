<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth';

	// State untuk form inputs
	let username = '';
	let password = '';
	let showPassword = false;
	let isLoading = false;
	let errorMessage = '';
	let rememberMe = false;

	// Cek jika sudah login
	onMount(() => {
		if ($auth.isAuthenticated) {
			goto('/dashboard');
		}
		// Focus username input saat halaman dimuat
		document.getElementById('username')?.focus();
	});

	function togglePasswordVisibility() {
		showPassword = !showPassword;
	}

	// Handle form submission
	async function handleLogin(event) {
		event.preventDefault();
		errorMessage = '';

		// Basic validation
		if (!username.trim() || !password.trim()) {
			errorMessage = 'Username dan password tidak boleh kosong';
			return;
		}

		try {
			isLoading = true;
			const success = await auth.login(username, password);

			if (success) {
				goto('/dashboard');
			} else {
				throw new Error('Login gagal Username atau password salah');
			}
		} catch (error) {
			errorMessage = error.message || 'Terjadi kesalahan, silakan coba lagi';
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="flex min-h-screen">
	<!-- Left Side - Image -->
	<div
		class="bg-maroon-600 relative hidden items-center justify-center overflow-hidden text-white md:flex md:w-1/2"
	>
		<!-- Gambar Custom -->
		<img
			src="img-login-page.png"
			alt="Login img"
			class="absolute inset-0 h-full w-full object-cover"
		/>
		<!-- Optional overlay gradient untuk memastikan teks tetap terbaca -->
		<div class="from-maroon-700 absolute inset-0 bg-gradient-to-tr opacity-60"></div>

		<!-- Teks di atas gambar -->
		<div class="relative z-10 p-8 text-center">
			<h2 class="mb-6 text-4xl font-bold">Let's Get Started!</h2>
			<p class="text-xl opacity-90">Keep it Up! Do Your Best!</p>
		</div>
	</div>

	<!-- Right Side - Login Form -->
	<div class="flex w-full items-center justify-center p-8 md:w-1/2">
		<div class="w-full max-w-md">
			<div class="mb-10 text-center">
				<h1 class="mb-2 text-3xl font-bold text-gray-900">CV. Anugrah Gemilang</h1>
				<p class="text-gray-600">Internal System</p>
			</div>

			<div class="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
				{#if errorMessage}
					<div class="mb-6 border-l-4 border-red-600 bg-red-50 p-4">
						<div class="flex">
							<div>
								<p class="text-sm text-red-700">{errorMessage}</p>
							</div>
						</div>
					</div>
				{/if}

				<form class="space-y-6" on:submit={handleLogin}>
					<!-- Username field -->
					<div>
						<label for="username" class="mb-1 block text-sm font-medium text-gray-700">
							Username
						</label>
						<input
							id="username"
							name="username"
							type="text"
							autocomplete="username"
							bind:value={username}
							placeholder="Enter your username"
							required
							class="focus:ring-maroon-500 focus:border-maroon-500 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none"
						/>
					</div>

					<!-- Password field -->
					<!-- Ubah input password dari kode yang sudah ada menjadi seperti ini -->
					<div>
						<label for="password" class="mb-1 block text-sm font-medium text-gray-700">
							Password
						</label>
						<div class="relative">
							<input
								id="password"
								name="password"
								type={showPassword ? 'text' : 'password'}
								autocomplete="current-password"
								bind:value={password}
								placeholder="Enter your password"
								required
								class="focus:ring-maroon-500 focus:border-maroon-500 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none"
							/>
							<button
								type="button"
								class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
								on:click={togglePasswordVisibility}
							>
								{#if showPassword}
									<!-- Eye Slash Icon (Password Hidden) -->
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-5 w-5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
										/>
									</svg>
								{:else}
									<!-- Eye Icon (Password Visible) -->
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-5 w-5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
										/>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
										/>
									</svg>
								{/if}
							</button>
						</div>
					</div>

					<!-- Remember me checkbox -->
					<div class="flex items-center">
						<input
							id="remember-me"
							name="remember-me"
							type="checkbox"
							bind:checked={rememberMe}
							class="text-maroon-600 focus:ring-maroon-500 h-4 w-4 rounded border-gray-300"
						/>
						<label for="remember-me" class="ml-2 block text-sm text-gray-700"> Remember Me! </label>
					</div>

					<!-- Submit button -->
					<div>
						<button
							type="submit"
							disabled={isLoading}
							class="bg-maroon-600 hover:bg-maroon-700 focus:ring-maroon-500 flex w-full justify-center rounded-md border border-transparent px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
						>
							{#if isLoading}
								<svg
									class="mr-3 -ml-1 h-5 w-5 animate-spin text-white"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									></circle>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
								Loading...
							{:else}
								Login
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
</div>

<style>
	/* Ini hanya diperlukan jika Anda ingin memastikan warna maroon tersedia */
	:global(.bg-maroon-600) {
		background-color: #800020;
	}
	:global(.hover\:bg-maroon-700:hover) {
		background-color: #600018;
	}
	:global(.text-maroon-600) {
		color: #800020;
	}
	:global(.focus\:ring-maroon-500:focus) {
		--tw-ring-color: rgba(128, 0, 32, 0.5);
	}
	:global(.focus\:border-maroon-500:focus) {
		border-color: #800020;
	}
</style>
