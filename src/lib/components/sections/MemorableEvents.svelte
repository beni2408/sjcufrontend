<script lang="ts">
	import { onMount } from 'svelte';
	import { memorableEventsApi } from '$lib/services/api.js';
	import type { MemorableEvent } from '$lib/types/index.js';
	import { Calendar, MapPin, Play, X, ChevronLeft, ChevronRight, Images, Film } from 'lucide-svelte';
	import type { GalleryMediaItem } from '$lib/types/index.js';
	import FloatingNotes from '$lib/components/ui/FloatingNotes.svelte';

	let events = $state<MemorableEvent[]>([]);
	let loading = $state(true);
	let selected = $state<MemorableEvent | null>(null);

	// lightbox
	let lbOpen = $state(false);
	let lbIndex = $state(0);

	function openModal(ev: MemorableEvent) { selected = ev; document.body.style.overflow = 'hidden'; }
	function closeModal() { selected = null; lbOpen = false; document.body.style.overflow = ''; }
	function openLightbox(idx: number) { lbIndex = idx; lbOpen = true; }
	function closeLightbox() { lbOpen = false; }
	function lbPrev() { if (!selected) return; lbIndex = (lbIndex - 1 + selected.gallery.length) % selected.gallery.length; }
	function lbNext() { if (!selected) return; lbIndex = (lbIndex + 1) % selected.gallery.length; }

	function handleKeydown(e: KeyboardEvent) {
		if (lbOpen) {
			if (e.key === 'ArrowLeft') lbPrev();
			else if (e.key === 'ArrowRight') lbNext();
			else if (e.key === 'Escape') closeLightbox();
		} else if (selected && e.key === 'Escape') {
			closeModal();
		}
	}

	function handleModalBackdrop(e: MouseEvent) {
		if ((e.target as HTMLElement).id === 'memorable-backdrop') closeModal();
	}
	function handleLbBackdrop(e: MouseEvent) {
		if ((e.target as HTMLElement).id === 'lb-backdrop') closeLightbox();
	}

	function normalizeGallery(gallery: MemorableEvent['gallery']): GalleryMediaItem[] {
		return gallery.map(item =>
			typeof item === 'string' ? { url: item, type: 'image' as const } : item
		);
	}

	function getYoutubeId(url: string) {
		const m = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
		return m?.[1] || '';
	}

	function formatDate(d: string) {
		if (!d) return '';
		return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
	}

	onMount(() => {
		(async () => {
			try {
				const res = await memorableEventsApi.getAll();
				events = res.data.data.events || [];
			} catch {
				events = [];
			} finally {
				loading = false;
			}

			const { gsap } = await import('gsap');
			const { ScrollTrigger } = await import('gsap/ScrollTrigger');
			gsap.registerPlugin(ScrollTrigger);
			gsap.fromTo('#memorable .event-card', {
				opacity: 0, y: 50
			}, {
				opacity: 1, y: 0, duration: 0.7, stagger: 0.12, ease: 'power2.out',
				scrollTrigger: { trigger: '#memorable', start: 'top 75%' }
			});
		})();

		return () => { document.body.style.overflow = ''; };
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<section id="memorable" class="py-24 md:py-32 bg-sjcu-dark relative overflow-hidden">
	<FloatingNotes opacity={0.1} size="sm" speed="slow" />
	<div class="absolute inset-0 pointer-events-none">
		<div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sjcu-purple/40 to-transparent"></div>
		<div class="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sjcu-purple/40 to-transparent"></div>
		<div class="absolute top-1/2 left-1/4 w-96 h-96 rounded-full bg-sjcu-purple/5 blur-3xl -translate-y-1/2"></div>
		<div class="absolute top-1/2 right-1/4 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl -translate-y-1/2"></div>
	</div>

	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
		<div class="text-center mb-16">
			<span class="section-tag justify-center">Our Journey</span>
			<h2 class="section-title mt-2 mb-4">
				Memorable <span class="purple-gradient-text">Events</span>
			</h2>
			<p class="section-subtitle mx-auto">
				A glimpse into the performances, concerts, and gatherings that have shaped our story.
			</p>
		</div>

		{#if loading}
			<div class="flex justify-center py-20">
				<div class="w-12 h-12 border-2 border-sjcu-purple border-t-transparent rounded-full animate-spin"></div>
			</div>
		{:else if events.length === 0}
			<div class="text-center py-16">
				<Images class="w-12 h-12 mx-auto mb-3 text-sjcu-text-muted opacity-40" />
				<p class="text-sjcu-text-muted text-sm">No memorable events added yet.</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
				{#each events as ev}
					<button
						class="event-card card-ripple card-ring-hover group relative flex flex-col text-left rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl bg-sjcu-card border border-sjcu-border/40"
						onclick={() => openModal(ev)}
					>
						<!-- cover image -->
						<div class="img-scan relative w-full h-56 overflow-hidden">
							{#if ev.coverImage}
								<img
									src={ev.coverImage}
									alt={ev.name}
									class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
								/>
							{:else}
								<div class="w-full h-full flex items-center justify-center bg-sjcu-navy">
									<Images class="w-12 h-12 text-sjcu-text-muted opacity-30" />
								</div>
							{/if}
							<!-- dark overlay -->
							<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

							<!-- gallery count badge -->
							{#if ev.gallery.length > 0}
								<div class="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white backdrop-blur-sm"
									style="background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15);">
									<Images class="w-3 h-3" />
									{ev.gallery.length} media
								</div>
							{/if}

							<!-- youtube badge -->
							{#if ev.youtubeLink}
								<div class="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white backdrop-blur-sm"
									style="background: rgba(220,38,38,0.7); border: 1px solid rgba(255,255,255,0.15);">
									<Play class="w-3 h-3 fill-white" />
									Video
								</div>
							{/if}

							<!-- date on image -->
							{#if ev.date}
								<div class="absolute bottom-3 left-4">
									<span class="text-xs text-white/70 font-medium">{formatDate(ev.date)}</span>
								</div>
							{/if}
						</div>

						<!-- content -->
						<div class="flex-1 flex flex-col p-5 gap-2">
							<h3 class="font-display text-lg font-bold text-sjcu-text-primary leading-tight group-hover:text-sjcu-accent transition-colors duration-300">
								{ev.name}
							</h3>
							{#if ev.venue}
								<div class="flex items-center gap-1.5 text-sjcu-text-muted text-xs">
									<MapPin class="w-3 h-3 flex-shrink-0" />
									{ev.venue}
								</div>
							{/if}
							{#if ev.description}
								<p class="text-sjcu-text-muted text-sm leading-relaxed line-clamp-2 mt-1">{ev.description}</p>
							{/if}

							<!-- view gallery cta -->
							<div class="mt-auto pt-4 flex items-center gap-2 text-sjcu-accent text-xs font-semibold">
								<Images class="w-3.5 h-3.5" />
								View Gallery
								<ChevronRight class="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
							</div>
						</div>

						<!-- hover glow border -->
						<div class="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
							style="box-shadow: inset 0 0 0 1px rgba(139,92,246,0.5), 0 0 40px rgba(139,92,246,0.12);"></div>
					</button>
				{/each}
			</div>
		{/if}
	</div>
</section>

<!-- Event modal -->
{#if selected}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		id="memorable-backdrop"
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		style="background: rgba(0,0,0,0.85); backdrop-filter: blur(16px);"
		onclick={handleModalBackdrop}
	>
		<div class="event-modal-card relative w-full max-w-4xl max-h-[92vh] rounded-3xl overflow-hidden flex flex-col animate-modal-spring">

			<!-- shimmer top bar -->
			<div class="h-1 w-full flex-shrink-0" style="background: linear-gradient(90deg,#6d28d9,#a855f7,#3b82f6,#a855f7,#6d28d9); background-size:300% 100%; animation: shimmer 4s linear infinite;"></div>

			<!-- close -->
			<button onclick={closeModal}
				class="event-modal-close icon-bounce absolute top-4 right-4 z-20 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm transition-all">
				<X class="w-4 h-4" />
			</button>

			<!-- hero cover -->
			<div class="relative w-full h-56 flex-shrink-0 overflow-hidden">
				{#if selected.coverImage}
					<img src={selected.coverImage} alt={selected.name} class="w-full h-full object-cover" />
					<div class="event-modal-cover-fade absolute inset-0"></div>
				{:else}
					<div class="w-full h-full bg-sjcu-navy flex items-center justify-center">
						<Images class="w-16 h-16 text-sjcu-text-muted opacity-20" />
					</div>
				{/if}

				<!-- event info overlay -->
				<div class="absolute bottom-0 left-0 right-0 p-6">
					<h2 class="font-display text-2xl md:text-3xl font-bold text-white mb-1">{selected.name}</h2>
					<div class="flex flex-wrap items-center gap-4 text-sm text-white/70">
						{#if selected.date}<span class="flex items-center gap-1.5"><Calendar class="w-3.5 h-3.5" />{formatDate(selected.date)}</span>{/if}
						{#if selected.venue}<span class="flex items-center gap-1.5"><MapPin class="w-3.5 h-3.5" />{selected.venue}</span>{/if}
					</div>
				</div>
			</div>

			<!-- scrollable content -->
			<div class="event-modal-content flex-1 overflow-y-auto min-h-0" style="scrollbar-width: thin; scrollbar-color: rgba(139,92,246,0.4) transparent;">
				<div class="p-6 space-y-6">

					<!-- description -->
					{#if selected.description}
						<p class="text-sjcu-text-secondary leading-relaxed">{selected.description}</p>
					{/if}

					<!-- youtube embed -->
					{#if selected.youtubeLink && getYoutubeId(selected.youtubeLink)}
						<div>
							<h3 class="text-white font-semibold text-sm mb-3 flex items-center gap-2">
								<span class="w-1 h-4 rounded-full bg-red-500 inline-block"></span>
								Performance Video
							</h3>
							<div class="relative w-full rounded-2xl overflow-hidden" style="padding-bottom: 56.25%;">
								<iframe
									src="https://www.youtube.com/embed/{getYoutubeId(selected.youtubeLink)}"
									title={selected.name}
									frameborder="0"
									allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
									allowfullscreen
									class="absolute inset-0 w-full h-full"
								></iframe>
							</div>
						</div>
					{/if}

					<!-- gallery -->
					{#if selected.gallery.length > 0}
						{@const normalizedGallery = normalizeGallery(selected.gallery)}
						<div>
							<h3 class="text-white font-semibold text-sm mb-3 flex items-center gap-2">
								<span class="w-1 h-4 rounded-full bg-sjcu-purple inline-block"></span>
								Event Gallery
								<span class="text-sjcu-text-muted font-normal">({selected.gallery.length} media)</span>
							</h3>
							<div class="grid gap-2" style="grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));">
								{#each normalizedGallery as item, idx}
									<button
										class="group relative aspect-square rounded-xl overflow-hidden cursor-pointer bg-black"
										onclick={() => openLightbox(idx)}
									>
										{#if item.type === 'video'}
											<!-- svelte-ignore a11y_media_has_caption -->
											<video src={item.url} preload="metadata" class="w-full h-full object-cover opacity-80 transition-transform duration-300 group-hover:scale-110"></video>
											<div class="absolute inset-0 flex items-center justify-center">
												<div class="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
													<Play class="w-4 h-4 fill-white text-white ml-0.5" />
												</div>
											</div>
										{:else}
											<img src={item.url} alt="Gallery {idx + 1}" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
											<div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
												<div class="opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
													<ChevronRight class="w-4 h-4 text-white" />
												</div>
											</div>
										{/if}
									</button>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Lightbox -->
{#if lbOpen && selected}
	{@const lbGallery = normalizeGallery(selected.gallery)}
	{@const lbItem = lbGallery[lbIndex]}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		id="lb-backdrop"
		class="fixed inset-0 z-[60] flex flex-col items-center justify-center"
		style="background: rgba(0,0,0,0.95);"
		onclick={handleLbBackdrop}
	>
		<button onclick={closeLightbox}
			class="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white hover:bg-white/20 transition-all z-10">
			<X class="w-4 h-4" />
		</button>

		<div class="flex items-center gap-2 text-white/50 text-sm mb-4">
			{#if lbItem?.type === 'video'}<Film class="w-3.5 h-3.5" />{/if}
			{lbIndex + 1} / {lbGallery.length}
		</div>

		<div class="relative flex items-center justify-center w-full px-16 flex-1 min-h-0">
			<button onclick={lbPrev}
				class="absolute left-4 w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white hover:bg-white/20 transition-all z-10">
				<ChevronLeft class="w-5 h-5" />
			</button>

			{#if lbItem?.type === 'video'}
				<!-- svelte-ignore a11y_media_has_caption -->
				<video
					src={lbItem.url}
					controls
					autoplay
					class="max-w-full max-h-[70vh] rounded-2xl shadow-2xl"
					style="background:#000;"
				></video>
			{:else}
				<img
					src={lbItem?.url ?? ''}
					alt="Gallery {lbIndex + 1}"
					class="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl"
				/>
			{/if}

			<button onclick={lbNext}
				class="absolute right-4 w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white hover:bg-white/20 transition-all z-10">
				<ChevronRight class="w-5 h-5" />
			</button>
		</div>

		<!-- thumbnail strip -->
		<div class="flex items-center gap-2 mt-4 px-4 pb-4 overflow-x-auto max-w-full" style="scrollbar-width: none;">
			{#each lbGallery as item, idx}
				<button
					onclick={() => (lbIndex = idx)}
					class="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 bg-black transition-all duration-200 {lbIndex === idx ? 'border-sjcu-purple scale-110' : 'border-transparent opacity-50 hover:opacity-80'}"
				>
					{#if item.type === 'video'}
						<!-- svelte-ignore a11y_media_has_caption -->
						<video src={item.url} preload="metadata" class="w-full h-full object-cover"></video>
					{:else}
						<img src={item.url} alt="" class="w-full h-full object-cover" />
					{/if}
				</button>
			{/each}
		</div>
	</div>
{/if}

<style>
	/* ── Event detail modal ─────────────────────────────────────────────── */
	.event-modal-card {
		background: #0a0a1a;
		border: 1px solid rgba(139,92,246,0.25);
	}
	:global([data-theme="light"]) .event-modal-card {
		background: rgb(var(--sjcu-card));
		border-color: rgba(124,58,237,0.18);
		box-shadow: 0 32px 64px rgba(124,58,237,0.12);
	}

	.event-modal-cover-fade {
		background: linear-gradient(to top, #0a0a1a 0%, rgba(0,0,0,0.4) 40%, transparent 70%);
	}
	:global([data-theme="light"]) .event-modal-cover-fade {
		background: linear-gradient(to top, rgb(var(--sjcu-card)) 0%, rgba(0,0,0,0.25) 40%, transparent 70%);
	}

	.event-modal-close {
		background: rgba(0,0,0,0.5);
		border: 1px solid rgba(255,255,255,0.15);
		color: #fff;
	}
	.event-modal-close:hover { background: rgba(255,255,255,0.2); }
	:global([data-theme="light"]) .event-modal-close {
		background: rgba(124,58,237,0.08);
		border-color: rgba(124,58,237,0.25);
		color: rgb(var(--sjcu-accent));
	}
	:global([data-theme="light"]) .event-modal-close:hover {
		background: rgba(124,58,237,0.2);
	}

	/* Text in scrollable content */
	:global([data-theme="light"]) .event-modal-content h3.text-white {
		color: rgb(var(--sjcu-text-primary));
	}

	@keyframes shimmer {
		0% { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}
	@keyframes modal-in {
		from { opacity: 0; transform: translateY(20px) scale(0.97); }
		to   { opacity: 1; transform: translateY(0) scale(1); }
	}
	.animate-modal-in {
		animation: modal-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
	}
</style>
