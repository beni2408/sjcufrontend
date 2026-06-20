<script lang="ts">
	import { onMount } from 'svelte';
	import { Play, ExternalLink, Filter } from 'lucide-svelte';
	import FloatingNotes from '$lib/components/ui/FloatingNotes.svelte';
	import { productionsApi } from '$lib/services/api.js';
	import type { Production } from '$lib/types/index.js';
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
	import { tilt } from '$lib/actions/tilt.js';

	let productions = $state<Production[]>([]);
	let loading = $state(true);
	let activeCategory = $state('All');

	const categories = ['All', 'General Songs', 'Special Songs', 'Christmas Songs', 'Church Dedication Songs', 'Wedding Songs', 'Lent Days Song'];

	const filtered = $derived(
		activeCategory === 'All' ? productions : productions.filter((p) => p.category === activeCategory)
	);

	function getYoutubeId(url: string) {
		const match = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/shorts\/))([^&\s?]+)/);
		return match?.[1] || '';
	}

	function getYoutubeThumbnail(url: string) {
		const id = getYoutubeId(url);
		return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : '';
	}

	onMount(async () => {
		try {
			const res = await productionsApi.getAll();
			productions = res.data.data.productions || [];
		} catch {
			productions = [];
		} finally {
			loading = false;
		}

		const { gsap } = await import('gsap');
		const { ScrollTrigger } = await import('gsap/ScrollTrigger');
		gsap.registerPlugin(ScrollTrigger);
		gsap.fromTo('#productions .production-card', {
			opacity: 0, y: 40
		}, {
			opacity: 1, y: 0, duration: 0.7, stagger: 0.1,
			scrollTrigger: { trigger: '#productions', start: 'top 75%' }
		});
	});
</script>

<section id="productions" class="py-24 md:py-32 bg-sjcu-navy-2 relative overflow-hidden">
	<FloatingNotes opacity={0.18} size="md" speed="normal" />
	<div class="absolute inset-0 bg-purple-glow pointer-events-none opacity-30"></div>

	<div class="max-w-7xl mx-auto px-6">
		<div class="text-center mb-12">
			<span class="section-tag justify-center">
				Our Work
			</span>
			<h2 class="section-title mt-2 mb-4">Our <span class="purple-gradient-text">Productions</span></h2>
			<p class="section-subtitle mx-auto">
				Explore our catalog of studio recordings, live performances, and music videos crafted with passion.
			</p>
		</div>

		<div class="flex flex-wrap items-center justify-center gap-2 mb-10">
			{#each categories as cat}
				<button
					onclick={() => (activeCategory = cat)}
					class="card-ripple tag-shimmer px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 {activeCategory === cat
						? 'bg-sjcu-purple text-white shadow-purple-glow'
						: 'bg-sjcu-card border border-sjcu-border text-sjcu-text-secondary hover:border-sjcu-purple/40 hover:text-sjcu-text-primary'}"
				>
					{cat}
				</button>
			{/each}
		</div>

		{#if loading}
			<LoadingSpinner size="lg" class="py-20" />
		{:else if filtered.length === 0}
			<div class="text-center py-20 text-sjcu-text-muted">
				<p>No productions found yet. Check back soon!</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each filtered as production}
					<div use:tilt={{ max: 8, liftY: 6 }} class="production-card card-ripple glass-card-hover overflow-hidden group">
						<div class="img-scan relative aspect-video overflow-hidden rounded-xl mb-0">
							<img
								src={production.thumbnail || getYoutubeThumbnail(production.youtubeLink)}
								alt={production.title}
								class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
								loading="lazy"
							/>
							<div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
								<a
									href={production.youtubeLink}
									target="_blank"
									rel="noopener noreferrer"
									class="icon-bounce w-14 h-14 rounded-full bg-sjcu-purple/90 backdrop-blur-sm flex items-center justify-center hover:bg-sjcu-purple transition-colors"
									aria-label="Play {production.title}"
								>
									<Play class="w-6 h-6 text-white fill-white ml-1" />
								</a>
							</div>
							<div class="absolute top-3 left-3">
								<span class="px-2 py-1 text-xs font-semibold bg-sjcu-purple/80 text-white rounded-full backdrop-blur-sm">
									{production.category}
								</span>
							</div>
						</div>
						<div class="p-5">
							<h3 class="text-sjcu-text-primary font-semibold mb-1.5 group-hover:text-sjcu-accent transition-colors">{production.title}</h3>
							{#if production.description}
								<p class="text-sjcu-text-muted text-sm line-clamp-2">{production.description}</p>
							{/if}
							<div class="flex items-center justify-between mt-4">
								{#if production.releaseDate}
									<span class="text-sjcu-text-muted text-xs">
										{new Date(production.releaseDate).getFullYear()}
									</span>
								{/if}
								<a
									href={production.youtubeLink}
									target="_blank"
									rel="noopener noreferrer"
									class="flex items-center gap-1.5 text-sjcu-accent text-xs font-medium hover:text-white transition-colors ml-auto"
								>
									Watch <ExternalLink class="w-3.5 h-3.5" />
								</a>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>
