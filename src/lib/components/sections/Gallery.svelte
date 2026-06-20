<script lang="ts">
	import { onMount } from 'svelte';
	import { galleryApi, settingsApi } from '$lib/services/api.js';
	import type { GalleryItem } from '$lib/types/index.js';
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
	import { X, Play, ChevronLeft, ChevronRight, Images } from 'lucide-svelte';
	import FloatingNotes from '$lib/components/ui/FloatingNotes.svelte';
	import Reveal from '$lib/components/ui/Reveal.svelte';

	let items = $state<GalleryItem[]>([]);
	let loading = $state(true);
	let activeCategory = $state('All');
	let lightboxItem = $state<GalleryItem | null>(null);
	let stripEl = $state<HTMLDivElement | undefined>(undefined);
	let atStart = $state(true);
	let atEnd = $state(false);
	let hovered = false; // plain var — no reactivity needed, only read inside RAF
	let rafId: number | null = null;
	let lastTs = 0;
	const SCROLL_SPEED = 60; // px per second

	const categories = ['All', 'Productions', 'Events', 'Choir Practice', 'Behind The Scenes', 'Team Moments'];
	const filtered = $derived(activeCategory === 'All' ? items : items.filter((i) => i.category === activeCategory));

	function startAutoScroll() {
		if (rafId) return;
		lastTs = performance.now();
		function tick(ts: number) {
			const delta = ts - lastTs;
			lastTs = ts;
			if (stripEl && !hovered) {
				stripEl.scrollLeft += (SCROLL_SPEED * delta) / 1000;
				// seamless loop: once we've scrolled through the first copy,
				// jump back by exactly half — content is identical so it's invisible
				const half = stripEl.scrollWidth / 2;
				if (stripEl.scrollLeft >= half) {
					stripEl.scrollLeft -= half;
				}
			}
			rafId = requestAnimationFrame(tick);
		}
		rafId = requestAnimationFrame(tick);
	}

	function stopAutoScroll() {
		if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
	}

	function shuffleArray<T>(arr: T[]): T[] {
		const a = [...arr];
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	}

	onMount(async () => {
		try {
			const [galleryRes, settingsRes] = await Promise.all([galleryApi.getAll(), settingsApi.get()]);
			const raw: GalleryItem[] = galleryRes.data.data.gallery || [];
			const isShuffled = settingsRes.data.data.settings?.galleryShuffled ?? false;
			items = isShuffled ? shuffleArray(raw) : raw;
		} catch {
			items = [];
		} finally {
			loading = false;
			setTimeout(() => { updateArrows(); startAutoScroll(); }, 80);
		}
		return stopAutoScroll;
	});

	function updateArrows() {
		if (!stripEl) return;
		atStart = stripEl.scrollLeft <= 8;
		atEnd = stripEl.scrollLeft + stripEl.clientWidth >= stripEl.scrollWidth - 8;
	}

	function scroll(dir: 'left' | 'right') {
		if (!stripEl) return;
		const amount = stripEl.clientWidth * 0.75;
		stripEl.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' });
	}

	function openLightbox(item: GalleryItem) { lightboxItem = item; document.body.style.overflow = 'hidden'; }
	function closeLightbox() { lightboxItem = null; document.body.style.overflow = ''; }

	function getVideoThumbnail(url: string): string {
		if (!url) return '';
		return url
			.replace('/video/upload/', '/video/upload/so_0,f_jpg,q_auto,w_640/')
			.replace(/\.\w+$/, '.jpg');
	}

	// navigate lightbox with arrow keys
	function handleKey(e: KeyboardEvent) {
		if (e.key === 'Escape') { closeLightbox(); return; }
		if (!lightboxItem) return;
		const idx = filtered.findIndex(i => i._id === lightboxItem!._id);
		if (e.key === 'ArrowRight' && idx < filtered.length - 1) openLightbox(filtered[idx + 1]);
		if (e.key === 'ArrowLeft' && idx > 0) openLightbox(filtered[idx - 1]);
	}
</script>

<svelte:window onkeydown={handleKey} />

