<script lang="ts">
	import { onMount } from 'svelte';
	import { partnersApi } from '$lib/services/api.js';
	import type { Partner } from '$lib/types/index.js';
	import { Mail, Phone, Globe, Building2, MapPin, ExternalLink, ArrowUpRight } from 'lucide-svelte';
	import FloatingNotes from '$lib/components/ui/FloatingNotes.svelte';
	import { tilt } from '$lib/actions/tilt.js';

	let partners = $state<Partner[]>([]);
	let loading = $state(true);
	let selected = $state<Partner | null>(null);

	function openModal(p: Partner) { selected = p; document.body.style.overflow = 'hidden'; }
	function closeModal() { selected = null; document.body.style.overflow = ''; }
	function handleBackdrop(e: MouseEvent) {
		if ((e.target as HTMLElement).id === 'partner-backdrop') closeModal();
	}
	function handleKeydown(e: KeyboardEvent) { if (e.key === 'Escape') closeModal(); }

	onMount(() => {
		(async () => {
			try {
				const res = await partnersApi.getAll();
				partners = res.data.data.partners || [];
			} catch {
				partners = [];
			} finally {
				loading = false;
			}

			const { gsap } = await import('gsap');
			const { ScrollTrigger } = await import('gsap/ScrollTrigger');
			gsap.registerPlugin(ScrollTrigger);
			gsap.fromTo('#partners .partner-card', {
				opacity: 0, y: 50, scale: 0.95
			}, {
				opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.12, ease: 'power2.out',
				scrollTrigger: { trigger: '#partners', start: 'top 75%' }
			});
		})();

		return () => { document.body.style.overflow = ''; };
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<section id="partners" class="py-24 md:py-32 bg-sjcu-navy-2 relative overflow-hidden">
	<FloatingNotes opacity={0.12} size="md" speed="slow" />
	<div class="absolute inset-0 bg-purple-glow pointer-events-none opacity-20"></div>

	<!-- decorative lines -->
	<div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sjcu-purple/40 to-transparent pointer-events-none"></div>
	<div class="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sjcu-purple/40 to-transparent pointer-events-none"></div>

	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

		<!-- section header -->
		<div class="text-center mb-16">
			<span class="section-tag justify-center">Collaborations</span>
			<h2 class="section-title mt-2 mb-4">
				Associated <span class="purple-gradient-text">Partners</span>
			</h2>
			<p class="section-subtitle mx-auto">
				Organisations and ministries walking alongside us — united by faith, music, and purpose.
			</p>
		</div>

		{#if loading}
			<div class="flex justify-center py-20">
				<div class="w-12 h-12 border-2 border-sjcu-purple border-t-transparent rounded-full animate-spin"></div>
			</div>
		{:else if partners.length === 0}
			<div class="text-center py-16">
				<div class="w-20 h-20 rounded-3xl bg-sjcu-card/60 border border-sjcu-border/40 flex items-center justify-center mx-auto mb-4">
					<Building2 class="w-9 h-9 text-sjcu-text-muted" />
				</div>
				<p class="text-sjcu-text-muted text-sm">No partners added yet.</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
				{#each partners as partner}
					<button
						use:tilt={{ max: 7, liftY: 5 }}
						class="partner-card card-ripple card-ring-hover group relative flex flex-col text-left rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl bg-sjcu-card/60 border border-sjcu-border/40"
						onclick={() => openModal(partner)}
					>
						<!-- animated border glow on hover -->
						<div class="card-glow-border absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

						<!-- logo area -->
						<div class="img-scan relative w-full h-44 flex items-center justify-center overflow-hidden bg-sjcu-card-2">
							<!-- soft grid pattern -->
							<div class="absolute inset-0 opacity-10" style="background-image: radial-gradient(circle, rgba(139,92,246,0.4) 1px, transparent 1px); background-size: 24px 24px;"></div>

							{#if partner.logo}
								<img
									src={partner.logo}
									alt={partner.name}
									class="relative z-10 max-w-[160px] max-h-[100px] object-contain drop-shadow-lg transition-transform duration-500 group-hover:scale-105"
								/>
							{:else}
								<div class="relative z-10 w-20 h-20 rounded-2xl bg-sjcu-purple/20 border border-sjcu-purple/30 flex items-center justify-center">
									<Building2 class="w-9 h-9 text-sjcu-accent" />
								</div>
							{/if}

							<!-- top-right arrow badge -->
							<div class="absolute top-3 right-3 w-8 h-8 rounded-xl bg-black/30 backdrop-blur-sm border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
								<ArrowUpRight class="w-4 h-4 text-white" />
							</div>
						</div>

						<!-- content -->
						<div class="flex-1 flex flex-col p-6 gap-3">
							<div>
								<h3 class="font-display text-lg font-bold text-sjcu-text-primary leading-tight group-hover:text-sjcu-accent transition-colors duration-300">
									{partner.name}
								</h3>
								{#if partner.description}
									<p class="text-sjcu-text-muted text-sm mt-2 leading-relaxed line-clamp-3">
										{partner.description}
									</p>
								{/if}
							</div>

							<!-- contact pills -->
							{#if partner.email || partner.phone || partner.website || partner.address}
								<div class="mt-auto pt-4 border-t border-sjcu-border/30 flex flex-wrap gap-2">
									{#if partner.email}
										<span class="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-sjcu-text-muted bg-sjcu-card border border-sjcu-border/50">
											<Mail class="w-3 h-3 text-sjcu-accent flex-shrink-0" />
											<span class="truncate max-w-[120px]">{partner.email}</span>
										</span>
									{/if}
									{#if partner.phone}
										<span class="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-sjcu-text-muted bg-sjcu-card border border-sjcu-border/50">
											<Phone class="w-3 h-3 text-sjcu-accent flex-shrink-0" />
											{partner.phone}
										</span>
									{/if}
									{#if partner.website}
										<span class="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-sjcu-text-muted bg-sjcu-card border border-sjcu-border/50">
											<Globe class="w-3 h-3 text-sjcu-accent flex-shrink-0" />
											<span class="truncate max-w-[120px]">{partner.website.replace(/^https?:\/\//, '')}</span>
										</span>
									{/if}
									{#if partner.address}
										<span class="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-sjcu-text-muted bg-sjcu-card border border-sjcu-border/50">
											<MapPin class="w-3 h-3 text-sjcu-accent flex-shrink-0" />
											<span class="truncate max-w-[120px]">{partner.address}</span>
										</span>
									{/if}
								</div>
							{/if}
						</div>
					</button>
				{/each}
			</div>
		{/if}
	</div>
</section>

<!-- Partner detail modal -->
{#if selected}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		id="partner-backdrop"
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		style="background: rgba(0,0,0,0.8); backdrop-filter: blur(16px);"
		onclick={handleBackdrop}
	>
		<div class="partner-modal-card relative w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl animate-modal-spring">

			<!-- glowing top bar -->
			<div class="h-1 w-full" style="background: linear-gradient(90deg, #6d28d9, #a855f7, #7c3aed, #a855f7, #6d28d9); background-size: 200% 100%; animation: shimmer 3s linear infinite;"></div>

			<!-- close -->
			<button
				onclick={closeModal}
				class="partner-modal-close icon-bounce absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-all z-10"
			>✕</button>

			<!-- hero: blurred logo background + centered logo -->
			<div class="relative h-48 flex items-center justify-center overflow-hidden"
				style="background: linear-gradient(135deg, rgba(109,40,217,0.15) 0%, rgba(168,85,247,0.08) 100%);">
				{#if selected.logo}
					<!-- blurred bg -->
					<img src={selected.logo} alt="" class="absolute inset-0 w-full h-full object-cover opacity-10 blur-2xl scale-150" aria-hidden="true" />
					<img src={selected.logo} alt={selected.name} class="relative z-10 max-w-[180px] max-h-[110px] object-contain drop-shadow-2xl" />
				{:else}
					<div class="w-24 h-24 rounded-2xl bg-sjcu-purple/20 border border-sjcu-purple/30 flex items-center justify-center">
						<Building2 class="w-10 h-10 text-sjcu-accent" />
					</div>
				{/if}

				<!-- bottom fade -->
				<div class="partner-modal-hero-fade absolute bottom-0 left-0 right-0 h-16"></div>
			</div>

			<div class="partner-modal-content px-8 pb-8 -mt-2">
				<!-- name + badge -->
				<div class="mb-5">
					<h3 class="font-display text-2xl font-bold text-white">{selected.name}</h3>
					<span class="inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-semibold tracking-widest uppercase bg-sjcu-purple/20 text-sjcu-accent border border-sjcu-purple/30">
						Associated Partner
					</span>
				</div>

				<!-- description -->
				{#if selected.description}
					<p class="text-sjcu-text-secondary text-sm leading-relaxed mb-6">{selected.description}</p>
				{/if}

				<!-- contact info -->
				{#if selected.email || selected.phone || selected.website || selected.address}
					<div class="space-y-2.5 pt-5 border-t border-white/8">
						{#if selected.email}
							<a href="mailto:{selected.email}"
								class="flex items-center gap-3 group/row p-3 rounded-2xl hover:bg-white/4 transition-colors">
								<span class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
									style="background: rgba(139,92,246,0.15); border: 1px solid rgba(139,92,246,0.25);">
									<Mail class="w-4 h-4 text-sjcu-accent" />
								</span>
								<div class="flex-1 min-w-0">
									<p class="text-xs text-sjcu-text-muted uppercase tracking-wider mb-0.5">Email</p>
									<p class="text-white text-sm truncate group-hover/row:text-sjcu-accent transition-colors">{selected.email}</p>
								</div>
								<ExternalLink class="w-3.5 h-3.5 text-sjcu-text-muted opacity-0 group-hover/row:opacity-100 transition-opacity flex-shrink-0" />
							</a>
						{/if}
						{#if selected.phone}
							<a href="tel:{selected.phone}"
								class="flex items-center gap-3 group/row p-3 rounded-2xl hover:bg-white/4 transition-colors">
								<span class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
									style="background: rgba(139,92,246,0.15); border: 1px solid rgba(139,92,246,0.25);">
									<Phone class="w-4 h-4 text-sjcu-accent" />
								</span>
								<div class="flex-1 min-w-0">
									<p class="text-xs text-sjcu-text-muted uppercase tracking-wider mb-0.5">Phone</p>
									<p class="text-white text-sm group-hover/row:text-sjcu-accent transition-colors">{selected.phone}</p>
								</div>
								<ExternalLink class="w-3.5 h-3.5 text-sjcu-text-muted opacity-0 group-hover/row:opacity-100 transition-opacity flex-shrink-0" />
							</a>
						{/if}
						{#if selected.website}
							<a href={selected.website} target="_blank" rel="noopener noreferrer"
								class="flex items-center gap-3 group/row p-3 rounded-2xl hover:bg-white/4 transition-colors">
								<span class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
									style="background: rgba(139,92,246,0.15); border: 1px solid rgba(139,92,246,0.25);">
									<Globe class="w-4 h-4 text-sjcu-accent" />
								</span>
								<div class="flex-1 min-w-0">
									<p class="text-xs text-sjcu-text-muted uppercase tracking-wider mb-0.5">Website</p>
									<p class="text-white text-sm truncate group-hover/row:text-sjcu-accent transition-colors">{selected.website.replace(/^https?:\/\//, '')}</p>
								</div>
								<ExternalLink class="w-3.5 h-3.5 text-sjcu-text-muted opacity-0 group-hover/row:opacity-100 transition-opacity flex-shrink-0" />
							</a>
						{/if}
						{#if selected.address}
							<div class="flex items-start gap-3 p-3 rounded-2xl">
								<span class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
									style="background: rgba(139,92,246,0.15); border: 1px solid rgba(139,92,246,0.25);">
									<MapPin class="w-4 h-4 text-sjcu-accent" />
								</span>
								<div class="flex-1 min-w-0">
									<p class="text-xs text-sjcu-text-muted uppercase tracking-wider mb-0.5">Address</p>
									<p class="text-white text-sm leading-relaxed">{selected.address}</p>
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	/* ── Partner detail modal ───────────────────────────────────────────── */
	.partner-modal-card {
		background: linear-gradient(145deg, #0d0d1f 0%, #12103a 100%);
		border: 1px solid rgba(139,92,246,0.3);
	}
	:global([data-theme="light"]) .partner-modal-card {
		background: rgb(var(--sjcu-card));
		border-color: rgba(124,58,237,0.18);
		box-shadow: 0 32px 64px rgba(124,58,237,0.12);
	}

	.partner-modal-hero-fade {
		background: linear-gradient(to bottom, transparent, #0d0d1f);
	}
	:global([data-theme="light"]) .partner-modal-hero-fade {
		background: linear-gradient(to bottom, transparent, rgb(var(--sjcu-card)));
	}

	.partner-modal-close {
		background: rgba(255,255,255,0.08);
		border: 1px solid rgba(255,255,255,0.1);
		color: rgb(var(--sjcu-text-muted));
	}
	.partner-modal-close:hover { background: rgba(255,255,255,0.16); color: #fff; }
	:global([data-theme="light"]) .partner-modal-close {
		background: rgba(124,58,237,0.08);
		border-color: rgba(124,58,237,0.22);
		color: rgb(var(--sjcu-text-muted));
	}
	:global([data-theme="light"]) .partner-modal-close:hover {
		background: rgba(124,58,237,0.18);
		color: rgb(var(--sjcu-accent));
	}

	/* Text in content area */
	:global([data-theme="light"]) .partner-modal-content h3 {
		color: rgb(var(--sjcu-text-primary));
	}
	:global([data-theme="light"]) .partner-modal-content p.text-white {
		color: rgb(var(--sjcu-text-primary));
	}
	:global([data-theme="light"]) .partner-modal-content .border-white\/8 {
		border-color: rgba(124,58,237,0.15);
	}

	.card-glow-border {
		background: transparent;
		box-shadow:
			0 0 0 1px rgba(139, 92, 246, 0.5),
			0 0 30px rgba(139, 92, 246, 0.15),
			inset 0 0 30px rgba(139, 92, 246, 0.04);
	}

	@keyframes shimmer {
		0% { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}

	@keyframes modal-in {
		from { opacity: 0; transform: translateY(24px) scale(0.97); }
		to   { opacity: 1; transform: translateY(0)    scale(1); }
	}

	.animate-modal-in {
		animation: modal-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
	}
</style>
