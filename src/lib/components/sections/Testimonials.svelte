<script lang="ts">
	import { onMount } from 'svelte';
	import { Star, Quote, X, PenLine } from 'lucide-svelte';
	import Reveal from '$lib/components/ui/Reveal.svelte';
	import FloatingNotes from '$lib/components/ui/FloatingNotes.svelte';
	import { testimonialsApi } from '$lib/services/api.js';
	import type { Testimonial } from '$lib/types/index.js';
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';

	// Characters shown in the card before "Read more" appears
	const TRUNCATE_AT = 160;

	let testimonials = $state<Testimonial[]>([]);
	let loading = $state(true);
	let activeTestimonial = $state<Testimonial | null>(null);

	// Review form state
	let reviewOpen = $state(false);
	let reviewForm = $state({ name: '', designation: '', email: '', message: '', rating: 5 });
	let reviewPhoto = $state<File | null>(null);
	let reviewPhotoPreview = $state('');
	let reviewSubmitting = $state(false);
	let reviewSuccess = $state(false);
	let reviewError = $state('');

	const ratingEmoji: Record<number, string> = { 1: '😞', 2: '😕', 3: '😐', 4: '😊', 5: '😄' };

	onMount(async () => {
		try {
			const res = await testimonialsApi.getAll();
			testimonials = res.data.data.testimonials || [];
		} catch {
			testimonials = [];
		} finally {
			loading = false;
		}
	});

	// Only duplicate for seamless loop when cards overflow the container
	let needsLoop = $state(false);
	let trackEl = $state<HTMLDivElement | undefined>(undefined);
	let outerEl = $state<HTMLDivElement | undefined>(undefined);

	const displayList = $derived(needsLoop ? [...testimonials, ...testimonials] : testimonials);

	// After testimonials load + DOM paints, check if single-copy overflows
	$effect(() => {
		if (!testimonials.length || !trackEl || !outerEl) return;
		requestAnimationFrame(() => {
			if (trackEl && outerEl) {
				needsLoop = trackEl.scrollWidth > outerEl.clientWidth;
			}
		});
	});

	// ~7s per card visible, minimum 24s total loop duration
	const duration = $derived(Math.max(testimonials.length * 7, 24));

	function getInitials(name: string): string {
		return name
			.split(' ')
			.slice(0, 2)
			.map(w => w[0] ?? '')
			.join('')
			.toUpperCase();
	}

	// Scroll lock: position:fixed is the only cross-browser reliable method.
	// overflow:hidden alone doesn't work in many SvelteKit/Chrome/Safari combos.
	let _lockScrollY = 0;
	function lockScroll() {
		_lockScrollY = window.scrollY;
		document.body.style.position = 'fixed';
		document.body.style.top = `-${_lockScrollY}px`;
		document.body.style.width = '100%';
		document.body.style.overflow = 'hidden';
	}
	function unlockScroll() {
		document.body.style.position = '';
		document.body.style.top = '';
		document.body.style.width = '';
		document.body.style.overflow = '';
		window.scrollTo(0, _lockScrollY);
	}

	function openModal(t: Testimonial) {
		activeTestimonial = t;
		lockScroll();
	}

	function closeModal() {
		activeTestimonial = null;
		if (!reviewOpen) unlockScroll();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			if (reviewOpen) closeReview();
			else if (activeTestimonial) closeModal();
		}
	}

	function openReview() {
		reviewOpen = true;
		lockScroll();
		reviewSuccess = false;
		reviewError = '';
		reviewForm = { name: '', designation: '', email: '', message: '', rating: 5 };
		reviewPhoto = null;
		reviewPhotoPreview = '';
	}

	function closeReview() {
		reviewOpen = false;
		if (!activeTestimonial) unlockScroll();
	}

	function handleReviewPhoto(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (file) {
			reviewPhoto = file;
			reviewPhotoPreview = URL.createObjectURL(file);
		}
	}

	async function handleReviewSubmit(e: SubmitEvent) {
		e.preventDefault();
		reviewSubmitting = true;
		reviewError = '';
		try {
			const fd = new FormData();
			fd.append('name', reviewForm.name);
			fd.append('designation', reviewForm.designation);
			fd.append('email', reviewForm.email);
			fd.append('message', reviewForm.message);
			fd.append('rating', String(reviewForm.rating));
			if (reviewPhoto) fd.append('photo', reviewPhoto);
			await testimonialsApi.submit(fd);
			reviewSuccess = true;
		} catch {
			reviewError = 'Something went wrong. Please try again.';
		} finally {
			reviewSubmitting = false;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<section id="testimonials" class="py-24 md:py-32 bg-sjcu-navy-2 relative overflow-hidden">
	<FloatingNotes opacity={0.2} size="md" speed="slow" />
	<div class="absolute inset-0 bg-purple-glow opacity-20 pointer-events-none" aria-hidden="true"></div>

	<div class="max-w-7xl mx-auto px-6">
		<Reveal class="text-center mb-16">
			<span class="section-tag justify-center">Audience Echoes</span>
			<h2 class="section-title mt-2 mb-4">What People <span class="purple-gradient-text">Say</span></h2>
			<p class="section-subtitle mx-auto">Voices from our community and audiences who have experienced our music.</p>
		</Reveal>
	</div>

	{#if loading}
		<LoadingSpinner size="lg" class="py-20" />

	{:else if testimonials.length === 0}
		<div class="text-center py-20 text-sjcu-text-muted max-w-7xl mx-auto px-6">
			<Quote class="w-16 h-16 mx-auto mb-4 opacity-30" />
			<p>No testimonials yet. Be the first to share your experience!</p>
		</div>

	{:else}
		<!-- Marquee wall ─────────────────────────────────────────────────────── -->
		<div
			bind:this={outerEl}
			class="marquee-outer"
			class:marquee-centered={!needsLoop}
			role="region"
			aria-label="Audience testimonials"
		>
			<div
				bind:this={trackEl}
				class="marquee-track"
				style="--duration: {duration}s; animation-play-state: {needsLoop ? 'running' : 'paused'};"
			>
				{#each displayList as t, i}
					{@const isLong = t.message.length > TRUNCATE_AT}
					{@const preview = isLong ? t.message.slice(0, TRUNCATE_AT).trimEnd() + '…' : t.message}

					<div class="card-slot" aria-hidden={needsLoop && i >= testimonials.length ? 'true' : undefined}>
						<figure class="testimonial-card glass-card-hover relative w-[300px] h-[360px] flex-shrink-0 text-center flex flex-col pt-12 pb-6 px-6 rounded-2xl">

							<!-- Floating avatar ───────────────────────────────────────── -->
							<div class="avatar-anchor" aria-hidden="true">
								<div class="avatar-ring">
									{#if t.photo}
										<img src={t.photo} alt={t.name} class="w-full h-full object-cover rounded-full" />
									{:else}
										<div
											class="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-xl"
											style="background: linear-gradient(135deg, #7c3aed, #a855f7);"
										>
											{getInitials(t.name)}
										</div>
									{/if}
								</div>
							</div>

							<!-- Name / Designation ──────────────────────────────────── -->
							<div class="mb-3">
								<p class="text-sjcu-text-primary text-sm font-semibold leading-tight">{t.name}</p>
								{#if t.designation}
									<p class="text-sjcu-text-muted text-xs mt-0.5">{t.designation}</p>
								{/if}
							</div>

							<!-- Quote (always truncated to keep height equal) ──────────── -->
							<blockquote class="flex-1 overflow-hidden mb-3">
								<Quote class="w-5 h-5 mx-auto mb-2 opacity-40" style="color: #a78bfa;" aria-hidden="true" />
								<p class="card-quote text-sjcu-text-secondary text-sm leading-relaxed">"{preview}"</p>
							</blockquote>

							<!-- Read more / View — every card gets one ──────────────────── -->
							<button
								type="button"
								class="read-more-btn"
								onclick={() => openModal(t)}
								aria-label="{isLong ? 'Read full' : 'View'} testimonial from {t.name}"
							>
								{isLong ? 'Read more' : 'View'}
							</button>

							<!-- Stars ────────────────────────────────────────────────── -->
							<figcaption class="border-t border-sjcu-border pt-3 mt-3">
								<div class="flex items-center justify-center gap-0.5" aria-label="{t.rating} out of 5 stars">
									{#each Array.from({ length: 5 }) as _, si}
										<Star class="w-3.5 h-3.5 {si < t.rating ? 'text-amber-400 fill-amber-400' : 'text-sjcu-border'}" />
									{/each}
								</div>
							</figcaption>

						</figure>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Review Us CTA -->
	<div class="text-center mt-16 max-w-7xl mx-auto px-6">
		<p class="text-sjcu-text-muted text-sm mb-4">Enjoyed our music? Share your experience.</p>
		<button onclick={openReview} class="btn-primary inline-flex items-center gap-2">
			<PenLine class="w-4 h-4" />
			Write a Review
		</button>
	</div>
</section>

<!-- ── Testimonial view modal ──────────────────────────────────────────────── -->
{#if activeTestimonial}
	{@const t = activeTestimonial}
	<div
		class="fixed inset-0 z-50 flex items-start justify-center p-3 pt-4 lg:items-center lg:p-4"
		style="background: rgba(0,0,0,0.85); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);"
		onclick={e => { if ((e.target as HTMLElement).id === 'tm-backdrop') closeModal(); }}
		onkeydown={() => {}}
		id="tm-backdrop"
		role="dialog"
		aria-modal="true"
		aria-label="Full testimonial from {t.name}"
	>
		<div
			class="tm-card relative w-full max-w-2xl max-h-[94vh] rounded-3xl overflow-hidden flex flex-col lg:flex-row animate-tm-spring"
			onclick={e => e.stopPropagation()}
			onkeydown={() => {}}
			role="presentation"
		>
			<!-- Top (mobile/tablet) / Left (desktop) — photo panel -->
			<div class="tm-photo-col flex-shrink-0 relative">
				{#if t.photo}
					<img src={t.photo} alt={t.name} class="w-full h-full object-cover object-[center_15%]" />
					<!-- Bottom fade on mobile (top→bottom layout) -->
					<div class="absolute inset-0 lg:hidden" style="background: linear-gradient(to bottom, transparent 55%, var(--tm-photo-fade-b) 100%);"></div>
					<!-- Right-edge fade on desktop (left→right layout) -->
					<div class="absolute inset-0 hidden lg:block" style="background: linear-gradient(to right, transparent 55%, var(--tm-photo-fade-t) 100%);"></div>
					<!-- Bottom-edge fade always -->
					<div class="absolute inset-0" style="background: linear-gradient(to top, var(--tm-photo-fade-b) 0%, transparent 40%);"></div>
				{:else}
					<div class="w-full h-full flex items-center justify-center" style="background: var(--tm-bg);">
						<div class="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl" style="background:linear-gradient(135deg,#7c3aed,#a855f7);box-shadow:0 0 30px rgba(124,58,237,0.5);">
							{getInitials(t.name)}
						</div>
					</div>
				{/if}
			</div>

			<!-- Bottom (mobile/tablet) / Right (desktop) — header + scrollable content -->
			<div class="flex-1 flex flex-col min-h-0">
				<!-- Shimmer accent line at top -->
				<div class="h-1 w-full flex-shrink-0 tm-shimmer-bar"></div>

				<!-- Fixed name/designation header -->
				<div class="px-7 pt-6 pb-4 flex-shrink-0">
					<p class="font-bold text-xl leading-tight" style="color: var(--tm-name);">{t.name}</p>
					{#if t.designation}
						<p class="text-sm mt-1" style="color: var(--tm-role);">{t.designation}</p>
					{/if}
				</div>

				<!-- Scrollable body — flex-1 + min-h-0 + overscroll-behavior:contain -->
				<div class="flex-1 overflow-y-auto min-h-0 px-7 pb-7" style="scrollbar-width: thin; scrollbar-color: rgba(124,58,237,0.4) transparent; overscroll-behavior: contain;">
					<Quote class="w-6 h-6 mb-3" style="color: var(--tm-quote-c);" aria-hidden="true" />
					<p class="text-base leading-relaxed mb-6" style="color: var(--tm-text);">"{t.message}"</p>
					<div class="flex items-center gap-1 pt-4" style="border-top: 1px solid var(--tm-divider);" aria-label="{t.rating} out of 5 stars">
						{#each Array.from({ length: 5 }) as _, si}
							<Star class="w-4.5 h-4.5 {si < t.rating ? 'text-amber-400 fill-amber-400' : 'text-sjcu-border'}" />
						{/each}
						<span class="text-xs ml-1.5" style="color: var(--tm-subtext);">{t.rating} / 5</span>
					</div>
				</div>
			</div>

			<!-- Close button -->
			<button type="button" class="tm-close absolute top-4 right-4 z-20 w-9 h-9 rounded-full flex items-center justify-center transition-all" onclick={closeModal} aria-label="Close">
				<X class="w-4 h-4" />
			</button>
		</div>
	</div>
{/if}

<!-- ── Review Us modal ────────────────────────────────────────────────────── -->
{#if reviewOpen}
	<!-- Layer 1: blur backdrop — no scroll, no pointer events -->
	<div class="fixed inset-0 z-[49] pointer-events-none" style="background: rgba(0,0,0,0.82); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);"></div>
	<!-- Layer 2: clean scroll container — no filters so mouse wheel works -->
	<div
		class="review-overlay"
		onclick={e => { if (e.target === e.currentTarget) closeReview(); }}
		onkeydown={() => {}}
		role="dialog"
		aria-modal="true"
		aria-label="Write a review"
	>
		<div class="review-outer-center"
			onclick={e => { if (e.target === e.currentTarget) closeReview(); }}
			onkeydown={() => {}}
			role="presentation"
		>
			<div
				class="review-card animate-tm-spring"
				onclick={e => e.stopPropagation()}
				onkeydown={() => {}}
				role="presentation"
			>
				<button
					type="button"
					class="review-close"
					onclick={closeReview}
					aria-label="Close"
				>
					<X class="w-4 h-4" />
				</button>

				{#if reviewSuccess}
					<div class="review-scroll-body px-8 py-12 text-center">
						<div class="text-6xl mb-5">🎉</div>
						<h3 class="text-white font-bold text-xl mb-3">Thank you!</h3>
						<p class="text-sjcu-text-secondary text-sm leading-relaxed mb-8">
							Your review has been received and will appear on our website once it's been approved by our team.
						</p>
						<button onclick={closeReview} class="btn-primary">Close</button>
					</div>
				{:else}
					<!-- Fixed header outside scroll body -->
					<div class="px-8 pt-8 pb-4 flex-shrink-0 border-b border-sjcu-border/40">
						<h3 class="text-white font-bold text-xl mb-1">Write a Review</h3>
						<p class="text-sjcu-text-muted text-sm">Share your experience with St. John's Carol Union</p>
					</div>
					<!-- Scrollable form body -->
					<div class="review-scroll-body px-8 py-6">

						<form onsubmit={handleReviewSubmit} class="space-y-5">
							<div>
								<label class="block text-sjcu-text-secondary text-sm mb-1.5" for="rv-name">Name *</label>
								<input id="rv-name" bind:value={reviewForm.name} class="admin-input" placeholder="Your full name" required />
							</div>

							<div>
								<label class="block text-sjcu-text-secondary text-sm mb-1.5" for="rv-designation">Designation <span class="text-sjcu-text-muted">(optional)</span></label>
								<input id="rv-designation" bind:value={reviewForm.designation} class="admin-input" placeholder="e.g. Choir Member, Audience, Pastor" />
							</div>

							<div>
								<label class="block text-sjcu-text-secondary text-sm mb-1.5" for="rv-email">Email <span class="text-sjcu-text-muted">(optional)</span></label>
								<input id="rv-email" type="email" bind:value={reviewForm.email} class="admin-input" placeholder="Optional — for confirmation" />
							</div>

							<div>
								<label class="block text-sjcu-text-secondary text-sm mb-1.5">Photo <span class="text-sjcu-text-muted">(optional)</span></label>
								<div class="flex items-center gap-4">
									{#if reviewPhotoPreview}
										<img src={reviewPhotoPreview} alt="Preview" class="w-[72px] h-[72px] rounded-full object-cover border-2 border-sjcu-purple/40 flex-shrink-0" />
									{:else}
										<div class="w-[72px] h-[72px] rounded-full bg-sjcu-purple/10 border border-sjcu-border flex items-center justify-center flex-shrink-0">
											<span class="text-sjcu-text-muted text-xs text-center leading-tight px-1">No photo</span>
										</div>
									{/if}
									<input type="file" accept="image/*" onchange={handleReviewPhoto} class="text-sjcu-text-secondary text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-sjcu-purple/20 file:text-sjcu-accent hover:file:bg-sjcu-purple/30 file:cursor-pointer" />
								</div>
							</div>

							<div>
								<label class="block text-sjcu-text-secondary text-sm mb-3">Rating *</label>
								<div class="flex flex-col items-center gap-3">
									<div class="emoji-display" aria-hidden="true">{ratingEmoji[reviewForm.rating]}</div>
									<div class="flex gap-1" role="group" aria-label="Select rating">
										{#each [1, 2, 3, 4, 5] as star}
											<button type="button" class="star-btn" onclick={() => { reviewForm.rating = star; }} aria-label="{star} star{star > 1 ? 's' : ''}">
												<Star class="w-7 h-7 {star <= reviewForm.rating ? 'text-amber-400 fill-amber-400' : 'text-sjcu-border'}" />
											</button>
										{/each}
									</div>
								</div>
							</div>

							<div>
								<label class="block text-sjcu-text-secondary text-sm mb-1.5" for="rv-message">Message *</label>
								<textarea id="rv-message" bind:value={reviewForm.message} rows={4} class="admin-input resize-none" placeholder="Tell us about your experience..." required></textarea>
							</div>

							{#if reviewError}
								<p class="text-red-400 text-sm">{reviewError}</p>
							{/if}

							<button type="submit" class="btn-primary w-full" disabled={reviewSubmitting}>
								{reviewSubmitting ? 'Submitting…' : 'Submit Review'}
							</button>
						</form>
					</div><!-- /review-scroll-body -->
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	/* ── Marquee outer ──────────────────────────────────────────────────────── */
	.marquee-outer {
		overflow: hidden;
		padding-top: 2.75rem;
		padding-bottom: 1.5rem;
		-webkit-mask-image: linear-gradient(
			to right,
			transparent 0%,
			black 7%,
			black 93%,
			transparent 100%
		);
		mask-image: linear-gradient(
			to right,
			transparent 0%,
			black 7%,
			black 93%,
			transparent 100%
		);
	}

	/* ── Scrolling track ────────────────────────────────────────────────────── */
	.marquee-track {
		display: flex;
		width: max-content;
		animation: marquee-scroll var(--duration, 30s) linear infinite;
	}
	.marquee-track:hover {
		animation-play-state: paused;
	}

	/* Center cards when they don't overflow (no loop needed) */
	.marquee-centered {
		display: flex;
		justify-content: center;
		-webkit-mask-image: none;
		mask-image: none;
	}
	.marquee-centered .marquee-track {
		width: auto;
		flex-wrap: wrap;
		justify-content: center;
	}

	.card-slot {
		padding: 0 0.75rem;
	}

	/* ── Floating avatar ────────────────────────────────────────────────────── */
	.avatar-anchor {
		position: absolute;
		top: -2.5rem;
		left: 50%;
		transform: translateX(-50%);
	}
	.avatar-ring {
		width: 72px;
		height: 72px;
		border-radius: 50%;
		border: 2px solid rgba(124, 58, 237, 0.7);
		box-shadow:
			0 0 0 4px rgba(124, 58, 237, 0.12),
			0 0 20px rgba(124, 58, 237, 0.5);
		overflow: hidden;
		background: rgb(var(--sjcu-dark));
	}

	/* ── Quote clamped inside fixed-height card ────────────────────────────── */
	.card-quote {
		display: -webkit-box;
		-webkit-line-clamp: 4;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	/* ── Read more / View button ────────────────────────────────────────────── */
	.read-more-btn {
		display: inline-block;
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		color: #a78bfa;
		background: rgba(124, 58, 237, 0.1);
		border: 1px solid rgba(124, 58, 237, 0.3);
		border-radius: 999px;
		padding: 0.25rem 0.875rem;
		margin-bottom: 0.5rem;
		cursor: pointer;
		transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
	}
	.read-more-btn:hover {
		background: rgba(124, 58, 237, 0.22);
		border-color: rgba(124, 58, 237, 0.6);
		color: #c4b5fd;
	}

	/* ── Testimonial view modal ─────────────────────────────────────────────── */
	.tm-card {
		--tm-bg:          #0d0d23;
		--tm-text:        #e2e8f0;
		--tm-subtext:     #a0aec0;
		--tm-name:        #fff;
		--tm-role:        #c4b5fd;
		--tm-border:      rgba(124, 58, 237, 0.28);
		--tm-close-bg:    rgba(255, 255, 255, 0.1);
		--tm-close-hov:   rgba(124, 58, 237, 0.3);
		--tm-close-bd:    rgba(255, 255, 255, 0.15);
		--tm-close-c:     #fff;
		--tm-quote-c:     rgba(167, 139, 250, 0.4);
		--tm-divider:     rgba(255, 255, 255, 0.08);
		--tm-photo-fade-b: rgba(13,13,35,0.95);
		--tm-photo-fade-t: rgba(13,13,35,0.95);
		background: var(--tm-bg);
		border: 1px solid var(--tm-border);
		box-shadow: 0 32px 80px rgba(0, 0, 0, 0.7), 0 0 60px rgba(124, 58, 237, 0.12);
	}
	:global([data-theme="light"]) .tm-card {
		--tm-bg:          #f5f3ff;
		--tm-text:        #3b3063;
		--tm-subtext:     #6b7280;
		--tm-name:        #1e1b4b;
		--tm-role:        #7c3aed;
		--tm-border:      rgba(124, 58, 237, 0.22);
		--tm-close-bg:    rgba(109, 40, 217, 0.1);
		--tm-close-hov:   rgba(109, 40, 217, 0.2);
		--tm-close-bd:    rgba(109, 40, 217, 0.25);
		--tm-close-c:     #4c1d95;
		--tm-quote-c:     rgba(124, 58, 237, 0.35);
		--tm-divider:     rgba(124, 58, 237, 0.15);
		--tm-photo-fade-b: rgba(245,243,255,0.97);
		--tm-photo-fade-t: rgba(245,243,255,0.97);
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.15), 0 0 40px rgba(124, 58, 237, 0.08);
	}
	/* Mobile/tablet: full width, fixed height at top */
	.tm-photo-col {
		width: 100%;
		height: min(320px, 40vh);
		flex-shrink: 0;
		overflow: hidden;
		border-radius: 1.5rem 1.5rem 0 0;
	}
	/* Desktop: fixed-width column on the left */
	@media (min-width: 1024px) {
		.tm-photo-col {
			width: 220px;
			min-width: 220px;
			height: auto;
			max-height: 320px;
			align-self: flex-start;
			border-radius: 1.5rem 0 0 1.5rem;
		}
	}
	.tm-shimmer-bar {
		background: linear-gradient(90deg, #6d28d9, #a855f7, #3b82f6, #a855f7, #6d28d9);
		background-size: 300% 100%;
		animation: shimmer 4s linear infinite;
	}
	@keyframes shimmer { to { background-position: -300% 0; } }

	.tm-cover-fade {
		background: linear-gradient(to top, var(--tm-photo-fade-b) 0%, rgba(13,13,35,0.2) 60%, transparent 100%);
	}
	.tm-close {
		background: var(--tm-close-bg);
		border: 1px solid var(--tm-close-bd);
		color: var(--tm-close-c);
		cursor: pointer;
	}
	.tm-close:hover {
		background: var(--tm-close-hov);
		border-color: rgba(124, 58, 237, 0.5);
	}
	.animate-tm-spring {
		animation: tm-spring 0.32s cubic-bezier(0.34, 1.4, 0.64, 1);
	}
	@keyframes tm-spring {
		from { opacity: 0; transform: scale(0.92) translateY(20px); }
		to   { opacity: 1; transform: scale(1) translateY(0); }
	}

	/* ── Review form modal ───────────────────────────────────────────────────── */
	.review-overlay {
		position: fixed;
		inset: 0;
		z-index: 50;
		overflow-y: auto;
		background: rgba(0, 0, 0, 0.85);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
	}
	.review-outer-center {
		display: flex;
		min-height: 100%;
		align-items: center;
		justify-content: center;
		padding: 2rem 1rem;
	}
	.review-card {
		position: relative;
		width: 100%;
		max-width: 32rem;
		max-height: 92vh;
		background: #0d0d23;
		border: 1px solid rgba(124, 58, 237, 0.3);
		border-radius: 2rem;
		box-shadow: 0 32px 80px rgba(0, 0, 0, 0.7), 0 0 60px rgba(124, 58, 237, 0.12);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}
	.review-scroll-body {
		flex: 1;
		overflow-y: auto;
		min-height: 0;
		overscroll-behavior: contain;
		scrollbar-width: thin;
		scrollbar-color: rgba(124, 58, 237, 0.4) transparent;
	}
	.review-scroll-body::-webkit-scrollbar { width: 4px; }
	.review-scroll-body::-webkit-scrollbar-track { background: transparent; }
	.review-scroll-body::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.4); border-radius: 2px; }
	.review-close {
		position: absolute;
		top: 1rem;
		right: 1rem;
		z-index: 10;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 9999px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.12);
		color: #fff;
		cursor: pointer;
		transition: background 0.2s, border-color 0.2s;
	}
	.review-close:hover {
		background: rgba(124, 58, 237, 0.3);
		border-color: rgba(124, 58, 237, 0.5);
	}

	/* Emoji mood indicator */
	.emoji-display {
		font-size: 3.5rem;
		line-height: 1;
		animation: emoji-bounce 0.3s cubic-bezier(0.34, 1.6, 0.64, 1);
	}
	@keyframes emoji-bounce {
		from { transform: scale(0.7); }
		to   { transform: scale(1); }
	}

	/* Star buttons */
	.star-btn {
		cursor: pointer;
		background: none;
		border: none;
		padding: 0.2rem;
		transition: transform 0.15s ease;
		line-height: 1;
	}
	.star-btn:hover {
		transform: scale(1.2);
	}

	/* ── Keyframe: marquee ──────────────────────────────────────────────────── */
	@keyframes marquee-scroll {
		from { transform: translateX(0); }
		to   { transform: translateX(-50%); }
	}

	/* ── Reduced motion ─────────────────────────────────────────────────────── */
	@media (prefers-reduced-motion: reduce) {
		.marquee-outer {
			overflow-x: auto;
			padding-bottom: 1rem;
			-webkit-mask-image: none;
			mask-image: none;
		}
		.marquee-track {
			animation: none;
			width: auto;
		}
		.animate-tm-spring {
			animation: none;
		}
		.emoji-display {
			animation: none;
		}
	}
</style>
