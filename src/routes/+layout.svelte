<script>
	import '../app.css';
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth';
	import { Toaster } from 'svelte-french-toast';

	// Auto check auth on mount, but don't redirect
	onMount(async () => {
		await auth.checkAuth();
	});
</script>

<slot />

<!-- Toast Container with Maroon Theme -->
<Toaster
	position="top-right"
	toastOptions={{
		duration: 3000,
		style:
			'background: white; color: #374151; border-radius: 8px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);',
		success: {
			iconTheme: { primary: '#10B981', secondary: 'white' },
			style: 'border-left: 4px solid #10B981;'
		},
		error: {
			duration: 0, // Manual close for errors
			iconTheme: { primary: '#EF4444', secondary: 'white' },
			style: 'border-left: 4px solid #EF4444;'
		}
	}}
/>
