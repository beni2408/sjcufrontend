<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Instagram, Facebook, Youtube, Twitter, UserCircle2 } from 'lucide-svelte';
	import { membersApi } from '$lib/services/api.js';
	import type { Member } from '$lib/types/index.js';
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
	import { tilt } from '$lib/actions/tilt.js';
	import FloatingNotes from '$lib/components/ui/FloatingNotes.svelte';

	let members = $state<Member[]>([]);
	let loading = $state(true);

	const men   = $derived(members.filter(m => m.gender !== 'Female'));
	const women = $derived(members.filter(m => m.gender === 'Female'));

	function openProfile(m: Member) {
		if (m.slug) goto(`/team/${m.slug}`);
	}

	onMount(async () => {
		try {
			const res = await membersApi.getAll();
			members = res.data.data.members || [];
		} catch {
			members = [];
		} finally {
			loading = false;
		}

		const { gsap } = await import('gsap');
		const { ScrollTrigger } = await import('gsap/ScrollTrigger');
		gsap.registerPlugin(ScrollTrigger);
		gsap.fromTo('#members .member-card', {
			opacity: 0, y: 40
		}, {
			opacity: 1, y: 0, duration: 0.7, stagger: 0.08,
			scrollTrigger: { trigger: '#members', start: 'top 70%' }
		});

	});

	const socials = [
		{ key: 'instagram', Icon: Instagram, label: 'Instagram' },
		{ key: 'facebook',  Icon: Facebook,  label: 'Facebook' },
		{ key: 'youtube',   Icon: Youtube,   label: 'YouTube' },
		{ key: 'twitter',   Icon: Twitter,   label: 'Twitter' },
	];

	function getInstaUsername(url: string): string {
		const match = url.replace(/\/$/, '').match(/instagram\.com\/([^/?#]+)/);
		return match ? `@${match[1]}` : '@instagram';
	}
</script>

<section id="members" class="py-24 md:py-32 bg-sjcu-dark relative overflow-hidden">
	<FloatingNotes opacity={0.18} size="sm" speed="slow" />
	<div class="absolute bottom-0 left-0 w-80 h-80 bg-sjcu-purple/5 rounded-full blur-[80px] pointer-events-none"></div>

	<div class="max-w-7xl mx-auto px-6">
		<div class="text-center mb-14">
			<span class="section-tag justify-center">The People</span>
			<h2 class="section-title mt-2 mb-4">
				Meet Our <span class="purple-gradient-text">Team</span>
			</h2>
			<p class="section-subtitle mx-auto">
				Talented individuals who pour their hearts into every note, production, and performance.
			</p>
		</div>

		{#if loading}
			<LoadingSpinner size="lg" class="py-20" />
		{:else if members.length === 0}
			<div class="text-center py-20 text-sjcu-text-muted">
				<UserCircle2 class="w-16 h-16 mx-auto mb-4 opacity-30" />
				<p>No members added yet.</p>
			</div>
		{:else}
			{#each [{ label: 'Men', accent: 'from-blue-500/20 to-blue-600/10', border: 'rgba(59,130,246,0.3)', list: men }, { label: 'Female Vocals', accent: 'from-pink-500/20 to-pink-600/10', border: 'rgba(236,72,153,0.3)', list: women }] as section}
				{#if section.list.length > 0}
					<!-- Section divider -->
					<div class="flex items-center gap-4 mb-8 {section.label === 'Women' ? 'mt-20' : ''}">
						<div class="flex-1 h-px" style="background: linear-gradient(to right, transparent, {section.border}, transparent);"></div>
						<span class="px-5 py-2 rounded-full text-sm font-bold tracking-widest uppercase bg-gradient-to-r {section.accent} border"
							style="border-color: {section.border}; color: {section.label === 'Female Vocals' ? '#f9a8d4' : '#93c5fd'};">
							 {section.label}
						</span>
						<div class="flex-1 h-px" style="background: linear-gradient(to left, transparent, {section.border}, transparent);"></div>
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
						{#each section.list as member}
							<button
								onclick={() => openProfile(member)}
								use:tilt={{ max: 7, liftY: 5 }}
								class="member-card card-ripple card-ring-hover group relative overflow-hidden rounded-3xl text-left w-full {member.slug ? 'cursor-pointer' : 'cursor-default'}"
								style="height: 520px;"
							>
								{#if member.photo}
									<img
										src={member.photo}
										alt={member.name}
										class="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-700 ease-out"
										loading="lazy"
									/>
								{:else}
									<div class="absolute inset-0 bg-gradient-to-br from-sjcu-purple/30 to-sjcu-navy flex items-center justify-center">
										<UserCircle2 class="w-32 h-32 text-white/20" />
									</div>
								{/if}

								<div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent member-photo-overlay"></div>
								<div class="absolute inset-0 bg-sjcu-purple/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

								<div class="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
									<span class="member-card-badge px-3 py-1.5 rounded-full backdrop-blur-sm text-xs font-medium">
									{member.slug ? 'View Profile' : 'Profile Coming Soon'}
								</span>
								</div>

								<div class="absolute bottom-0 left-0 right-0 p-8 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
									<h4 class="text-white font-display font-bold text-3xl mb-1 leading-tight">{member.name}</h4>
									<p class="text-sjcu-accent text-base font-medium mb-5">{member.position}</p>
									<div class="flex items-center gap-3 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-75">
										{#each socials as { key, Icon }}
											{#if member.socialLinks?.[key as keyof typeof member.socialLinks]}
												<div class="member-card-social-icon w-11 h-11 rounded-xl backdrop-blur-md flex items-center justify-center">
													<Icon class="w-4 h-4" />
												</div>
											{/if}
										{/each}
									</div>
								</div>

								<div class="absolute inset-0 rounded-3xl ring-0 group-hover:ring-2 group-hover:ring-sjcu-purple/60 transition-all duration-500 pointer-events-none"></div>
							</button>
						{/each}
					</div>
				{/if}
			{/each}
		{/if}
	</div>
</section>


<style>
	/* ── Card hover elements ─────────────────────────────────────────────── */
	.member-card-badge {
		background: rgba(255,255,255,0.15);
		border: 1px solid rgba(255,255,255,0.2);
		color: #fff;
	}
	:global([data-theme="light"]) .member-card-badge {
		background: rgba(124,58,237,0.18);
		border-color: rgba(124,58,237,0.35);
		color: #fff;
	}

	.member-card-social-icon {
		background: rgba(255,255,255,0.15);
		border: 1px solid rgba(255,255,255,0.25);
		color: #fff;
	}
	:global([data-theme="light"]) .member-card-social-icon {
		background: rgba(124,58,237,0.22);
		border-color: rgba(124,58,237,0.45);
		color: #fff;
	}

	/* ── Card photo vignette ─────────────────────────────────────────────── */
	:global([data-theme="light"]) .member-photo-overlay {
		background: linear-gradient(
			to top,
			rgb(var(--sjcu-dark) / 0.97) 0%,
			rgb(var(--sjcu-dark) / 0.65) 35%,
			transparent 70%
		);
	}
	:global([data-theme="light"]) .member-card h4 {
		color: rgb(var(--sjcu-text-primary));
	}

	/* ── Detail modal ────────────────────────────────────────────────────── */
	.member-modal {
		background: #0d0d23;
		border: 1px solid rgba(124,58,237,0.25);
		min-height: 560px;
	}
	:global([data-theme="light"]) .member-modal {
		background: rgb(var(--sjcu-card));
		border-color: rgba(124,58,237,0.18);
		box-shadow: 0 32px 64px rgba(124,58,237,0.12);
	}

	.member-modal-fade-r {
		background: linear-gradient(to right, transparent 55%, #0d0d23 100%);
	}
	:global([data-theme="light"]) .member-modal-fade-r {
		background: linear-gradient(to right, transparent 55%, rgb(var(--sjcu-card)) 100%);
	}

	.member-modal-fade-b {
		background: linear-gradient(to top, #0d0d23 0%, transparent 60%);
	}
	:global([data-theme="light"]) .member-modal-fade-b {
		background: linear-gradient(to top, rgb(var(--sjcu-card)) 0%, transparent 60%);
	}

	/* Text in the right info panel */
	:global([data-theme="light"]) .member-modal-info h2 {
		color: rgb(var(--sjcu-text-primary));
	}

	/* Social link buttons */
	.member-social-link {
		background: rgba(255,255,255,0.06);
		border: 1px solid rgba(255,255,255,0.1);
		color: #fff;
	}
	.member-social-link:hover {
		background: rgba(124,58,237,0.3);
		border-color: rgba(124,58,237,0.6);
	}
	:global([data-theme="light"]) .member-social-link {
		background: rgba(124,58,237,0.08);
		border-color: rgba(124,58,237,0.22);
		color: rgb(var(--sjcu-text-primary));
	}
	:global([data-theme="light"]) .member-social-link:hover {
		background: rgba(124,58,237,0.18);
		border-color: rgba(124,58,237,0.5);
	}

	/* Close button */
	.member-modal-close {
		background: rgba(255,255,255,0.1);
		border: 1px solid rgba(255,255,255,0.15);
		color: #fff;
	}
	.member-modal-close:hover { background: rgba(255,255,255,0.2); }
	:global([data-theme="light"]) .member-modal-close {
		background: rgba(124,58,237,0.1);
		border-color: rgba(124,58,237,0.25);
		color: rgb(var(--sjcu-accent));
	}
	:global([data-theme="light"]) .member-modal-close:hover {
		background: rgba(124,58,237,0.2);
	}
</style>
