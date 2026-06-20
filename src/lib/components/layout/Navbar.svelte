<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Menu, X, Sun, Moon } from 'lucide-svelte';
	import { isMenuOpen } from '$lib/stores/ui.js';
	import { themeStore } from '$lib/stores/theme.js';

	let scrolled = $state(false);
	let menuOpen = $state(false);

	const navLinks = [
		{ href: '#about', label: 'About' },
		{ href: '#productions', label: 'Productions' },
		{ href: '#upcoming-projects', label: 'Upcoming' },
		{ href: '#auditions', label: 'Auditions' },
		{ href: '#memorable', label: 'Memorable' },
		{ href: '#members', label: 'Our Team' },
		{ href: '#partners', label: 'Partners' },
		{ href: '#events', label: 'Events' },
		{ href: '#gallery', label: 'Gallery' },
		{ href: '#testimonials', label: 'Testimonials' },
	];

	onMount(() => {
		const handleScroll = () => { scrolled = window.scrollY > 50; };
		window.addEventListener('scroll', handleScroll, { passive: true });
		return () => window.removeEventListener('scroll', handleScroll);
	});

	function scrollTo(e: Event, href: string) {
		e.preventDefault();
		menuOpen = false;
		const el = document.querySelector(href);
		if (el) {
			el.scrollIntoView({ behavior: 'smooth' });
		} else {
			goto(`/${href}`);
		}
	}
</script>

<nav
	class="fixed top-0 left-0 right-0 z-50 transition-all duration-500 {scrolled
		? 'bg-sjcu-navy/90 backdrop-blur-xl border-b border-sjcu-border/30 py-3'
		: 'bg-transparent py-5'}"
>
	<div class="max-w-7xl mx-auto px-6 flex items-center justify-between">
		<a href="/" class="flex items-center gap-3 group">
			<!-- Logo with glow ring -->
			<div class="relative flex-shrink-0">
				<div class="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center transition-all duration-300"
					style="border: 2px solid rgba(139,92,246,0.55); box-shadow: 0 0 16px rgba(124,58,237,0.4), inset 0 0 8px rgba(124,58,237,0.08); background: rgba(255,255,255,0.05);">
					<img src="/logo.png" alt="SJCU Logo" class="w-10 h-10 object-contain" />
				</div>
				<span class="absolute inset-0 rounded-full border border-sjcu-purple/35 opacity-0 group-hover:opacity-100 animate-ping" style="animation-duration:2s;"></span>
			</div>

			<!-- Text -->
			<div class="flex flex-col leading-none">
				<span class="font-display font-extrabold text-sjcu-text-primary text-base tracking-tight">St. John's</span>
				<span class="font-display font-bold text-xs tracking-[0.2em] uppercase" style="background: linear-gradient(90deg,#a78bfa,#7c3aed); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;">Carol Union</span>
			</div>
		</a>

		<div class="hidden lg:flex items-center gap-1">
			{#each navLinks as link}
				<a
					href={link.href}
					onclick={(e) => scrollTo(e, link.href)}
					class="nav-link px-2.5 py-2 text-xs text-sjcu-text-secondary hover:text-sjcu-text-primary rounded-lg hover:bg-sjcu-purple/10 transition-all duration-200 whitespace-nowrap"
				>
					{link.label}
				</a>
			{/each}
		</div>

		<div class="hidden lg:flex items-center gap-3">
			<!-- Theme toggle switch -->
			<button
				onclick={() => themeStore.toggle()}
				class="theme-switch"
				class:is-light={$themeStore === 'light'}
				aria-label="Toggle theme"
			>
				<span class="theme-switch-track">
					<span class="theme-switch-thumb">
						{#if $themeStore === 'dark'}
							<Moon class="w-3 h-3" />
						{:else}
							<Sun class="w-3 h-3" />
						{/if}
					</span>
				</span>
			</button>
			<a href="/production-enquiry" class="btn-primary btn-glow-hover text-sm">
				Contact Us
			</a>
		</div>

		<div class="lg:hidden flex items-center gap-2">
			<!-- Theme toggle switch (mobile) -->
			<button
				onclick={() => themeStore.toggle()}
				class="theme-switch theme-switch-sm"
				class:is-light={$themeStore === 'light'}
				aria-label="Toggle theme"
			>
				<span class="theme-switch-track">
					<span class="theme-switch-thumb">
						{#if $themeStore === 'dark'}
							<Moon class="w-2.5 h-2.5" />
						{:else}
							<Sun class="w-2.5 h-2.5" />
						{/if}
					</span>
				</span>
			</button>
			<button
				onclick={() => (menuOpen = !menuOpen)}
				class="p-2 rounded-lg hover:bg-sjcu-purple/10 text-sjcu-text-secondary hover:text-sjcu-text-primary transition-colors"
				aria-label="Toggle menu"
			>
				{#if menuOpen}
					<X class="w-5 h-5" />
				{:else}
					<Menu class="w-5 h-5" />
				{/if}
			</button>
		</div>
	</div>

	{#if menuOpen}
		<div class="lg:hidden absolute top-full left-0 right-0 bg-sjcu-navy/95 backdrop-blur-xl border-b border-sjcu-border/30 px-6 py-4 flex flex-col gap-1">
			{#each navLinks as link}
				<a
					href={link.href}
					onclick={(e) => scrollTo(e, link.href)}
					class="px-4 py-3 text-sjcu-text-secondary hover:text-sjcu-text-primary rounded-xl hover:bg-sjcu-purple/10 transition-all duration-200 text-sm"
				>
					{link.label}
				</a>
			{/each}
			<a href="/production-enquiry" class="btn-primary text-sm mt-3 justify-center">
				Contact Us
			</a>
		</div>
	{/if}
</nav>

<style>
	/* ── Theme toggle switch ─────────────────────────────────────────────── */
	.theme-switch {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		display: flex;
		align-items: center;
		outline: none;
	}

	.theme-switch-track {
		position: relative;
		width: 50px;
		height: 26px;
		border-radius: 13px;
		background: rgba(20, 16, 50, 0.95);
		border: 1.5px solid rgba(124, 58, 237, 0.55);
		display: flex;
		align-items: center;
		padding: 2px;
		transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
		box-shadow: 0 0 12px rgba(124, 58, 237, 0.2), inset 0 0 8px rgba(124, 58, 237, 0.05);
	}

	.theme-switch.is-light .theme-switch-track {
		background: rgba(237, 228, 253, 0.95);
		border-color: rgba(124, 58, 237, 0.3);
		box-shadow: 0 0 10px rgba(124, 58, 237, 0.1);
	}

	.theme-switch-thumb {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: linear-gradient(135deg, #7c3aed, #a855f7);
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
		box-shadow: 0 2px 8px rgba(124, 58, 237, 0.55);
		flex-shrink: 0;
		transform: translateX(0);
	}

	.theme-switch.is-light .theme-switch-thumb {
		transform: translateX(24px);
	}

	/* Smaller variant for mobile */
	.theme-switch-sm .theme-switch-track {
		width: 42px;
		height: 22px;
	}
	.theme-switch-sm .theme-switch-thumb {
		width: 16px;
		height: 16px;
	}
	.theme-switch-sm.is-light .theme-switch-thumb {
		transform: translateX(20px);
	}
</style>
