<script>
	import { onMount } from 'svelte';
	import { customerActions, customers, isLoading, error } from '$lib/stores/customers.js';

	onMount(async () => {
		try {
			await customerActions.loadCustomers();
			console.log('✅ Service berhasil!', $customers);
		} catch (err) {
			console.error('❌ Service gagal:', err);
		}
	});
</script>

<h1>Test Service</h1>
<p>Loading: {$isLoading}</p>
<p>Error: {$error}</p>
<p>Data count: {$customers.length}</p>
