<script lang="ts">
	import { onMount } from 'svelte';
	import { X, MessageSquare, Music, Mic, Video, Wand, CheckCircle2, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-svelte';
	import FloatingNotes from '$lib/components/ui/FloatingNotes.svelte';
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
	import { upcomingApi } from '$lib/services/api.js';
	import type { UpcomingProject } from '$lib/types/index.js';

	const STAGES = [
		{ key: 'discussion',      label: 'In Discussion',   icon: MessageSquare },
		{ key: 'pre_production',  label: 'Pre-Production',  icon: Music },
		{ key: 'audio_recording', label: 'Audio Recording', icon: Mic },
		{ key: 'video_recording', label: 'Video Recording', icon: Video },
		{ key: 'post_production', label: 'Post Production', icon: Wand },
		{ key: 'released',        label: 'Released',        icon: CheckCircle2 },
	] as const;

	type StageKey = typeof STAGES[number]['key'];

	let projects = $state<UpcomingProject[]>([]);
	let loading = $state(true);
	let selected = $state<UpcomingProject | null>(null);

	// Lightbox state
	let lightboxImages = $state<string[]>([]);
	let lightboxIndex = $state(0);
	let lightboxOpen = $state(false);

	const active   = $derived(projects.filter(p => p.currentStage !== 'released'));
	const released = $derived(projects.filter(p => p.currentStage === 'released'));

	function stageIndex(key: string) {
		return STAGES.findIndex(s => s.key === key);
	}
	function currentStageLabel(key: string) {
		return STAGES.find(s => s.key === key)?.label ?? key;
	}

	function openModal(p: UpcomingProject) {
		selected = p;
		document.body.style.overflow = 'hidden';
	}
	function closeModal() {
		if (lightboxOpen) { closeLightbox(); return; }
		selected = null;
		document.body.style.overflow = '';
	}

	function openLightbox(images: string[], idx: number) {
		lightboxImages = images;
		lightboxIndex  = idx;
		lightboxOpen   = true;
	}
	function closeLightbox() {
		lightboxOpen = false;
	}
	function lbPrev() { lightboxIndex = (lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length; }
	function lbNext() { lightboxIndex = (lightboxIndex + 1) % lightboxImages.length; }

	function handleKeydown(e: KeyboardEvent) {
		if (lightboxOpen) {
			if (e.key === 'Escape') closeLightbox();
			if (e.key === 'ArrowLeft') lbPrev();
			if (e.key === 'ArrowRight') lbNext();
			return;
		}
		if (e.key === 'Escape') closeModal();
	}

	onMount(() => {
		upcomingApi.getAll()
			.then(res => { projects = res.data.data.projects || []; })
			.catch(() => { projects = []; })
			.finally(() => { loading = false; });
		return () => { document.body.style.overflow = ''; };
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- ─── Section ─────────────────────────────────────────────────────────── -->
<section id="upcoming-projects" class="py-24 md:py-32 bg-sjcu-dark relative overflow-hidden">
	<FloatingNotes opacity={0.15} size="md" speed="slow" />
	<div class="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
		style="background: radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%);"></div>
	<div class="absolute bottom-0 left-0 w-96 h-96 rounded-full pointer-events-none"
		style="background: radial-gradient(circle, rgba(124,58,237,0.05) 0%, transparent 70%);"></div>

	<div class="max-w-7xl mx-auto px-6">
		<div class="text-center mb-14">
			<span class="section-tag justify-center">In The Studio</span>
			<h2 class="section-title mt-2 mb-4">
				Upcoming <span class="purple-gradient-text">Projects</span>
			</h2>
			<p class="section-subtitle mx-auto">
				Follow along as we craft our next chapter — from first conversations to final release.
			</p>
		</div>

		{#if loading}
			<LoadingSpinner size="lg" class="py-20" />
		{:else if projects.length === 0}
			<div class="text-center py-20 text-sjcu-text-muted">
				<p>No upcoming projects right now. Check back soon!</p>
			</div>
		{:else}
			{#if active.length > 0}
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
					{#each active as project}
						<button
							onclick={() => openModal(project)}
							class="group card-ripple card-ring-hover relative rounded-2xl overflow-hidden text-left w-full transition-all duration-300 hover:-translate-y-2 focus:outline-none upcoming-active-card"
							style="min-height: 320px;"
						>
							{#if project.featureImage}
								<div class="absolute inset-0 overflow-hidden">
									<img src={project.featureImage} alt={project.name}
										class="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" loading="lazy" />
									<div class="absolute inset-0 upcoming-img-overlay"></div>
								</div>
							{:else}
								<div class="absolute inset-0 up-card-no-img" style="background: linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(5,2,20,0.9) 100%);"></div>
							{/if}

							<!-- Top progress bar -->
							<div class="absolute top-0 left-0 right-0 h-1" style="background: rgba(124,58,237,0.15);">
								<div class="h-full transition-all duration-700"
									style="width: {((stageIndex(project.currentStage) + 1) / 6) * 100}%; background: linear-gradient(to right, #7c3aed, #c4b5fd);"></div>
							</div>

							<div class="relative z-10 flex flex-col h-full p-6" style="min-height: 320px;">
								<div class="flex-1">
									<span class="up-card-badge inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
										style="background: rgba(124,58,237,0.25); color: #c4b5fd; border: 1px solid rgba(124,58,237,0.4);">
										<span class="w-1.5 h-1.5 rounded-full bg-sjcu-accent animate-pulse"></span>
										{currentStageLabel(project.currentStage)}
									</span>
								</div>
								<div class="mt-auto">
									<div class="flex gap-1 mb-4">
										{#each STAGES as _, idx}
											<div class="h-1 flex-1 rounded-full transition-all duration-300"
												class:up-seg-inactive={idx > stageIndex(project.currentStage)}
												style="background: {idx <= stageIndex(project.currentStage) ? 'rgba(167,139,250,0.85)' : 'rgba(255,255,255,0.08)'};">
											</div>
										{/each}
									</div>
									<h3 class="text-sjcu-text-primary font-display font-bold text-xl mb-1 group-hover:text-sjcu-accent transition-colors">{project.name}</h3>
									{#if project.description}
										<p class="text-sjcu-text-muted text-sm line-clamp-2">{project.description}</p>
									{/if}
									<p class="up-card-cta text-xs mt-3 transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0">Tap to view journey →</p>
								</div>
							</div>
							<div class="absolute inset-0 rounded-2xl transition-all duration-300 pointer-events-none group-hover:shadow-[0_0_40px_rgba(124,58,237,0.25),inset_0_0_0_1px_rgba(124,58,237,0.5)]"></div>
						</button>
					{/each}
				</div>
			{/if}

			{#if released.length > 0}
				<div>
					<div class="flex items-center gap-4 mb-6">
						<div class="flex-1 h-px" style="background: linear-gradient(to right, transparent, rgba(124,58,237,0.4), transparent);"></div>
						<span class="px-5 py-2 rounded-full text-xs font-bold tracking-widest uppercase"
							style="background: rgba(124,58,237,0.1); color: #a78bfa; border: 1px solid rgba(124,58,237,0.3);">Recently Released</span>
						<div class="flex-1 h-px" style="background: linear-gradient(to left, transparent, rgba(124,58,237,0.4), transparent);"></div>
					</div>
					<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
						{#each released as project}
							<button onclick={() => openModal(project)}
								class="group card-ripple card-ring-hover relative rounded-xl overflow-hidden text-left w-full aspect-square focus:outline-none border border-sjcu-purple/20">
								{#if project.featureImage}
									<img src={project.featureImage} alt={project.name}
										class="w-full h-full object-cover opacity-60 group-hover:opacity-85 group-hover:scale-105 transition-all duration-500" loading="lazy" />
								{:else}
									<div class="w-full h-full" style="background: rgba(124,58,237,0.15);"></div>
								{/if}
								<div class="absolute inset-0 upcoming-released-overlay"></div>
								<div class="absolute bottom-0 left-0 right-0 p-3">
									<p class="released-project-name text-xs font-semibold line-clamp-2" style="color: var(--mt-title);">{project.name}</p>
									<p class="up-released-year text-xs mt-0.5" style="color: #a78bfa;">Released ✓</p>
								</div>
							</button>
						{/each}
					</div>
				</div>
			{/if}
		{/if}
	</div>
</section>

<!-- ─── Project Timeline Modal ────────────────────────────────────────────── -->
{#if selected}
	{@const currentIdx = stageIndex(selected.currentStage)}
	{@const progress = Math.round(((currentIdx + 1) / STAGES.length) * 100)}

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		id="upcoming-backdrop"
		onclick={(e) => { if ((e.target as HTMLElement).id === 'upcoming-backdrop') closeModal(); }}
		onkeydown={() => {}}
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		style="background: rgba(0,0,0,0.82); backdrop-filter: blur(18px);"
	>
		<div class="up-modal-card relative w-full max-w-4xl max-h-[92vh] rounded-3xl flex flex-col animate-modal-spring" style="overflow: clip;">

			<!-- Shimmer bar -->
			<div class="up-modal-shimmer h-1 w-full flex-shrink-0"></div>

			<!-- Close — must be highest z in card context -->
			<button onclick={closeModal}
				class="up-modal-close absolute top-4 right-4 z-[60] w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm transition-all hover:scale-110"
				aria-label="Close">
				<X class="w-4 h-4" />
			</button>

			<!-- ── Hero cover — isolate its stacking context so inner z-indices don't compete with the close button ── -->
			<div class="up-modal-hero relative w-full h-56 flex-shrink-0" style="isolation: isolate;">
				{#if selected.featureImage}
					<img src={selected.featureImage} alt=""
						class="absolute inset-0 w-full h-full object-cover scale-110 pointer-events-none"
						style="filter: blur(24px); opacity: 0.28;" aria-hidden="true" />
					<img src={selected.featureImage} alt={selected.name}
						class="absolute inset-0 w-full h-full object-cover" />
				{:else}
					<div class="absolute inset-0" style="background: linear-gradient(160deg, rgba(124,58,237,0.45) 0%, rgba(2,1,12,1) 100%);"></div>
				{/if}

				<!-- Gradient fade overlay — pointer-events-none so it never blocks clicks -->
				<div class="up-modal-cover-fade absolute inset-0 pointer-events-none" style="z-index: 1;"></div>

				<!-- Project info overlay — also pointer-events-none, just decorative text -->
				<div class="absolute bottom-0 left-0 right-0 p-5 pointer-events-none" style="z-index: 2;">
					<div class="flex items-end justify-between gap-4">
						<div class="flex-1 min-w-0">
							<div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide mb-2 up-card-badge"
								style="background: var(--mt-badge-bg); color: var(--mt-badge-c); border: 1px solid rgba(124,58,237,0.45);">
								<span class="w-1.5 h-1.5 rounded-full animate-pulse" style="background: var(--mt-badge-c);"></span>
								{currentStageLabel(selected.currentStage)}
							</div>
							<h2 class="font-display text-xl sm:text-2xl font-bold leading-tight drop-shadow-lg" style="color: var(--mt-title);">{selected.name}</h2>
						</div>
						<!-- Progress ring -->
						<div class="flex-shrink-0 flex flex-col items-center gap-1">
							<div class="relative w-12 h-12">
								<svg class="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
									<circle cx="24" cy="24" r="18" fill="none" stroke="rgba(124,58,237,0.2)" stroke-width="3.5"/>
									<circle cx="24" cy="24" r="18" fill="none" stroke="url(#ringGrad2)" stroke-width="3.5"
										stroke-linecap="round"
										stroke-dasharray="{2 * Math.PI * 18}"
										stroke-dashoffset="{2 * Math.PI * 18 * (1 - progress / 100)}"
										style="transition: stroke-dashoffset 1s ease; filter: drop-shadow(0 0 3px rgba(124,58,237,0.7));"/>
									<defs>
										<linearGradient id="ringGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
											<stop offset="0%" stop-color="#7c3aed"/>
											<stop offset="100%" stop-color="#c084fc"/>
										</linearGradient>
									</defs>
								</svg>
								<span class="absolute inset-0 flex items-center justify-center text-xs font-bold drop-shadow" style="color: var(--mt-title);">{progress}%</span>
							</div>
							<p class="text-[10px] font-semibold whitespace-nowrap drop-shadow" style="color: var(--mt-muted);">Stage {currentIdx + 1} / {STAGES.length}</p>
						</div>
					</div>
				</div>
			</div>

			<!-- ── Scrollable content ───────────────────────────────────────── -->
			<div class="up-modal-content" style="scrollbar-width: thin; scrollbar-color: rgba(139,92,246,0.4) transparent;">
				<div class="p-6 space-y-6">

					<!-- Description -->
					{#if selected.description}
						<p class="leading-relaxed" style="color: var(--mt-sub);">{selected.description}</p>
					{/if}

					<!-- ── Production Timeline ─────────────────────────────────────── -->
					<div>

						<!-- Header row -->
						<div class="flex items-center gap-3 mb-5">
							<span class="tl-eyebrow">
								<span class="tl-eyebrow-bar"></span>
								Production Timeline
							</span>
							<span class="tl-stage-count" style="color: var(--mt-muted);">{currentIdx + 1} / {STAGES.length} stages</span>
						</div>

						<!-- ── Mini-map rail ──────────────────────────────────────────── -->
						<div class="tl-rail" role="list" aria-label="Stage overview">
							{#each STAGES as stage, idx}
								{@const rPast    = idx < currentIdx}
								{@const rCurrent = idx === currentIdx}
								<div class="tl-rail-item" role="listitem"
									aria-label="{stage.label}: {rPast ? 'done' : rCurrent ? 'in progress' : 'upcoming'}">
									<div class="tl-rail-dot"
										class:tl-dot-past={rPast}
										class:tl-dot-cur={rCurrent}>
										{#if rPast}
											<svg viewBox="0 0 8 8" aria-hidden="true" style="width:8px;height:8px;display:block;">
												<polyline points="1.5,4 3.5,6.5 6.5,2" stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
											</svg>
										{:else if rCurrent}
											<div class="tl-dot-pulse"></div>
										{/if}
									</div>
									{#if idx < STAGES.length - 1}
										<div class="tl-rail-line" class:tl-line-filled={rPast}></div>
									{/if}
								</div>
							{/each}
						</div>

						<!-- ── Zigzag stage rows ─────────────────────────────────────────
							     Gallery strategy: compact fallback — 2-col thumbnail grid for
							     3+ images with "+N more" tile. All images still open via lightbox.
							─────────────────────────────────────────────────────────────────── -->
						<div class="tl-stages">
							{#each STAGES as stage, idx}
								{@const isPast    = idx < currentIdx}
								{@const isCurrent = idx === currentIdx}
								{@const isFuture  = idx > currentIdx}
								{@const stageData = selected[stage.key as StageKey]}
								{@const hasImages = (isPast || isCurrent) && stageData?.images?.length > 0}
								{@const isLeft    = idx % 2 === 0}

								<div class="tl-row"
									class:tl-row-left={isLeft}
									class:tl-row-right={!isLeft}
									class:tl-row-future={isFuture}
									style="--row-delay: {idx * 70}ms;"
								>
									<!-- Spine: centered on desktop, left on mobile -->
									<div class="tl-spine-col">
										{#if idx > 0}
											<div class="tl-conn-seg" class:tl-conn-filled={isPast || isCurrent}></div>
										{:else}
											<div class="tl-conn-spacer"></div>
										{/if}

										<div class="tl-node"
											class:tl-node-past={isPast}
											class:tl-node-cur={isCurrent}
											class:tl-node-fut={isFuture}>
											{#if isCurrent}
												<div class="tl-node-ring"></div>
											{/if}
											<div class="tl-node-disc">
												{#if isPast}
													<svg viewBox="0 0 12 12" class="w-3 h-3" aria-hidden="true">
														<polyline points="2,6 5,9.5 10,2.5" stroke="white" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
													</svg>
												{:else}
													<stage.icon class="w-3 h-3" style="color: {isCurrent ? '#fff' : 'var(--mt-node-fut-icon)'};" aria-hidden="true" />
												{/if}
											</div>
										</div>

										{#if idx < STAGES.length - 1}
											<div class="tl-conn-seg" class:tl-conn-filled={isPast}></div>
										{:else}
											<div class="tl-conn-spacer"></div>
										{/if}
									</div>

									<!-- Content: alternates left/right on desktop, always right on mobile -->
									<div class="tl-content-col">
										<div class="stage-content-wrap"
											class:stage-glass={isCurrent}
											class:stage-past-glass={isPast && (stageData?.description || (stageData?.images?.length ?? 0) > 0)}>

											<!-- Stage header -->
											<div class="tl-card-head">
												<div class="tl-card-meta">
													<span class="tl-stage-num">
														{String(idx + 1).padStart(2, '0')}<span class="tl-stage-num-sep"> / </span>{String(STAGES.length).padStart(2, '0')}
													</span>
													<span class="tl-stage-label"
														class:label-past={isPast}
														class:label-cur={isCurrent}
														class:label-fut={isFuture}>
														{stage.label}
													</span>
												</div>
												<div class="tl-badges">
													{#if isCurrent}
														<span class="badge-inprogress">
															<span class="badge-blink-dot"></span>
															In progress
														</span>
													{/if}
													{#if isPast}
														<span class="badge-done">✓ Done</span>
													{/if}
													{#if isPast && stageData?.completedAt}
														<span class="badge-date" style="color: var(--mt-muted);">
															{new Date(stageData.completedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
														</span>
													{/if}
												</div>
											</div>

											<!-- Description -->
											{#if (isPast || isCurrent) && stageData?.description}
												<p class="tl-desc">{stageData.description}</p>
											{/if}

											<!-- Image gallery (compact: 1-solo, 2-col-pair, 3-col-trio, 4+-2×2-grid) -->
											{#if hasImages}
												{@const imgs = stageData.images}
												<div class="tl-gallery mt-2 mb-1">
													{#if imgs.length === 1}
														<button onclick={() => openLightbox(imgs, 0)}
															class="relative w-full overflow-hidden rounded-xl group/img focus:outline-none"
															style="height: 180px;" aria-label="View image">
															<img src={imgs[0]} alt="" class="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-105" loading="lazy" />
															<div class="tl-img-hover absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity duration-300">
																<ZoomIn class="w-7 h-7 text-white drop-shadow-lg" />
															</div>
															<div class="absolute inset-0 rounded-xl ring-0 group-hover/img:ring-2 transition-all duration-300 pointer-events-none" style="--tw-ring-color: rgba(167,139,250,0.6);"></div>
														</button>

													{:else if imgs.length === 2}
														<div class="grid grid-cols-2 gap-2">
															{#each imgs as imgUrl, imgIdx}
																<button onclick={() => openLightbox(imgs, imgIdx)}
																	class="relative overflow-hidden rounded-xl group/img focus:outline-none"
																	style="height: 130px;" aria-label="View image {imgIdx+1}">
																	<img src={imgUrl} alt="" class="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-105" loading="lazy" />
																	<div class="tl-img-hover absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity duration-300">
																		<ZoomIn class="w-6 h-6 text-white drop-shadow-lg" />
																	</div>
																	<div class="absolute inset-0 rounded-xl ring-0 group-hover/img:ring-2 transition-all duration-300 pointer-events-none" style="--tw-ring-color: rgba(167,139,250,0.6);"></div>
																</button>
															{/each}
														</div>

													{:else if imgs.length === 3}
														<div class="grid grid-cols-3 gap-2">
															{#each imgs as imgUrl, i}
																<button onclick={() => openLightbox(imgs, i)}
																	class="relative overflow-hidden rounded-xl group/img focus:outline-none"
																	style="height: 110px;" aria-label="View image {i+1}">
																	<img src={imgUrl} alt="" class="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-105" loading="lazy" />
																	<div class="tl-img-hover absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity duration-300">
																		<ZoomIn class="w-5 h-5 text-white drop-shadow-lg" />
																	</div>
																	<div class="absolute inset-0 rounded-xl ring-0 group-hover/img:ring-2 transition-all duration-300 pointer-events-none" style="--tw-ring-color: rgba(167,139,250,0.6);"></div>
																</button>
															{/each}
														</div>

													{:else}
														<!-- 4+ images: 2×2 compact grid; last tile shows "+N more" when 5+ -->
														<div class="grid grid-cols-2 gap-2">
															{#each imgs.slice(0, 4) as imgUrl, i}
																<button onclick={() => openLightbox(imgs, i)}
																	class="relative overflow-hidden rounded-xl group/img focus:outline-none"
																	style="height: 110px;" aria-label="View image {i+1}">
																	<img src={imgUrl} alt="" class="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-105" loading="lazy" />
																	{#if i === 3 && imgs.length > 4}
																		<div class="absolute inset-0 rounded-xl" style="background: rgba(60,20,160,0.65);"></div>
																		<div class="absolute inset-0 flex flex-col items-center justify-center">
																			<span class="text-white font-bold text-lg">+{imgs.length - 4}</span>
																			<span class="text-white/70 text-xs mt-0.5">more</span>
																		</div>
																	{:else}
																		<div class="tl-img-hover absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity duration-300">
																			<ZoomIn class="w-5 h-5 text-white drop-shadow-lg" />
																		</div>
																	{/if}
																	<div class="absolute inset-0 rounded-xl ring-0 group-hover/img:ring-2 transition-all duration-300 pointer-events-none" style="--tw-ring-color: rgba(167,139,250,0.6);"></div>
																</button>
															{/each}
														</div>
													{/if}
													<p class="text-[10px] mt-2" style="color: var(--mt-muted);">
														{imgs.length} photo{imgs.length > 1 ? 's' : ''} · click any to expand
													</p>
												</div>
											{/if}

											<!-- Empty state -->
											{#if isCurrent && (!stageData?.images || stageData.images.length === 0) && !stageData?.description}
												<div class="tl-empty">
													<div class="tl-empty-dot"></div>
													<p class="tl-empty-text" style="color: var(--mt-muted);">Updates coming soon…</p>
												</div>
											{/if}

										</div><!-- end stage-content-wrap -->
									</div><!-- end tl-content-col -->
								</div><!-- end tl-row -->
							{/each}
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- ─── Image Lightbox ──────────────────────────────────────────────────── -->
{#if lightboxOpen && lightboxImages.length > 0}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		onclick={closeLightbox}
		onkeydown={() => {}}
		class="fixed inset-0 z-[60] flex items-center justify-center"
		style="background: rgba(0,0,0,0.95); backdrop-filter: blur(20px);"
	>
		<!-- Close -->
		<button
			onclick={closeLightbox}
			class="absolute top-5 right-5 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition-all"
			aria-label="Close"
		><X class="w-5 h-5" /></button>

		<!-- Counter -->
		<div class="absolute top-5 left-1/2 -translate-x-1/2 z-20">
			<span class="font-mono text-xs text-white/40">
				{String(lightboxIndex + 1).padStart(2,'0')} / {String(lightboxImages.length).padStart(2,'0')}
			</span>
		</div>

		<!-- Prev -->
		{#if lightboxImages.length > 1}
			<button
				onclick={(e) => { e.stopPropagation(); lbPrev(); }}
				class="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all hover:scale-110"
				aria-label="Previous"
			><ChevronLeft class="w-5 h-5" /></button>

			<button
				onclick={(e) => { e.stopPropagation(); lbNext(); }}
				class="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all hover:scale-110"
				aria-label="Next"
			><ChevronRight class="w-5 h-5" /></button>
		{/if}

		<!-- Image -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<img
			src={lightboxImages[lightboxIndex]}
			alt=""
			class="max-w-full max-h-[88vh] object-contain rounded-2xl shadow-2xl"
			onclick={(e) => e.stopPropagation()}
			onkeydown={() => {}}
			loading="lazy"
		/>

		<!-- Thumbnail strip -->
		{#if lightboxImages.length > 1}
			<div class="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-2 rounded-2xl scrollbar-hide overflow-x-auto max-w-[90vw]"
				style="background: rgba(0,0,0,0.5); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.08);">
				{#each lightboxImages as img, i}
					<button
						onclick={(e) => { e.stopPropagation(); lightboxIndex = i; }}
						class="flex-shrink-0 w-12 h-9 rounded-lg overflow-hidden transition-all duration-200 {i === lightboxIndex ? 'ring-2 scale-110' : 'opacity-50 hover:opacity-80'}"
						style="--tw-ring-color: rgba(167,139,250,0.8);"
					>
						<img src={img} alt="" class="w-full h-full object-cover" />
					</button>
				{/each}
			</div>
		{/if}
	</div>
{/if}

<style>
	/* ══════════════════════════════════════════════════════════════════════
	   CSS CUSTOM PROPERTIES — defined on .up-modal-card, light mode override
	   ══════════════════════════════════════════════════════════════════════ */
	.up-modal-card {
		--mt-title:           #fff;
		--mt-sub:             rgba(196,181,253,0.7);
		--mt-muted:           rgba(167,139,250,0.5);
		--mt-stage-cur:       #fff;
		--mt-stage-past:      #c4b5fd;
		--mt-stage-fut:       rgba(255,255,255,0.75);
		--mt-badge-bg:        rgba(124,58,237,0.3);
		--mt-badge-c:         #c4b5fd;
		/* timeline tokens */
		--mt-node-glow:       rgba(124,58,237,0.28);
		--mt-node-fut-bg:     rgba(255,255,255,0.04);
		--mt-node-fut-border: rgba(255,255,255,0.1);
		--mt-node-fut-icon:   rgba(255,255,255,0.6);
		--mt-spine-empty:     rgba(255,255,255,0.07);
		--mt-rail-empty-bg:   rgba(255,255,255,0.05);
		--mt-rail-border:     rgba(255,255,255,0.1);

		background: #09071a;
		border: 1px solid rgba(139,92,246,0.25);
		box-shadow: 0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(124,58,237,0.12);
	}
	:global([data-theme="light"]) .up-modal-card {
		--mt-title:           #1e1b4b;
		--mt-sub:             rgba(88,28,135,0.7);
		--mt-muted:           rgba(109,40,217,0.45);
		--mt-stage-cur:       #1e1b4b;
		--mt-stage-past:      #6d28d9;
		--mt-stage-fut:       rgba(109,40,217,0.7);
		--mt-badge-bg:        rgba(124,58,237,0.1);
		--mt-badge-c:         #6d28d9;
		/* timeline tokens — light mode */
		--mt-node-glow:       rgba(124,58,237,0.18);
		--mt-node-fut-bg:     rgba(124,58,237,0.05);
		--mt-node-fut-border: rgba(124,58,237,0.2);
		--mt-node-fut-icon:   rgba(109,40,217,0.6);
		--mt-spine-empty:     rgba(124,58,237,0.12);
		--mt-rail-empty-bg:   rgba(124,58,237,0.05);
		--mt-rail-border:     rgba(124,58,237,0.15);

		background: rgb(var(--sjcu-card));
		border-color: rgba(124,58,237,0.18);
		box-shadow: 0 32px 64px rgba(124,58,237,0.12);
	}

	/* Shimmer top bar */
	.up-modal-shimmer {
		background: linear-gradient(90deg, #6d28d9, #a855f7, #7c3aed, #a855f7, #6d28d9);
		background-size: 300% 100%;
		animation: up-shimmer 4s linear infinite;
	}
	@keyframes up-shimmer {
		0%   { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}

	/* Hero — clip images to rounded bottom, isolate stacking context */
	.up-modal-hero { overflow: hidden; }

	/* Hero cover gradient fade */
	.up-modal-cover-fade {
		background: linear-gradient(to top, #09071a 0%, rgba(9,7,26,0.65) 40%, transparent 75%);
	}
	:global([data-theme="light"]) .up-modal-cover-fade {
		background: linear-gradient(to top, rgb(var(--sjcu-card)) 0%, rgba(124,58,237,0.08) 50%, transparent 80%);
	}

	/* Close button */
	.up-modal-close {
		background: rgba(0,0,0,0.45);
		border: 1px solid rgba(255,255,255,0.15);
		color: #fff;
		transition: background 0.2s ease, border-color 0.2s ease;
	}
	.up-modal-close:hover { background: rgba(255,255,255,0.18); }
	:global([data-theme="light"]) .up-modal-close {
		background: rgba(124,58,237,0.08);
		border-color: rgba(124,58,237,0.25);
		color: rgb(var(--sjcu-accent));
	}
	:global([data-theme="light"]) .up-modal-close:hover { background: rgba(124,58,237,0.18); }

	/* Scrollable content area
	   max-height = 92vh card cap − 14rem hero (h-56) − 0.25rem shimmer (h-1)
	   Using explicit calc avoids the flex max-height / definite-height pitfall */
	.up-modal-content {
		max-height: calc(92vh - 14.25rem);
		overflow-y: auto;
		scrollbar-width: thin;
		scrollbar-color: rgba(139,92,246,0.4) transparent;
	}
	.up-modal-content::-webkit-scrollbar { width: 4px; }
	.up-modal-content::-webkit-scrollbar-track { background: transparent; }
	.up-modal-content::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.4); border-radius: 4px; }

	/* Entry animation */
	@keyframes modal-spring {
		from { opacity: 0; transform: translateY(18px) scale(0.97); }
		to   { opacity: 1; transform: translateY(0) scale(1); }
	}
	.animate-modal-spring {
		animation: modal-spring 0.38s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
	}

	/* ── Active project cards ──────────────────────────────────────────── */
	.upcoming-active-card {
		background: rgba(10, 5, 30, 0.88);
		border: 1px solid rgba(124, 58, 237, 0.2);
	}
	:global([data-theme="light"]) .upcoming-active-card {
		background: rgba(250, 247, 255, 0.95);
		border: 1px solid rgba(124, 58, 237, 0.3);
		box-shadow: 0 4px 20px rgba(124,58,237,0.1), 0 1px 3px rgba(0,0,0,0.06);
	}
	/* Card stage badge — light mode */
	:global([data-theme="light"]) .up-card-badge {
		background: rgba(124,58,237,0.1) !important;
		color: #6d28d9 !important;
		border-color: rgba(124,58,237,0.3) !important;
	}
	/* "Tap to view journey →" — light mode */
	.up-card-cta { color: rgba(167,139,250,0.7); }
	:global([data-theme="light"]) .up-card-cta {
		color: rgba(109,40,217,0.7) !important;
	}
	/* Card no-image bg — light mode */
	:global([data-theme="light"]) .up-card-no-img {
		background: linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(220,210,255,0.85) 100%) !important;
	}
	/* Progress segment dots — light mode inactive */
	:global([data-theme="light"]) .up-seg-inactive {
		background: rgba(124,58,237,0.15) !important;
	}

	/* Active card feature image overlay */
	.upcoming-img-overlay {
		background: linear-gradient(to top, rgba(5,2,20,0.97) 0%, rgba(5,2,20,0.55) 55%, transparent);
	}
	:global([data-theme="light"]) .upcoming-img-overlay {
		background: linear-gradient(to top, rgba(240,232,255,0.97) 0%, rgba(150,80,220,0.2) 55%, transparent);
	}

	/* Released (small grid) card overlay */
	.upcoming-released-overlay {
		background: linear-gradient(to top, rgba(5,2,20,0.92) 0%, transparent 60%);
	}
	:global([data-theme="light"]) .upcoming-released-overlay {
		background: linear-gradient(to top, rgba(240,232,255,0.96) 0%, transparent 60%);
	}
	/* Released card name — dark in light mode since overlay is now light */
	:global([data-theme="light"]) .released-project-name {
		color: #4c1d95 !important;
	}
	:global([data-theme="light"]) .up-released-year {
		color: #7c3aed !important;
	}

	/* ══ New CSS tokens (added to .up-modal-card dark + light override) ═══
	   --mt-node-glow        soft outer ring on current node
	   --mt-node-fut-bg      future node disc fill
	   --mt-node-fut-border  future node border
	   --mt-node-fut-icon    icon color in future nodes
	   --mt-spine-empty      ghosted vertical connector
	   --mt-rail-empty-bg    mini-map future dot fill
	   --mt-rail-border      mini-map borders + connectors
	   ════════════════════════════════════════════════════════════════════ */

	/* ── Stage glass cards (kept, upgraded) ────────────────────────────── */
	.stage-content-wrap { padding-top: 0.125rem; }
	.stage-glass {
		background: linear-gradient(135deg, rgba(124,58,237,0.13) 0%, rgba(124,58,237,0.05) 100%);
		border: 1px solid rgba(124,58,237,0.28);
		border-radius: 0.875rem;
		padding: 0.875rem 1rem 0.875rem 0.875rem;
		margin-bottom: 0.25rem;
		box-shadow: 0 0 0 1px rgba(167,139,250,0.07), inset 0 1px 0 rgba(167,139,250,0.1);
	}
	:global([data-theme="light"]) .stage-glass {
		background: linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(124,58,237,0.02) 100%);
		border-color: rgba(124,58,237,0.2);
		box-shadow: 0 2px 8px rgba(124,58,237,0.06), inset 0 1px 0 rgba(124,58,237,0.08);
	}
	.stage-past-glass {
		background: rgba(124,58,237,0.05);
		border: 1px solid rgba(124,58,237,0.11);
		border-radius: 0.75rem;
		padding: 0.75rem 0.875rem;
		margin-bottom: 0.25rem;
	}
	:global([data-theme="light"]) .stage-past-glass {
		background: rgba(124,58,237,0.03);
		border-color: rgba(124,58,237,0.1);
	}

	/* ── Timeline header ────────────────────────────────────────────────── */
	.tl-eyebrow {
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 0.02em;
		color: var(--mt-title);
		display: flex;
		align-items: center;
		gap: 7px;
	}
	.tl-eyebrow-bar {
		display: inline-block;
		width: 3px;
		height: 13px;
		border-radius: 2px;
		background: linear-gradient(to bottom, #7c3aed, #c084fc);
		flex-shrink: 0;
	}
	.tl-stage-count {
		font-size: 11px;
		margin-left: auto;
	}

	/* ── Mini-map rail ──────────────────────────────────────────────────── */
	.tl-rail {
		display: flex;
		align-items: center;
		margin-bottom: 26px;
		padding: 0 1px;
	}
	.tl-rail-item {
		display: flex;
		align-items: center;
		flex: 1;
		min-width: 0;
	}
	.tl-rail-item:last-child { flex: 0 0 auto; }

	.tl-rail-dot {
		width: 22px;
		height: 22px;
		border-radius: 50%;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--mt-rail-empty-bg);
		border: 1.5px solid var(--mt-rail-border);
		transition: box-shadow 0.3s ease;
	}
	.tl-dot-past {
		background: linear-gradient(135deg, #7c3aed, #a855f7);
		border-color: transparent;
		box-shadow: 0 1px 6px rgba(124,58,237,0.45);
	}
	.tl-dot-cur {
		background: linear-gradient(135deg, #5b21b6, #8b5cf6);
		border-color: rgba(167,139,250,0.7);
		box-shadow: 0 0 0 3px var(--mt-node-glow), 0 0 10px rgba(124,58,237,0.3);
	}
	.tl-dot-pulse {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: white;
		animation: dot-blink 1.6s ease-in-out infinite;
	}
	@keyframes dot-blink {
		0%, 100% { opacity: 1; transform: scale(1); }
		50%       { opacity: 0.35; transform: scale(0.65); }
	}

	.tl-rail-line {
		flex: 1;
		height: 2px;
		background: var(--mt-rail-border);
		margin: 0 3px;
		border-radius: 1px;
		position: relative;
		overflow: hidden;
	}
	.tl-rail-line::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(to right, #7c3aed, #a855f7);
		transform: scaleX(0);
		transform-origin: left;
		transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
	}
	.tl-line-filled::after { transform: scaleX(1); }

	/* ── Zigzag stage rows ──────────────────────────────────────────────── */
	.tl-stages { display: flex; flex-direction: column; }

	/* Mobile: spine left (44px), content right */
	.tl-row {
		display: grid;
		grid-template-columns: 44px 1fr;
	}
	.tl-spine-col { grid-column: 1; }
	.tl-content-col {
		grid-column: 2;
		padding-top: 4px;
		padding-bottom: 24px;
	}
	.tl-row-future { opacity: 0.65; }

	/* Desktop: centered spine, content alternates left ↔ right */
	@media (min-width: 640px) {
		.tl-row { grid-template-columns: 1fr 44px 1fr; }
		.tl-spine-col { grid-column: 2; }
		.tl-row-left  .tl-content-col { grid-column: 1; padding-right: 1rem; padding-left: 0; }
		.tl-row-right .tl-content-col { grid-column: 3; padding-left: 1rem; }
	}

	/* Directional slide-in on desktop only */
	@media (min-width: 640px) and (prefers-reduced-motion: no-preference) {
		.tl-row-left .tl-content-col {
			animation: tl-slide-left 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
			animation-delay: var(--row-delay, 0ms);
		}
		.tl-row-right .tl-content-col {
			animation: tl-slide-right 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
			animation-delay: var(--row-delay, 0ms);
		}
	}
	/* Mobile: simple stagger fade-up for all content cols */
	@media (max-width: 639px) and (prefers-reduced-motion: no-preference) {
		.tl-content-col {
			animation: tl-row-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
			animation-delay: var(--row-delay, 0ms);
		}
	}
	@keyframes tl-row-in {
		from { opacity: 0; transform: translateY(8px); }
		to   { opacity: 1; transform: none; }
	}
	@keyframes tl-slide-left {
		from { opacity: 0; transform: translateX(-14px); }
		to   { opacity: 1; transform: none; }
	}
	@keyframes tl-slide-right {
		from { opacity: 0; transform: translateX(14px); }
		to   { opacity: 1; transform: none; }
	}

	/* ── Spine column ───────────────────────────────────────────────────── */
	.tl-spine-col {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.tl-node {
		position: relative;
		width: 38px;
		height: 38px;
		flex-shrink: 0;
	}
	.tl-node-ring {
		position: absolute;
		inset: -2px;
		border-radius: 50%;
		border: 1.5px solid rgba(124,58,237,0.45);
		animation: tl-glow-ring 2.3s ease-in-out infinite;
	}
	@keyframes tl-glow-ring {
		0%   { transform: scale(0.82); opacity: 0.9; }
		60%  { transform: scale(1.3);  opacity: 0; }
		100% { transform: scale(0.82); opacity: 0.9; }
	}
	.tl-node-disc {
		position: absolute;
		inset: 7px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.tl-node-past .tl-node-disc {
		background: linear-gradient(135deg, #7c3aed, #a855f7);
		box-shadow: 0 2px 10px rgba(124,58,237,0.45);
	}
	.tl-node-cur .tl-node-disc {
		background: linear-gradient(135deg, #5b21b6, #7c3aed);
		box-shadow: 0 0 0 2px rgba(167,139,250,0.45), 0 0 18px rgba(124,58,237,0.5);
	}
	.tl-node-fut .tl-node-disc {
		background: var(--mt-node-fut-bg);
		border: 1.5px solid var(--mt-node-fut-border);
	}

	/* ── Spine connector segments ───────────────────────────────────────── */
	.tl-conn-seg {
		width: 2px;
		flex: 1;
		min-height: 20px;
		border-radius: 1px;
		background: var(--mt-spine-empty);
		position: relative;
		overflow: hidden;
	}
	.tl-conn-seg::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(to bottom, #7c3aed, #c084fc);
		transform: scaleY(0);
		transform-origin: top;
		transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
		transition-delay: var(--row-delay, 0ms);
	}
	.tl-conn-filled::after { transform: scaleY(1); }
	.tl-conn-spacer { flex: 0 0 8px; }

	/* ── Content column (spacing handled in grid rules above) ───────────── */
	.tl-card-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 8px;
		padding-top: 2px;
		margin-bottom: 6px;
	}
	.tl-card-meta {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.tl-stage-num {
		font-family: ui-monospace, 'SF Mono', 'Fira Code', monospace;
		font-size: 9px;
		letter-spacing: 0.08em;
		color: var(--mt-muted);
		user-select: none;
	}
	.tl-stage-num-sep { opacity: 0.45; }
	.tl-stage-label {
		font-size: 13px;
		font-weight: 600;
		line-height: 1.2;
		letter-spacing: -0.01em;
	}
	.label-past { color: var(--mt-stage-past); }
	.label-cur  { color: var(--mt-stage-cur); }
	.label-fut  { color: var(--mt-stage-fut); }

	.tl-badges {
		display: flex;
		align-items: center;
		gap: 5px;
		flex-shrink: 0;
		flex-wrap: wrap;
		justify-content: flex-end;
	}
	.badge-inprogress {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 2px 8px 2px 6px;
		border-radius: 9999px;
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.02em;
		background: var(--mt-badge-bg);
		color: var(--mt-badge-c);
		border: 1px solid rgba(124,58,237,0.38);
	}
	.badge-blink-dot {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: currentColor;
		animation: blink-dot 1.5s ease-in-out infinite;
	}
	@keyframes blink-dot {
		0%, 100% { opacity: 1; }
		50%       { opacity: 0.22; }
	}
	.badge-done {
		display: inline-block;
		padding: 2px 7px;
		border-radius: 9999px;
		font-size: 10px;
		font-weight: 600;
		background: rgba(34,197,94,0.1);
		color: rgba(74,222,128,0.9);
		border: 1px solid rgba(34,197,94,0.22);
	}
	:global([data-theme="light"]) .badge-done {
		color: #16a34a;
		background: rgba(22,163,74,0.08);
		border-color: rgba(22,163,74,0.2);
	}
	.badge-date { font-size: 10px; font-variant-numeric: tabular-nums; }

	.tl-desc {
		font-size: 12px;
		line-height: 1.65;
		color: var(--mt-sub);
		max-width: 52ch;
		margin-bottom: 10px;
	}
	.tl-img-hover { background: rgba(45,8,130,0.38); }
	.tl-empty {
		display: flex;
		align-items: center;
		gap: 7px;
		margin-top: 6px;
	}
	.tl-empty-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #a78bfa;
		flex-shrink: 0;
		animation: blink-dot 1.8s ease-in-out infinite;
	}
	.tl-empty-text { font-size: 12px; }

	/* ── Reduced-motion overrides ───────────────────────────────────────── */
	@media (prefers-reduced-motion: reduce) {
		.tl-content-col  { animation: none !important; opacity: 1; }
		.tl-row-future   { opacity: 0.3; }
		.tl-node-ring    { animation: none; opacity: 0.45; transform: none; }
		.tl-dot-pulse    { animation: none; opacity: 1; }
		.badge-blink-dot { animation: none; }
		.tl-empty-dot    { animation: none; }
		.tl-rail-line::after { transition: none; }
		.tl-conn-seg::after  { transition: none; }
	}

</style>
