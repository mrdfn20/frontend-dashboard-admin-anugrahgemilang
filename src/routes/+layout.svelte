<script>
	import '../app.css';
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth';

	// Auto check auth on mount, but don't redirect
	onMount(async () => {
		await auth.checkAuth();
	});
</script>

<slot />