<section id="gallery" class="py-24 md:py-32 relative overflow-hidden bg-sjcu-dark">
	<!-- Ambient glow -->
	<div class="absolute top-1/3 left-1/4 w-96 h-96 bg-sjcu-purple/8 rounded-full blur-[120px] pointer-events-none"></div>
	<div class="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-600/6 rounded-full blur-[100px] pointer-events-none"></div>
	<FloatingNotes opacity={0.28} size="lg" speed="normal" />

	<div class="max-w-7xl mx-auto px-6 mb-12 relative" style="z-index: 2;">
		<Reveal class="text-center mb-12">
			<span class="section-tag justify-center">Visual Story</span>
			<h2 class="section-title mt-2 mb-4">Visual <span class="purple-gradient-text">Gallery</span></h2>
			<p class="section-subtitle mx-auto">Captured moments from our performances, rehearsals, and behind-the-scenes.</p>
		</Reveal>

		<!-- Category filters -->
		<div class="flex flex-wrap items-center justify-center gap-2">
			{#each categories as cat}
				<button
					onclick={() => {
						activeCategory = cat;
						setTimeout(() => {
							if (stripEl) stripEl.scrollLeft = 0;
						}, 50);
					}}
					class="px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 {activeCategory === cat
						? 'bg-sjcu-purple text-white shadow-purple-glow'
						: 'bg-sjcu-card border border-sjcu-border/50 text-sjcu-text-secondary hover:border-sjcu-purple/40 hover:text-sjcu-text-primary'}"
				>
					{cat}
				</button>
			{/each}
		</div>
	</div>

	<div class="relative" style="z-index: 2;">
	{#if loading}
		<LoadingSpinner size="lg" class="py-20" />
	{:else if filtered.length === 0}
		<div class="text-center py-20 text-sjcu-text-muted">
			<Images class="w-16 h-16 mx-auto mb-4 opacity-20" />
			<p>No gallery items yet. Check back soon!</p>
		</div>
	{:else}
		<!-- Strip wrapper — full bleed with nav arrows -->
		<div
			class="relative group/strip"
			onmouseenter={() => { hovered = true; }}
			onmouseleave={() => { hovered = false; }}
		>

			<!-- Left arrow -->
			<button
				onclick={() => scroll('left')}
				class="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300
					{atStart ? 'opacity-0 pointer-events-none' : 'opacity-100'}
					hover:scale-110"
				style="background: rgba(124,58,237,0.8); backdrop-filter: blur(12px); box-shadow: 0 4px 24px rgba(124,58,237,0.5);"
				aria-label="Scroll left"
			>
				<ChevronLeft class="w-5 h-5 text-white" />
			</button>

			<!-- Right arrow -->
			<button
				onclick={() => scroll('right')}
				class="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300
					{atEnd ? 'opacity-0 pointer-events-none' : 'opacity-100'}
					hover:scale-110"
				style="background: rgba(124,58,237,0.8); backdrop-filter: blur(12px); box-shadow: 0 4px 24px rgba(124,58,237,0.5);"
				aria-label="Scroll right"
			>
				<ChevronRight class="w-5 h-5 text-white" />
			</button>

			<!-- Left fade edge -->
			<div class="gallery-fade-left absolute left-0 top-0 bottom-4 w-20 z-10 pointer-events-none transition-opacity duration-300 {atStart ? 'opacity-0' : 'opacity-100'}"></div>
			<!-- Right fade edge -->
			<div class="gallery-fade-right absolute right-0 top-0 bottom-4 w-20 z-10 pointer-events-none transition-opacity duration-300 {atEnd ? 'opacity-0' : 'opacity-100'}"></div>

			<!-- Filmstrip -->
			<div
				bind:this={stripEl}
				onscroll={updateArrows}
				class="flex gap-3 overflow-x-auto pb-4 px-6 scrollbar-hide"
			>
				{#each [...filtered, ...filtered] as item, i}
					{@const isVideo = item.type === 'video'}
					{@const thumb = isVideo ? getVideoThumbnail(item.videoUrl) : item.image}
					{@const isDupe = i >= filtered.length}
					<!-- Videos wider (16:9 at 480px height = 853px, capped); images portrait -->
					<button
						onclick={() => !isDupe && openLightbox(item)}
						aria-hidden={isDupe ? 'true' : undefined}
						tabindex={isDupe ? -1 : 0}
						class="relative flex-shrink-0 overflow-hidden rounded-2xl group cursor-pointer film-card"
						style="height: 480px; width: {isVideo ? '640px' : '340px'};"
						aria-label={item.caption || item.category}
					>
						{#if thumb}
							<img
								src={thumb}
								alt={item.caption || item.category}
								class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out film-img"
								loading="lazy"
							/>
						{:else}
							<div class="absolute inset-0 flex items-center justify-center bg-sjcu-navy-2">
								<Play class="w-16 h-16 text-sjcu-accent/30" />
							</div>
						{/if}

						<!-- Base gradient always visible (bottom fade) -->
						<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>

						<!-- Hover overlay -->
						<div class="absolute inset-0 transition-opacity duration-400 opacity-0 group-hover:opacity-100"
							style="background: rgba(124,58,237,0.12);">
						</div>

						<!-- Video play pill (always visible) -->
						{#if isVideo}
							<div class="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
								style="background: rgba(220,38,38,0.85); backdrop-filter: blur(8px);">
								<Play class="w-3 h-3 text-white" />
								<span class="text-white text-[11px] font-semibold tracking-wide">VIDEO</span>
							</div>
						{/if}

						<!-- Frame number (film aesthetic) -->
						<div class="absolute top-4 right-4 font-mono text-xs text-white/30 select-none pointer-events-none">
							{String((i % filtered.length) + 1).padStart(2, '0')}
						</div>

						<!-- Caption + category (slides up on hover) -->
						<div class="absolute bottom-0 left-0 right-0 px-5 py-5 translate-y-2 group-hover:translate-y-0 transition-transform duration-400">
							{#if item.caption}
								<p class="text-white text-sm font-semibold leading-snug mb-1">{item.caption}</p>
							{/if}
							<span class="inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider"
								style="background: rgba(124,58,237,0.35); color: #c4b5fd; border: 1px solid rgba(124,58,237,0.4);">
								{item.category}
							</span>
						</div>

						<!-- Click-to-open ring -->
						<div class="absolute inset-0 rounded-2xl ring-0 group-hover:ring-2 group-hover:ring-sjcu-purple/60 transition-all duration-400 pointer-events-none"></div>
					</button>
				{/each}

				<!-- Trailing spacer so last card isn't flush against edge -->
				<div class="flex-shrink-0 w-6" aria-hidden="true"></div>
			</div>

			<!-- Filmstrip perforations at the bottom (purely decorative) -->
			<div class="flex gap-3 px-6 mt-2 overflow-hidden pointer-events-none" aria-hidden="true">
				{#each Array.from({ length: 40 }) as _}
					<div class="flex-shrink-0 w-5 h-2 rounded-sm opacity-10" style="background: #a78bfa;"></div>
				{/each}
			</div>
		</div>

		<!-- Item count -->
		<p class="text-center text-sjcu-text-muted text-xs mt-6">{filtered.length} {filtered.length === 1 ? 'item' : 'items'}{activeCategory !== 'All' ? ` in ${activeCategory}` : ''} · scroll to explore</p>
	{/if}
	</div>
</section>

<!-- Lightbox -->
{#if lightboxItem}
	{@const isVideo = lightboxItem.type === 'video'}
	{@const idx = filtered.findIndex(i => i._id === lightboxItem!._id)}

	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		style="background: rgba(3,1,20,0.96); backdrop-filter: blur(20px);"
		onclick={closeLightbox}
		role="dialog"
		aria-modal="true"
	>
		<!-- Close -->
		<button
			onclick={closeLightbox}
			class="absolute top-5 right-5 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition-all"
			aria-label="Close"
		>
			<X class="w-5 h-5" />
		</button>

		<!-- Prev -->
		{#if idx > 0}
			<button
				onclick={(e) => { e.stopPropagation(); openLightbox(filtered[idx - 1]); }}
				class="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all hover:scale-110"
				aria-label="Previous"
			><ChevronLeft class="w-5 h-5" /></button>
		{/if}

		<!-- Next -->
		{#if idx < filtered.length - 1}
			<button
				onclick={(e) => { e.stopPropagation(); openLightbox(filtered[idx + 1]); }}
				class="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all hover:scale-110"
				aria-label="Next"
			><ChevronRight class="w-5 h-5" /></button>
		{/if}

		<!-- Counter -->
		<div class="absolute top-5 left-1/2 -translate-x-1/2 z-20">
			<span class="font-mono text-xs text-white/40">{String(idx + 1).padStart(2,'0')} / {String(filtered.length).padStart(2,'0')}</span>
		</div>

		{#if isVideo}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="relative w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl animate-fadeUp"
				style="aspect-ratio: 16/9;"
				onclick={(e) => e.stopPropagation()}
				onkeydown={() => {}}
			>
				<video
					src={lightboxItem.videoUrl}
					class="w-full h-full object-contain bg-black"
					controls
					autoplay
					playsinline
				></video>
			</div>
		{:else}
			<img
				src={lightboxItem.image}
				alt={lightboxItem.caption || 'Gallery'}
				class="max-w-full max-h-[88vh] object-contain rounded-2xl shadow-2xl animate-fadeUp"
				onclick={(e) => e.stopPropagation()}
				onkeydown={() => {}}
			/>
		{/if}

		<!-- Caption -->
		{#if lightboxItem.caption}
			<div class="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 text-center">
				<p class="text-white text-sm font-medium px-5 py-2 rounded-full"
					style="background: rgba(0,0,0,0.55); backdrop-filter: blur(12px);">{lightboxItem.caption}</p>
			</div>
		{/if}
	</div>
{/if}

<style>
	.scrollbar-hide::-webkit-scrollbar { display: none; }
	.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

	.gallery-fade-left {
		background: linear-gradient(to right, rgb(var(--sjcu-dark)) 0%, transparent 100%);
	}
	.gallery-fade-right {
		background: linear-gradient(to left, rgb(var(--sjcu-dark)) 0%, transparent 100%);
	}

	.film-card {
		transition: transform 0.3s ease, box-shadow 0.3s ease;
	}
	.film-card:hover {
		transform: translateY(-6px);
		box-shadow: 0 24px 60px rgba(124, 58, 237, 0.3), 0 8px 24px rgba(0,0,0,0.6);
	}
	.film-card:hover :global(.film-img) {
		transform: scale(1.08);
	}
</style>
