<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Instagram, Facebook, Youtube, Twitter, ArrowLeft, Users } from 'lucide-svelte';

	onMount(() => { window.scrollTo({ top: 0, behavior: 'instant' }); });
	import type { Member } from '$lib/types/index.js';
	import Navbar from '$lib/components/layout/Navbar.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';

	let { data } = $props();
	const member: Member = data.member;
	const slug = member.slug ?? '';

	// SEO — fallback to auto-generated if fields empty
	const siteName  = "St. John's Carol Union";
	const metaTitle = member.seo?.metaTitle?.trim()       || `${member.name} — ${member.position} | ${siteName}`;
	const metaDesc  = member.seo?.metaDescription?.trim() || `${member.name} serves as ${member.position} at ${siteName}.${member.description ? ' ' + member.description : ''}`;
	const ogTitle   = member.seo?.ogTitle?.trim()         || metaTitle;
	const ogDesc    = member.seo?.ogDescription?.trim()   || metaDesc;
	const ogImage   = member.seo?.ogImage?.trim()         || member.photo || '';
	const keywords  = [
		...(member.seo?.primaryKeywords   ?? []),
		...(member.seo?.secondaryKeywords ?? []),
	].join(', ');

	const socials = [
		{ key: 'instagram', Icon: Instagram, label: 'Instagram', color: '#e1306c' },
		{ key: 'facebook',  Icon: Facebook,  label: 'Facebook',  color: '#1877f2' },
		{ key: 'youtube',   Icon: Youtube,   label: 'YouTube',   color: '#ff0000' },
		{ key: 'twitter',   Icon: Twitter,   label: 'Twitter/X', color: '#1da1f2' },
	];
</script>

<svelte:head>
	<title>{metaTitle}</title>
		<meta name="description" content={metaDesc} />
		{#if keywords}<meta name="keywords" content={keywords} />{/if}
		<meta name="robots" content="index, follow" />

		<!-- Open Graph -->
		<meta property="og:type"        content="profile" />
		<meta property="og:title"       content={ogTitle} />
		<meta property="og:description" content={ogDesc} />
		{#if ogImage}<meta property="og:image" content={ogImage} />{/if}
		<meta property="og:url"         content={`https://sjcarolunion.com/team/${slug}`} />
		<meta property="og:site_name"   content={siteName} />

		<!-- Twitter Card -->
		<meta name="twitter:card"        content="summary_large_image" />
		<meta name="twitter:title"       content={ogTitle} />
		<meta name="twitter:description" content={ogDesc} />
		{#if ogImage}<meta name="twitter:image" content={ogImage} />{/if}

		<!-- Canonical -->
		<link rel="canonical" href={`https://sjcarolunion.com/team/${slug}`} />

		<!-- JSON-LD structured data -->
		<script type="application/ld+json">{JSON.stringify({
			"@context": "https://schema.org",
			"@type": "Person",
			"name": member.name,
			"jobTitle": member.position,
			"worksFor": { "@type": "Organization", "name": siteName, "url": "https://sjcarolunion.com" },
			"image": member.photo || undefined,
			"description": metaDesc,
			"url": `https://sjcarolunion.com/team/${slug}`,
			"sameAs": Object.values(member.socialLinks ?? {}).filter(Boolean)
		})}</script>
</svelte:head>

<Navbar />

<main class="min-h-screen" style="background: rgb(var(--sjcu-dark));">

	<!-- Hero -->
		<div class="relative overflow-hidden">
			<!-- BG photo blur -->
			{#if member.photo}
				<div class="absolute inset-0 z-0">
					<img src={member.photo} alt="" class="w-full h-full object-cover object-top scale-110"
						style="filter: blur(60px); opacity: 0.18;" aria-hidden="true" />
				</div>
			{/if}
			<div class="absolute inset-0 z-0" style="background: linear-gradient(180deg, transparent 0%, rgb(var(--sjcu-dark)) 85%);"></div>

			<div class="relative z-10 max-w-6xl mx-auto px-6 pt-28 pb-0">
				<!-- Back button -->
				<button onclick={() => goto('/#members')}
					class="inline-flex items-center gap-2 text-sjcu-text-muted hover:text-sjcu-text-primary transition-colors text-sm mb-12 group">
					<ArrowLeft class="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
					Back to Team
				</button>

				<div class="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">
					<!-- Portrait -->
					<div class="flex-shrink-0 self-center lg:self-start">
						<div class="relative">
							<div class="w-64 h-80 lg:w-80 lg:h-96 rounded-3xl overflow-hidden"
								style="border: 2px solid rgba(124,58,237,0.4); box-shadow: 0 0 60px rgba(124,58,237,0.2);">
								{#if member.photo}
									<img src={member.photo} alt={member.name}
										class="w-full h-full object-cover object-top" />
								{:else}
									<div class="w-full h-full bg-gradient-to-br from-sjcu-purple/30 to-sjcu-navy flex items-center justify-center">
										<Users class="w-24 h-24 text-white/20" />
									</div>
								{/if}
							</div>
							<!-- Glow orb -->
							<div class="absolute -bottom-4 left-1/2 -translate-x-1/2 w-40 h-8 rounded-full pointer-events-none"
								style="background: rgba(124,58,237,0.4); filter: blur(20px);"></div>
						</div>
					</div>

					<!-- Info -->
					<div class="flex-1 pb-16">
						<!-- Categories -->
						<div class="flex flex-wrap gap-2 mb-5">
							{#each (Array.isArray(member.teamCategory) ? member.teamCategory : [member.teamCategory]) as cat}
								<span class="px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase"
									style="background: rgba(124,58,237,0.15); color: #a78bfa; border: 1px solid rgba(124,58,237,0.35);">
									{cat}
								</span>
							{/each}
						</div>

						<h1 class="font-display text-5xl lg:text-7xl font-bold text-white leading-tight mb-3">
							{member.name}
						</h1>
						<p class="text-sjcu-accent text-xl lg:text-2xl font-medium mb-6">{member.position}</p>
						<p class="text-sjcu-text-muted text-xs uppercase tracking-widest mb-6">{siteName}</p>

						{#if member.description}
							<p class="text-sjcu-text-secondary text-lg leading-relaxed mb-10 max-w-2xl">
								{member.description}
							</p>
						{/if}

						<!-- Social links -->
						{#if socials.some(({ key }) => member?.socialLinks?.[key as keyof typeof member.socialLinks])}
							<div>
								<p class="text-sjcu-text-muted text-xs uppercase tracking-widest mb-4">Connect</p>
								<div class="flex flex-wrap gap-3">
									{#each socials as { key, Icon, label, color }}
										{@const href = member.socialLinks?.[key as keyof typeof member.socialLinks] ?? ''}
										{#if href}
											<a {href} target="_blank" rel="noopener noreferrer"
												class="flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-medium transition-all duration-300 hover:scale-105"
												style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #fff;">
												<Icon class="w-4 h-4" style="color: {color}" />
												{label}
											</a>
										{/if}
									{/each}
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- Divider -->
		<div class="max-w-6xl mx-auto px-6 pb-24">
			<div class="h-px w-full mt-8" style="background: linear-gradient(to right, transparent, rgba(124,58,237,0.3), transparent);"></div>
			<div class="flex items-center justify-center mt-12">
				<button onclick={() => goto('/#members')}
					class="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-sm font-semibold transition-all duration-300 hover:scale-105"
					style="background: rgba(124,58,237,0.15); border: 1px solid rgba(124,58,237,0.35); color: #a78bfa;">
					<Users class="w-4 h-4" /> View All Team Members
				</button>
			</div>
		</div>
</main>

<Footer />
