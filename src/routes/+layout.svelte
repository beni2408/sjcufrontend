<svelte:head>
	<link rel="preload" as="image" href="/logo.png" />
</svelte:head>

<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { beforeNavigate, afterNavigate } from '$app/navigation';
	import { themeStore } from '$lib/stores/theme.js';
	import ToastContainer from '$lib/components/ui/ToastContainer.svelte';
	import ChatBot from '$lib/components/ui/ChatBot.svelte';
	import LoadingScreen from '$lib/components/ui/LoadingScreen.svelte';

	let { children } = $props();

	let navigating = $state(false);
	let hideTimer: ReturnType<typeof setTimeout>;
	let safetyTimer: ReturnType<typeof setTimeout>;

	onMount(() => {
		themeStore.init();
	});

	beforeNavigate(({ type, to }) => {
		clearTimeout(hideTimer);
		clearTimeout(safetyTimer);
		navigating = true;
		safetyTimer = setTimeout(() => { navigating = false; }, 8000);
		// Reset scroll immediately so SvelteKit's smooth-scroll animation has nothing to animate
		if (type !== 'popstate' && to && !to.url.hash) {
			window.scrollTo({ top: 0, behavior: 'instant' });
		}
	});

	afterNavigate(() => {
		clearTimeout(safetyTimer);
		window.scrollTo({ top: 0, behavior: 'instant' });
		hideTimer = setTimeout(() => { navigating = false; }, 700);
	});
</script>

{#if navigating}
	<LoadingScreen />
{/if}

{@render children()}
<ToastContainer />
<ChatBot />
