<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.js';
	import AdminSidebar from '$lib/components/admin/AdminSidebar.svelte';
	import AdminTopbar from '$lib/components/admin/AdminTopbar.svelte';

	let { children } = $props();
	let isLoginPage  = $derived($page.url.pathname === '/admin/login');
	let isPublicPage = $derived($page.url.pathname.startsWith('/admin/accept-invite'));
	let sidebarOpen      = $state(false);
	let sidebarCollapsed = $state(false);

	onMount(() => {
		if (!isLoginPage && !isPublicPage && !$authStore.token) {
			goto('/admin/login');
		}
	});

	function closeSidebar()       { sidebarOpen = false; }
	function toggleCollapse()     { sidebarCollapsed = !sidebarCollapsed; }
</script>

{#if isLoginPage || isPublicPage}
	{@render children()}
{:else}
	<div class="flex h-screen bg-sjcu-dark overflow-hidden">
		<!-- Mobile backdrop overlay -->
		{#if sidebarOpen}
			<div
				class="fixed inset-0 z-20 bg-black/60 lg:hidden"
				role="button"
				tabindex="-1"
				aria-label="Close menu"
				onclick={closeSidebar}
				onkeydown={(e) => e.key === 'Escape' && closeSidebar()}
			></div>
		{/if}

		<AdminSidebar {sidebarOpen} collapsed={sidebarCollapsed} onClose={closeSidebar} onToggleCollapse={toggleCollapse} />

		<div class="flex-1 flex flex-col overflow-hidden min-w-0">
			<AdminTopbar onMenuToggle={() => (sidebarOpen = !sidebarOpen)} />
			<main class="flex-1 overflow-y-auto p-4 sm:p-6 bg-sjcu-dark">
				{@render children()}
			</main>
		</div>
	</div>
{/if}
