<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth.js';

	onMount(() => {
		if ($authStore.token) {
			goto('/admin/dashboard');
		} else {
			goto('/admin/login');
		}
	});
</script>
