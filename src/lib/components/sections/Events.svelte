<script lang="ts">
	import { onMount } from 'svelte';
	import { Calendar, MapPin, Clock, X } from 'lucide-svelte';
	import FloatingNotes from '$lib/components/ui/FloatingNotes.svelte';
	import { eventsApi } from '$lib/services/api.js';
	import type { Event } from '$lib/types/index.js';
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';

	let events = $state<Event[]>([]);
	let loading = $state(true);
	let selected = $state<Event | null>(null);
	let now = $state(Date.now());

	function openModal(ev: Event) { selected = ev; document.body.style.overflow = 'hidden'; }
	function closeModal() { selected = null; document.body.style.overflow = ''; }

	function handleBackdropClick(e: MouseEvent) {
		if ((e.target as HTMLElement).id === 'event-backdrop') closeModal();
	}
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') closeModal();
	}

	onMount(async () => {
		try {
			const res = await eventsApi.getAll({ upcoming: 'true' });
			events = res.data.data.events || [];
		} catch {
			events = [];
		} finally {
			loading = false;
		}

		const ticker = setInterval(() => { now = Date.now(); }, 1000);

		const { gsap } = await import('gsap');
		const { ScrollTrigger } = await import('gsap/ScrollTrigger');
		gsap.registerPlugin(ScrollTrigger);
		gsap.fromTo('#events .event-card', {
			opacity: 0, x: -30
		}, {
			opacity: 1, x: 0, duration: 0.7, stagger: 0.12,
			scrollTrigger: { trigger: '#events', start: 'top 75%' }
		});

		return () => { clearInterval(ticker); document.body.style.overflow = ''; };
	});

	function formatDate(dateStr: string) {
		const d = new Date(dateStr);
		return {
			day: d.getDate(),
			month: d.toLocaleString('en', { month: 'short' }),
			year: d.getFullYear(),
			full: d.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
		};
	}

	function formatTime(time: string) {
		if (!time) return '';
		const [h, m] = time.split(':').map(Number);
		const period = h >= 12 ? 'PM' : 'AM';
		const hour = h % 12 || 12;
		return `${hour}:${String(m).padStart(2, '0')} ${period}`;
	}

	function buildGCalUrl(ev: Event) {
		const d = new Date(ev.date);
		const pad = (n: number) => String(n).padStart(2, '0');
		const ymd = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;

		let dates: string;
		if (ev.time) {
			const [h, m] = ev.time.split(':').map(Number);
			const start = `${ymd}T${pad(h)}${pad(m)}00`;
			const endH = h + 2; // default 2-hour block
			const end = `${ymd}T${pad(endH % 24)}${pad(m)}00`;
			dates = `${start}/${end}`;
		} else {
			// all-day event
			const next = new Date(d);
			next.setDate(next.getDate() + 1);
			const nextYmd = `${next.getFullYear()}${pad(next.getMonth() + 1)}${pad(next.getDate())}`;
			dates = `${ymd}/${nextYmd}`;
		}

		const params = new URLSearchParams({
			action: 'TEMPLATE',
			text: ev.title,
			dates,
			...(ev.venue ? { location: ev.venue } : {}),
			...(ev.description ? { details: ev.description } : {}),
		});
		return `https://calendar.google.com/calendar/render?${params.toString()}`;
	}

	function getCountdown(ev: Event, currentNow: number) {
		const d = new Date(ev.date);
		if (ev.time) {
			const [h, m] = ev.time.split(':').map(Number);
			d.setHours(h, m, 0, 0);
		} else {
			d.setHours(0, 0, 0, 0);
		}
		const diff = d.getTime() - currentNow;
		if (diff <= 0) return null;
		const days = Math.floor(diff / 86400000);
		const hours = Math.floor((diff % 86400000) / 3600000);
		const mins = Math.floor((diff % 3600000) / 60000);
		const secs = Math.floor((diff % 60000) / 1000);
		return { days, hours, mins, secs };
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<section id="events" class="py-24 md:py-32 bg-sjcu-navy-2 relative overflow-hidden">
	<FloatingNotes opacity={0.15} size="sm" speed="slow" />
	<div class="absolute top-1/2 right-0 w-72 h-72 bg-sjcu-purple/5 rounded-full blur-[80px] pointer-events-none"></div>

	<div class="max-w-7xl mx-auto px-6">
		<div class="text-center mb-12">
			<span class="section-tag justify-center">Calendar</span>
			<h2 class="section-title mt-2 mb-4">Upcoming <span class="purple-gradient-text">Events</span></h2>
			<p class="section-subtitle mx-auto">Be part of our upcoming performances, carol services, and special events.</p>
		</div>

		{#if loading}
			<LoadingSpinner size="lg" class="py-20" />
		{:else if events.length === 0}
			<div class="text-center py-20 text-sjcu-text-muted">
				<Calendar class="w-16 h-16 mx-auto mb-4 opacity-30" />
				<p>No upcoming events at the moment. Stay tuned!</p>
			</div>
		{:else}
			<div class="space-y-4">
				{#each events as event}
					{@const d = formatDate(event.date)}
					{@const cd = getCountdown(event, now)}
					<button
						onclick={() => openModal(event)}
						class="event-card card-ripple glass-card-hover p-0 w-full text-left group cursor-pointer overflow-hidden"
					>
						<div class="flex flex-col md:flex-row">
							{#if event.bannerImage}
								<div class="md:w-64 h-48 md:h-auto flex-shrink-0 overflow-hidden">
									<img src={event.bannerImage} alt={event.title} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
								</div>
							{/if}
							<div class="flex flex-col md:flex-row items-start gap-6 p-6 flex-1">
								<!-- Date badge -->
								<div class="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-sjcu-purple/20 border border-sjcu-purple/30 text-center">
									<span class="font-display text-xl font-bold text-white leading-none">{d.day}</span>
									<span class="text-sjcu-accent text-xs font-semibold uppercase">{d.month}</span>
								</div>

								<!-- Text content -->
								<div class="flex-1 min-w-0">
									<span class="text-sjcu-text-muted text-xs font-medium uppercase tracking-widest">{d.year}</span>
									<h3 class="text-sjcu-text-primary font-semibold text-lg mb-2 mt-0.5">{event.title}</h3>
									<div class="flex flex-wrap items-center gap-x-4 gap-y-1">
										{#if event.venue}
											<div class="flex items-center gap-1.5 text-sjcu-text-secondary text-sm">
												<MapPin class="w-3.5 h-3.5 text-sjcu-accent flex-shrink-0" />
												{event.venue}
											</div>
										{/if}
										{#if event.time}
											<div class="flex items-center gap-1.5 text-sjcu-text-secondary text-sm">
												<Clock class="w-3.5 h-3.5 text-sjcu-accent flex-shrink-0" />
												{formatTime(event.time)}
											</div>
										{/if}
									</div>
									{#if event.description}
										<p class="text-sjcu-text-muted text-sm line-clamp-2 mt-2">{event.description}</p>
									{/if}
								</div>

								<!-- Right column: countdown on top, actions below -->
								<div class="flex-shrink-0 flex flex-col items-end gap-3 self-stretch justify-between">
									<!-- Flip clock -->
									{#if cd}
										<div class="flip-clock-wrap">
											<span class="flip-clock-label">Starts in</span>
											<div class="flip-clock-digits">
												{#if cd.days > 0}
													<div class="flip-block">
														<div class="flip-digit-wrap">
															{#key cd.days}
																<span class="flip-digit">{String(cd.days).padStart(2,'0')}</span>
															{/key}
														</div>
														<span class="flip-unit-label">d</span>
													</div>
													<span class="flip-colon">:</span>
												{/if}
												<div class="flip-block">
													<div class="flip-digit-wrap">
														{#key cd.hours}
															<span class="flip-digit">{String(cd.hours).padStart(2,'0')}</span>
														{/key}
													</div>
													<span class="flip-unit-label">h</span>
												</div>
												<span class="flip-colon">:</span>
												<div class="flip-block">
													<div class="flip-digit-wrap">
														{#key cd.mins}
															<span class="flip-digit">{String(cd.mins).padStart(2,'0')}</span>
														{/key}
													</div>
													<span class="flip-unit-label">m</span>
												</div>
												<span class="flip-colon">:</span>
												<div class="flip-block">
													<div class="flip-digit-wrap">
														{#key cd.secs}
															<span class="flip-digit">{String(cd.secs).padStart(2,'0')}</span>
														{/key}
													</div>
													<span class="flip-unit-label">s</span>
												</div>
											</div>
										</div>
									{:else}
										<div class="flip-live-badge">
											<span class="flip-live-dot"></span>
											LIVE
										</div>
									{/if}

									<!-- Action buttons -->
									<div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
										<a
											href={buildGCalUrl(event)}
											target="_blank"
											rel="noopener noreferrer"
											onclick={(e) => e.stopPropagation()}
											class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200"
											style="background: rgba(66,133,244,0.12); border-color: rgba(66,133,244,0.35); color: #93c5fd;"
											title="Add to Google Calendar"
										>
											<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
												<path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.5 10.5H12v4.5h-1V12H6.5v-1H11V6.5h1V11h4.5v1.5z"/>
											</svg>
											Add to Calendar
										</a>
										<span class="px-3 py-1.5 rounded-full text-xs font-medium text-sjcu-accent border border-sjcu-purple/40 bg-sjcu-purple/10">
											View Details
										</span>
									</div>
								</div>
							</div>
						</div>
					</button>
				{/each}
			</div>
		{/if}
	</div>
</section>

<!-- Event Detail Modal -->
{#if selected}
	{@const d = formatDate(selected.date)}
	{@const mcd = getCountdown(selected, now)}
	<div
		id="event-backdrop"
		onclick={handleBackdropClick}
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		style="background: rgba(0,0,0,0.75); backdrop-filter: blur(16px);"
	>
		<div class="ev-modal-card relative w-full max-w-4xl rounded-[2rem] overflow-hidden shadow-2xl animate-modal-spring flex flex-col md:flex-row" style="min-height: 480px;">

			<!-- Left — banner image -->
			<div class="relative md:w-80 flex-shrink-0 h-56 md:h-auto overflow-hidden">
				{#if selected.bannerImage}
					<img src={selected.bannerImage} alt="" class="absolute inset-0 w-full h-full object-cover scale-110" style="filter: blur(24px); opacity: 0.35;" aria-hidden="true" />
					<img src={selected.bannerImage} alt={selected.title} class="relative z-10 w-full h-full object-cover" />
				{:else}
					<div class="w-full h-full bg-gradient-to-br from-sjcu-purple/30 to-sjcu-navy flex items-center justify-center">
						<Calendar class="w-20 h-20 text-white/15" />
					</div>
				{/if}
				<div class="ev-modal-fade-h absolute inset-0 hidden md:block"></div>
				<div class="ev-modal-fade-v absolute inset-0 md:hidden"></div>
			</div>

			<!-- Right — details -->
			<div class="flex-1 flex flex-col justify-center px-10 py-12">
				<!-- Date + time row -->
				<div class="flex items-center gap-4 mb-6">
					<div class="flex flex-col items-center justify-center w-16 h-16 rounded-2xl text-center flex-shrink-0" style="background: rgba(124,58,237,0.2); border: 1px solid rgba(124,58,237,0.35);">
						<span class="ev-date-num font-display text-2xl font-bold text-white leading-none">{d.day}</span>
						<span class="text-sjcu-accent text-xs font-bold uppercase">{d.month}</span>
					</div>
					<div>
						<p class="text-sjcu-text-muted text-xs uppercase tracking-widest mb-0.5">{d.year}</p>
						<p class="text-sjcu-text-secondary text-sm">{d.full.split(',').slice(0, 2).join(',')}</p>
						{#if selected.time}
							<div class="flex items-center gap-1.5 text-sjcu-accent text-sm mt-1 font-medium">
								<Clock class="w-3.5 h-3.5" />
								{formatTime(selected.time)}
							</div>
						{/if}
					</div>
				</div>

				<!-- Countdown in modal -->
				{#if mcd}
					<div class="flex items-center gap-3 mb-6 p-4 rounded-2xl" style="background: rgba(124,58,237,0.08); border: 1px solid rgba(124,58,237,0.2);">
						<Clock class="w-4 h-4 text-sjcu-accent flex-shrink-0" />
						<span class="text-sjcu-text-muted text-xs uppercase tracking-widest">Starts in</span>
						<div class="flex items-center gap-1 ml-auto">
							{#if mcd.days > 0}
								<span class="countdown-chip">{mcd.days}<span class="countdown-unit">d</span></span>
								<span class="text-sjcu-text-muted/50 text-sm">:</span>
							{/if}
							<span class="countdown-chip">{String(mcd.hours).padStart(2,'0')}<span class="countdown-unit">h</span></span>
							<span class="text-sjcu-text-muted/50 text-sm">:</span>
							<span class="countdown-chip">{String(mcd.mins).padStart(2,'0')}<span class="countdown-unit">m</span></span>
							<span class="text-sjcu-text-muted/50 text-sm">:</span>
							<span class="countdown-chip tabular-nums">{String(mcd.secs).padStart(2,'0')}<span class="countdown-unit">s</span></span>
						</div>
					</div>
				{:else}
					<div class="flex items-center gap-2 mb-6 px-4 py-3 rounded-2xl bg-green-500/10 border border-green-500/20">
						<span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
						<span class="text-green-400 text-sm font-semibold">Happening Now</span>
					</div>
				{/if}

				{#if selected.featured}
					<span class="inline-block px-4 py-1.5 text-[11px] font-bold rounded-full mb-4 tracking-widest uppercase w-fit" style="background: rgba(124,58,237,0.15); color: #a78bfa; border: 1px solid rgba(124,58,237,0.35);">
						Featured Event
					</span>
				{/if}

				<h2 class="ev-modal-title font-display text-4xl font-bold mb-3 leading-tight">{selected.title}</h2>

				{#if selected.venue}
					<div class="flex items-center gap-2 text-sjcu-text-secondary text-base mb-6">
						<MapPin class="w-4 h-4 text-sjcu-accent flex-shrink-0" />
						{selected.venue}
					</div>
				{/if}

				{#if selected.description}
					<p class="text-sjcu-text-secondary text-base leading-relaxed mb-10" style="max-width: 44ch;">{selected.description}</p>
				{/if}

				<div class="flex items-center gap-3 flex-wrap">
					<a href="/production-enquiry" class="btn-primary text-sm px-8 py-3">
						RSVP Now
					</a>
					<a
						href={buildGCalUrl(selected)}
						target="_blank"
						rel="noopener noreferrer"
						class="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-medium border transition-all duration-200"
						style="background: rgba(66,133,244,0.1); border-color: rgba(66,133,244,0.3); color: #93c5fd;"
						onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(66,133,244,0.22)'; }}
						onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(66,133,244,0.1)'; }}
					>
						<svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
							<path d="M19.5 3h-2V1.5h-1.5V3h-8V1.5H6.5V3H4.5C3.67 3 3 3.67 3 4.5v15C3 20.33 3.67 21 4.5 21h15c.83 0 1.5-.67 1.5-1.5v-15C21 3.67 20.33 3 19.5 3zM19.5 19.5h-15v-12h15v12zM7 11h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2zm-8 4h2v2H7zm4 0h2v2h-2z"/>
						</svg>
						Add to Google Calendar
					</a>
				</div>
			</div>

			<!-- Close -->
			<button
				onclick={closeModal}
				class="ev-modal-close absolute top-5 right-5 z-20 w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-all"
			>
				<X class="w-5 h-5" />
			</button>
		</div>
	</div>
{/if}

<style>
	/* ── Event modal theming ── */
	.ev-modal-card {
		--ev-bg: #0d0d23;
		--ev-title: #fff;
		--ev-close-bg: rgba(255, 255, 255, 0.1);
		--ev-close-hover: rgba(255, 255, 255, 0.2);
		--ev-close-border: rgba(255, 255, 255, 0.15);
		--ev-close-c: #fff;
		background: var(--ev-bg);
		border: 1px solid rgba(124, 58, 237, 0.25);
	}
	:global([data-theme="light"]) .ev-modal-card {
		--ev-bg: rgb(var(--sjcu-card));
		--ev-title: #1e1b4b;
		--ev-close-bg: rgba(109, 40, 217, 0.1);
		--ev-close-hover: rgba(109, 40, 217, 0.2);
		--ev-close-border: rgba(109, 40, 217, 0.25);
		--ev-close-c: #4c1d95;
		background: rgb(var(--sjcu-card));
		border-color: rgba(124, 58, 237, 0.18);
		box-shadow: 0 24px 60px rgba(109, 40, 217, 0.12), 0 0 0 1px rgba(124, 58, 237, 0.1);
	}

	/* Left panel gradient fades — use --ev-bg so they switch with the card */
	.ev-modal-fade-h {
		background: linear-gradient(to right, transparent, transparent, var(--ev-bg));
	}
	.ev-modal-fade-v {
		background: linear-gradient(to top, var(--ev-bg), transparent);
	}

	/* Title */
	.ev-modal-title { color: var(--ev-title); }

	/* Close button */
	.ev-modal-close {
		background: var(--ev-close-bg);
		border: 1px solid var(--ev-close-border);
		color: var(--ev-close-c);
	}
	.ev-modal-close:hover { background: var(--ev-close-hover); }

	/* Date badge number in modal — text-white override for light mode */
	:global([data-theme="light"]) .ev-modal-card .ev-date-num {
		color: #1e1b4b;
	}

	/* ── Flip-clock corner widget ── */
	:global(.flip-clock-wrap) {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 6px;
		padding: 12px 14px;
		border-radius: 18px;
		background: rgba(8, 6, 24, 0.78);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(124, 58, 237, 0.4);
		box-shadow: 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08);
	}
	:global(.flip-clock-label) {
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: rgba(167, 139, 250, 0.6);
		line-height: 1;
	}
	:global(.flip-clock-digits) {
		display: flex;
		align-items: flex-start;
		gap: 5px;
	}
	:global(.flip-block) {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}
	:global(.flip-digit-wrap) {
		width: 42px;
		height: 36px;
		overflow: hidden;
		border-radius: 9px;
		background: rgba(124, 58, 237, 0.2);
		border: 1px solid rgba(124, 58, 237, 0.45);
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.35);
	}
	:global(.flip-digit-wrap::after) {
		content: '';
		position: absolute;
		left: 0; right: 0;
		top: 50%;
		height: 1px;
		background: rgba(0, 0, 0, 0.5);
		pointer-events: none;
	}
	:global(.flip-digit) {
		font-variant-numeric: tabular-nums;
		font-weight: 800;
		font-size: 1.1rem;
		color: #c4b5fd;
		line-height: 1;
		letter-spacing: -0.02em;
		animation: flipRoll 0.28s cubic-bezier(0.22, 1, 0.36, 1);
	}
	:global(.flip-unit-label) {
		font-size: 0.58rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: rgba(124, 58, 237, 0.65);
		line-height: 1;
	}
	:global(.flip-colon) {
		font-size: 1rem;
		font-weight: 800;
		color: rgba(124, 58, 237, 0.55);
		line-height: 1;
		padding-top: 6px;
		align-self: flex-start;
	}
	:global(.flip-live-badge) {
		display: flex;
		align-items: center;
		gap: 7px;
		padding: 10px 14px;
		border-radius: 14px;
		background: rgba(8, 6, 24, 0.78);
		backdrop-filter: blur(12px);
		border: 1px solid rgba(34, 197, 94, 0.4);
		font-size: 0.7rem;
		font-weight: 800;
		letter-spacing: 0.14em;
		color: #4ade80;
	}
	:global(.flip-live-dot) {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #4ade80;
		animation: livePulse 1.2s ease-in-out infinite;
	}
	@keyframes flipRoll {
		0%   { transform: translateY(-55%) scaleY(0.6); opacity: 0; }
		60%  { transform: translateY(6%)   scaleY(1.05); opacity: 1; }
		100% { transform: translateY(0)    scaleY(1);    opacity: 1; }
	}
	@keyframes livePulse {
		0%, 100% { opacity: 1; transform: scale(1); }
		50%       { opacity: 0.4; transform: scale(0.7); }
	}
</style>
