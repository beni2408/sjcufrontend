<script lang="ts">
	import { onMount } from 'svelte';
	import { Music2, Award, Users, Mic2 } from 'lucide-svelte';
	import FloatingNotes from '$lib/components/ui/FloatingNotes.svelte';

	// ── Timeline data ────────────────────────────────────────────────────────
	const timeline = [
		{
			year: '2018',
			title: 'Where It Began',
			body: `The team as it exists today took shape in 2018, when a small group of singers from St. John's Church, Madathuvilai entered an all-Tamil Nadu choir competition and won first place. That victory gave a name and a purpose to a musical tradition our community had nurtured for more than four decades.`
		},
		{
			year: '2019',
			title: 'Champions Again',
			body: `We returned the following year and won first place a second time. Those two victories told us we had something worth building on, and we settled into a steady rhythm of practice, training together throughout the year and usually beginning our season around October.`
		},
		{
			year: '2020',
			title: 'A New Beginning in Lockdown',
			body: `Toward the end of 2019, COVID-19 arrived and everyone was confined to home. Rather than fall silent during such an uncertain time, we came together as a team and decided to create our very first studio production. With DVDs and physical formats out of trend and the whole world turning to YouTube, we started our own channel to release our music there — driven by a deeper purpose: to keep the choral heritage of our region alive, since no team like ours existed nearby. Our first production, Aakarthavae, was composed by our director Jascar Benish P and recorded with our long-time partners at Jubilee Studio. After nearly ten to fifteen practice and composing sessions, we recorded in a single unforgettable stretch — arriving at the studio by ten in the morning and leaving at five the next morning. In that one session we recorded two songs, Aakarthavae (Production No. 1) and Arul Marai Engum Aagaa (Production No. 2), later shooting the visuals at St. Mark's Church, Udangudi. The response was overwhelming, and a choir quietly became a music production collective.`
		},
		{
			year: '2021',
			title: 'A Growing Family',
			body: `We have kept going ever since — producing original carols, Lent hymns, Easter hymns, and special-occasion pieces, while continuing to take part in competitions and bring home prizes. Since 2021, in the years after COVID, we have held a yearly family get-together that keeps our community close — a tradition we have proudly carried on ever since.`
		},
		{
			year: null,
			title: 'Carrying the Legacy Forward',
			body: `Our goal is to grow the St. John's Carol Union further — holding auditions, welcoming multi-talented new members, and making room for new ideas, new voices, and a new generation of leaders. But our reason has never changed. Our passion is for Christ; the talents we have were given to us by Him, and through this music we give them back. This was never about business or strategy. Everything we do, we do in His name.`
		}
	];

	// ── Feature cards ────────────────────────────────────────────────────────
	const pillars = [
		{ icon: Music2, title: 'Musical Excellence', desc: 'More than four decades of choral heritage, carried forward with original arrangements and modern production.' },
		{ icon: Award,  title: 'Award-Winning',      desc: 'First place, two years running, at the all-Tamil Nadu choir competition that started it all.' },
		{ icon: Users,  title: 'Community-Rooted',   desc: "Born from St. John's Church, Madathuvilai — preserving the sacred music of our region for the next generation." },
		{ icon: Mic2,   title: 'Studio Productions', desc: 'From a single fourteen-hour session to a growing catalogue of carols and hymns reaching audiences far beyond home.' },
	];

	// Reactive shown flags — one per timeline entry, default true (visible)
	// Set to false in onMount so entries only hide if JS is running
	let shown = $state(timeline.map(() => true));
	let entryEls: (HTMLElement | undefined)[] = [];

	onMount(() => {
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduced) return;

		shown = timeline.map(() => false);

		const revealObs = new IntersectionObserver(entries => {
			entries.forEach(e => {
				if (!e.isIntersecting) return;
				const idx = entryEls.indexOf(e.target as HTMLElement);
				if (idx !== -1) shown[idx] = true;
				revealObs.unobserve(e.target);
			});
		}, { threshold: 0.08 });

		entryEls.forEach(el => { if (el) revealObs.observe(el); });

		return () => revealObs.disconnect();
	});
</script>

