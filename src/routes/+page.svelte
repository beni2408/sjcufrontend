<script lang="ts">
	import { onMount } from 'svelte';
	import Navbar from '$lib/components/layout/Navbar.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import Hero from '$lib/components/sections/Hero.svelte';
	import About from '$lib/components/sections/About.svelte';
	import Productions from '$lib/components/sections/Productions.svelte';
	import UpcomingProjects from '$lib/components/sections/UpcomingProjects.svelte';
	import Auditions from '$lib/components/sections/Auditions.svelte';
	import Members from '$lib/components/sections/Members.svelte';
	import Partners from '$lib/components/sections/Partners.svelte';
	import MemorableEvents from '$lib/components/sections/MemorableEvents.svelte';
	import Events from '$lib/components/sections/Events.svelte';
	import Gallery from '$lib/components/sections/Gallery.svelte';
	import Testimonials from '$lib/components/sections/Testimonials.svelte';
	import EnquiryCTA from '$lib/components/sections/EnquiryCTA.svelte';
	import LoadingScreen from '$lib/components/ui/LoadingScreen.svelte';
	import CursorSpotlight from '$lib/components/ui/CursorSpotlight.svelte';
	import { settingsApi } from '$lib/services/api.js';
	import type { Settings } from '$lib/types/index.js';

	let settings       = $state<Settings | undefined>(undefined);
	let ready          = $state(false);
	let scrollProgress = $state(0);

	onMount(() => {
		// Scroll progress tracker
		function updateScroll() {
			const el = document.documentElement;
			const scrollable = el.scrollHeight - el.clientHeight;
			scrollProgress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
		}
		window.addEventListener('scroll', updateScroll, { passive: true });

		// Async initialisation (settings + lenis) — fire-and-forget
		(async () => {
			try {
				const res = await settingsApi.get();
				settings = res.data.data.settings;
			} catch {
				settings = undefined;
			}

			const Lenis = (await import('lenis')).default;
			const lenis = new Lenis({ lerp: 0.08, smoothWheel: true });

			function raf(time: number) {
				lenis.raf(time);
				requestAnimationFrame(raf);
			}
			requestAnimationFrame(raf);
		})();

		setTimeout(() => { ready = true; }, 600);

		return () => window.removeEventListener('scroll', updateScroll);
	});
</script>

<svelte:head>
	<title>St. John's Carol Union — Sing Unto the Lord a New Song</title>
	<meta name="description" content="St. John's Carol Union — Sing Unto the Lord a New Song. A Christian choir and music ministry from Madathuvilai, Arumuganeri, Tuticorin District, glorifying Christ through song, worship, and musical excellence." />
	<meta property="og:title" content="St. John's Carol Union — Sing Unto the Lord a New Song" />
	<meta property="og:description" content="A Christian choir and music ministry from Madathuvilai, Arumuganeri, Tuticorin District — glorifying Christ through song, worship, and musical excellence." />
	<meta property="og:type" content="website" />
	<meta property="og:image" content="/logo.png" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="St. John's Carol Union — Sing Unto the Lord a New Song" />
	<meta name="twitter:description" content="A Christian choir and music ministry from Madathuvilai, Arumuganeri, Tuticorin District — glorifying Christ through song, worship, and musical excellence." />
	<meta name="keywords" content="St. John's Carol Union, SJCU, Christian choir, worship music, Christ, carol, music ministry, gospel choir, Madathuvilai, Arumuganeri, Tuticorin" />
	<meta name="geo.region" content="IN-TN" />
	<meta name="geo.placename" content="Madathuvilai, Arumuganeri, Tuticorin District, Tamil Nadu, India" />
</svelte:head>

{#if !ready}
	<LoadingScreen />
{/if}

<CursorSpotlight />

<!-- Scroll progress bar -->
<div class="scroll-progress-bar" style="width: {scrollProgress}%"></div>

<div class="min-h-screen bg-sjcu-dark" class:opacity-0={!ready} style="transition: opacity 0.5s ease;">
	<Navbar />
	<main>
		<Hero />
		<About />
		<Productions />
		<UpcomingProjects />
		<Auditions />
		<MemorableEvents />
		<Members />
		<Partners />
		<Events />
		<Gallery />
		<Testimonials />
		<EnquiryCTA />
	</main>
	<Footer {settings} />
</div>
