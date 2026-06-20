<script lang="ts">
	import { onMount } from 'svelte';
	import { CalendarDays, MapPin, Users2, Mic, Clock } from 'lucide-svelte';
	import FloatingNotes from '$lib/components/ui/FloatingNotes.svelte';
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
	import { auditionsApi } from '$lib/services/api.js';
	import type { Audition } from '$lib/types/index.js';

	let auditions = $state<Audition[]>([]);
	let loading = $state(true);

	onMount(() => {
		auditionsApi.getAll()
			.then(res => { auditions = res.data.data.auditions || []; })
			.catch(() => { auditions = []; })
			.finally(() => { loading = false; });
	});

	function formatDate(d: string) {
		return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
	}
</script>

<section id="auditions" class="py-24 md:py-32 bg-sjcu-dark relative overflow-hidden">
	<FloatingNotes opacity={0.15} size="md" speed="slow" />
	<div class="absolute top-0 left-0 w-96 h-96 rounded-full pointer-events-none"
		style="background: radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%);"></div>

	<div class="max-w-7xl mx-auto px-6">
		<div class="text-center mb-14">
			<span class="section-tag justify-center">Join Us</span>
			<h2 class="section-title mt-2 mb-4">
				Open <span class="purple-gradient-text">Auditions</span>
			</h2>
			<p class="section-subtitle mx-auto">
				Have a voice worth sharing? Apply for one of our upcoming auditions and become part of the choir.
			</p>
		</div>

		{#if loading}
			<LoadingSpinner size="lg" class="py-20" />
		{:else if auditions.length === 0}
			<div class="text-center py-20 text-sjcu-text-muted">
				<Mic class="w-12 h-12 mx-auto mb-3 opacity-30" />
				<p>No auditions are open right now. Check back soon!</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each auditions as a}
					<div class="group card-ripple card-ring-hover relative rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-2 audition-card">
						<div class="relative h-48 overflow-hidden">
							{#if a.featureImage}
								<img src={a.featureImage} alt={a.title} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
							{:else}
								<div class="w-full h-full flex items-center justify-center" style="background: linear-gradient(135deg, rgba(124,58,237,0.2), rgba(5,2,20,0.9));">
									<Mic class="w-12 h-12 text-white/20" />
								</div>
							{/if}
							<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>
							<span class="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide backdrop-blur-sm {a.isOpen ? 'bg-green-500/20 text-green-300 border border-green-500/40' : 'bg-red-500/20 text-red-300 border border-red-500/40'}">
								{a.isOpen ? 'Applications Open' : 'Closed'}
							</span>
							<span class="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-medium bg-black/50 text-white/80 backdrop-blur-sm">{a.auditionId}</span>
						</div>

						<div class="p-6 flex flex-col flex-1">
							<h3 class="font-display text-xl font-bold text-sjcu-text-primary mb-3">{a.title}</h3>

							<div class="space-y-2 text-sm text-sjcu-text-secondary mb-5">
								<div class="flex items-center gap-2"><CalendarDays class="w-4 h-4 text-sjcu-accent flex-shrink-0" /> {formatDate(a.date)}</div>
								<div class="flex items-center gap-2"><MapPin class="w-4 h-4 text-sjcu-accent flex-shrink-0" /> {a.venue}</div>
								<div class="flex items-center gap-2"><Users2 class="w-4 h-4 text-sjcu-accent flex-shrink-0" /> Age {a.minAge}–{a.maxAge}</div>
								<div class="flex items-center gap-2"><Clock class="w-4 h-4 text-sjcu-accent flex-shrink-0" /> Apply by {formatDate(a.applicationEnd)}</div>
							</div>

							<a
								href={a.isOpen ? `/auditions/${a._id}` : undefined}
								aria-disabled={!a.isOpen}
								class="btn-primary w-full justify-center mt-auto {!a.isOpen ? 'opacity-40 pointer-events-none' : ''}"
							>
								{a.isOpen ? 'Apply Now' : 'Applications Closed'}
							</a>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>

<style>
	.audition-card {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid var(--mt-card-border, rgba(255, 255, 255, 0.08));
	}
</style>
