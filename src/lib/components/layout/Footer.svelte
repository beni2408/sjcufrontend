<script lang="ts">
	import { Instagram, Facebook, Youtube, Twitter, Mail, Phone, MapPin } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import type { Settings } from '$lib/types/index.js';

	let { settings } = $props<{ settings?: Settings }>();

	const socialIcons = { instagram: Instagram, facebook: Facebook, youtube: Youtube, twitter: Twitter };

	const navLinks = [
		{ href: '#about', label: 'About Us' },
		{ href: '#productions', label: 'Productions' },
		{ href: '#upcoming-projects', label: 'Upcoming Projects' },
		{ href: '#auditions', label: 'Auditions' },
		{ href: '#memorable', label: 'Memorable Events' },
		{ href: '#members', label: 'Our Team' },
		{ href: '#partners', label: 'Partners' },
		{ href: '#events', label: 'Events' },
		{ href: '#gallery', label: 'Gallery' },
		{ href: '#testimonials', label: 'Testimonials' },
		{ href: '/production-enquiry', label: 'Contact Us' },
		{ href: '/terms-and-conditions', label: 'Terms & Conditions' },
	];

	function scrollTo(e: Event, href: string) {
		if (!href.startsWith('#')) return;
		e.preventDefault();
		const el = document.querySelector(href);
		if (el) {
			el.scrollIntoView({ behavior: 'smooth' });
		} else {
			goto(`/${href}`);
		}
	}
</script>

<footer class="bg-sjcu-navy border-t border-sjcu-border/30 pt-16 pb-8">
	<div class="max-w-7xl mx-auto px-6">
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
			<div class="lg:col-span-2">
				<a href="/" class="flex items-center gap-3 mb-5 group">
					<!-- Logo with glow ring -->
					<div class="relative flex-shrink-0">
						<div class="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center transition-all duration-300"
							style="border: 2px solid rgba(139,92,246,0.55); box-shadow: 0 0 20px rgba(124,58,237,0.4), inset 0 0 10px rgba(124,58,237,0.08); background: rgba(255,255,255,0.05);">
							<img src="/logo.png" alt="SJCU Logo" class="w-12 h-12 object-contain" />
						</div>
						<span class="absolute inset-0 rounded-full border border-sjcu-purple/35 opacity-0 group-hover:opacity-100 animate-ping" style="animation-duration:2.5s;"></span>
					</div>
					<div class="flex flex-col leading-none">
						<span class="font-display font-extrabold text-white text-base tracking-tight">St. John's</span>
						<span class="font-display font-bold text-sm tracking-[0.18em] uppercase" style="background: linear-gradient(90deg,#a78bfa,#7c3aed); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;">Carol Union</span>
						<span class="text-[10px] tracking-widest uppercase text-sjcu-text-muted mt-1 font-medium">Music & Productions</span>
					</div>
				</a>
				<p class="text-sjcu-text-secondary text-sm leading-relaxed max-w-xs mb-6">
					Harmonies that transcend time. We are a dedicated choir and music production group bringing divine music to life through exceptional performances.
				</p>
				<div class="flex items-center gap-3">
					{#each Object.entries(socialIcons) as [platform, Icon]}
						{#if settings?.socialLinks?.[platform as keyof typeof settings.socialLinks]}
							<a
								href={settings.socialLinks[platform as keyof typeof settings.socialLinks]}
								target="_blank"
								rel="noopener noreferrer"
								class="w-9 h-9 rounded-lg bg-sjcu-card border border-sjcu-border flex items-center justify-center text-sjcu-text-muted hover:text-sjcu-accent hover:border-sjcu-purple/40 transition-all duration-300"
								aria-label={platform}
							>
								<Icon class="w-4 h-4" />
							</a>
						{/if}
					{/each}
					{#if !settings?.socialLinks}
						{#each Object.entries(socialIcons) as [platform, Icon]}
							<a
								href="/"
								class="w-9 h-9 rounded-lg bg-sjcu-card border border-sjcu-border flex items-center justify-center text-sjcu-text-muted hover:text-sjcu-accent hover:border-sjcu-purple/40 transition-all duration-300"
								aria-label={platform}
							>
								<Icon class="w-4 h-4" />
							</a>
						{/each}
					{/if}
				</div>
			</div>

			<div>
				<h4 class="text-sjcu-text-primary font-semibold mb-5 text-sm tracking-wide uppercase">Quick Links</h4>
				<ul class="space-y-3">
					{#each navLinks as link}
						<li>
							<a
								href={link.href}
								onclick={(e) => scrollTo(e, link.href)}
								class="text-sjcu-text-secondary hover:text-sjcu-accent text-sm transition-colors duration-200"
							>
								{link.label}
							</a>
						</li>
					{/each}
				</ul>
			</div>

			<div>
				<h4 class="text-sjcu-text-primary font-semibold mb-5 text-sm tracking-wide uppercase">Contact</h4>
				<ul class="space-y-4">
					{#if settings?.email || true}
						<li class="flex items-start gap-3">
							<Mail class="w-4 h-4 text-sjcu-accent flex-shrink-0 mt-0.5" />
							<span class="text-sjcu-text-secondary text-sm">{settings?.email || 'info@stjohncarolunion.com'}</span>
						</li>
					{/if}
					{#if settings?.phone || true}
						<li class="flex items-start gap-3">
							<Phone class="w-4 h-4 text-sjcu-accent flex-shrink-0 mt-0.5" />
							<span class="text-sjcu-text-secondary text-sm">{settings?.phone || '+91 9876543210'}</span>
						</li>
					{/if}
					{#if settings?.address || true}
						<li class="flex items-start gap-3">
							<MapPin class="w-4 h-4 text-sjcu-accent flex-shrink-0 mt-0.5" />
							<span class="text-sjcu-text-secondary text-sm">{settings?.address || 'Madathuvilai, Arumuganeri, Tamil Nadu, India'}</span>
						</li>
					{/if}
				</ul>
			</div>
		</div>

		<div class="border-t border-sjcu-border/30 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
			<p class="text-sjcu-text-muted text-sm">
				{settings?.footerText || "© 2024 St. John's Carol Union. All rights reserved."}
			</p>
			<div class="flex items-center gap-1 text-sjcu-text-muted text-sm">
				<span>Crafted with</span>
				<span class="text-sjcu-purple">♪</span>
				<span>for the love of music</span>
			</div>
		</div>
	</div>
</footer>