<section id="about" class="py-24 md:py-32 bg-sjcu-dark relative overflow-hidden">
	<FloatingNotes opacity={0.15} size="sm" speed="slow" />
	<!-- Ambient glows -->
	<div class="absolute top-0 right-0 w-[540px] h-[540px] bg-sjcu-purple/5 rounded-full blur-[130px] pointer-events-none" aria-hidden="true"></div>
	<div class="absolute bottom-40 left-0 w-80 h-80 bg-sjcu-purple/4 rounded-full blur-[90px] pointer-events-none" aria-hidden="true"></div>

	<div class="max-w-7xl mx-auto px-6">

		<!-- ── Sticky heading + scrolling timeline ──────────────────────── -->
		<div class="grid lg:grid-cols-[1fr_1.45fr] gap-12 lg:gap-20 lg:items-start">

			<!-- Sticky left rail -->
			<div class="lg:sticky lg:top-24">
				<span class="section-tag">Our Story</span>
				<h2 class="section-title mb-4 mt-2">
					A Legacy of<br /><span class="purple-gradient-text">Divine Music</span>
				</h2>
				<p class="text-sjcu-text-muted text-sm leading-relaxed mb-8 max-w-xs">
					Four decades of song. One mission — to give our gifts back to Him.
				</p>
				<a href="/production-enquiry" class="btn-primary">Work With Us</a>
			</div>

			<!-- Timeline -->
			<div class="relative">
				<!-- Gradient vertical line -->
				<div
					class="absolute top-3 bottom-3 w-px pointer-events-none"
					style="left: 19px; background: linear-gradient(to bottom, transparent, rgba(124,58,237,0.65) 8%, rgba(124,58,237,0.35) 85%, transparent);"
					aria-hidden="true"
				></div>

				<ol class="space-y-7 list-none" aria-label="SJCU history timeline">
					{#each timeline as entry, i}
						<li
							bind:this={entryEls[i]}
							class="tl-entry flex gap-6 items-start"
							class:tl-shown={shown[i]}
							style="--delay: {i * 90}ms"
						>
							<!-- Node -->
							<div class="flex-shrink-0 relative w-10 h-10 flex items-center justify-center mt-1" aria-hidden="true">
								{#if entry.year === null}
									<!-- Future node — filled gradient -->
									<div class="absolute w-9 h-9 rounded-full opacity-25" style="background: radial-gradient(circle, rgba(124,58,237,0.9) 0%, transparent 70%);"></div>
									<div class="relative w-5 h-5 rounded-full z-10 flex items-center justify-center"
										style="background: linear-gradient(135deg, #7c3aed, #a855f7); box-shadow: 0 0 16px rgba(124,58,237,0.9);">
										<div class="w-1.5 h-1.5 bg-white rounded-full"></div>
									</div>
								{:else}
									<!-- Year node — hollow with glow -->
									<div class="absolute w-8 h-8 rounded-full opacity-20" style="background: radial-gradient(circle, rgba(124,58,237,0.8) 0%, transparent 70%);"></div>
									<div class="relative w-4 h-4 rounded-full z-10"
										style="border: 2px solid #a78bfa; background: rgb(var(--sjcu-dark)); box-shadow: 0 0 10px rgba(124,58,237,0.65);"></div>
								{/if}
							</div>

							<!-- Card -->
							<div class="flex-1 glass-card-hover rounded-2xl p-6 min-w-0">
								{#if entry.year !== null}
									<time datetime={entry.year} class="year-label">{entry.year}</time>
								{:else}
									<span class="year-label">The Road Ahead</span>
								{/if}
								<h3 class="font-display text-lg font-bold text-white mb-3 leading-snug mt-1">
									{entry.title}
								</h3>
								<p class="text-sjcu-text-secondary text-sm leading-relaxed">{entry.body}</p>
							</div>
						</li>
					{/each}
				</ol>
			</div>
		</div>

		<!-- ── Feature cards bento grid ─────────────────────────────────── -->
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-20 bento-divider">
			{#each pillars as pillar}
				<div class="glass-card-hover p-6 rounded-2xl">
					<div class="w-10 h-10 rounded-xl bg-sjcu-purple/20 border border-sjcu-purple/30 flex items-center justify-center mb-4">
						<pillar.icon class="w-5 h-5 text-sjcu-accent" />
					</div>
					<h3 class="text-sjcu-text-primary font-semibold text-sm mb-2">{pillar.title}</h3>
					<p class="text-sjcu-text-muted text-xs leading-relaxed">{pillar.desc}</p>
				</div>
			{/each}
		</div>

	</div>
</section>

<style>
	/* ── Timeline entry animation ──────────────────────────────────────────── */
	.tl-entry {
		opacity: 0;
		transform: translateY(16px);
		transition:
			opacity  0.55s ease var(--delay, 0ms),
			transform 0.55s ease var(--delay, 0ms);
	}
	.tl-entry.tl-shown {
		opacity: 1;
		transform: translateY(0);
	}

	/* Year / era label */
	.year-label {
		display: block;
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: #a78bfa;
	}

	/* Bento divider */
	.bento-divider {
		padding-top: 4rem;
		border-top: 1px solid rgba(124, 58, 237, 0.15);
	}

	/* Respect prefers-reduced-motion ──────────────────────────────────────── */
	@media (prefers-reduced-motion: reduce) {
		.tl-entry {
			opacity: 1;
			transform: none;
			transition: none;
		}
	}
</style>
