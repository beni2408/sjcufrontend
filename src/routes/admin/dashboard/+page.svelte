<script lang="ts">
	import { onMount } from 'svelte';
	import { Film, CalendarDays, Users, Inbox, TrendingUp, Clock, BarChart3, PieChart } from 'lucide-svelte';
	import { productionsApi, eventsApi, membersApi, enquiriesApi } from '$lib/services/api.js';
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
	import { countUp } from '$lib/actions/countUp.js';
	import type { Production, Member, Enquiry } from '$lib/types/index.js';

	let stats            = $state({ productions: 0, events: 0, members: 0, enquiries: 0 });
	let recentProductions = $state<Production[]>([]);
	let upcomingEvents   = $state<any[]>([]);
	let pendingEnquiries = $state<Enquiry[]>([]);
	let allProductions   = $state<Production[]>([]);
	let allMembers       = $state<Member[]>([]);
	let allEnquiries     = $state<Enquiry[]>([]);
	let loading          = $state(true);
	let chartsReady      = $state(false);

	onMount(async () => {
		try {
			const [prods, evts, mems, enqs] = await Promise.all([
				productionsApi.getAll(),
				eventsApi.getAll({ upcoming: 'true' }),
				membersApi.getAll(),
				enquiriesApi.getAll(),
			]);

			const productions = prods.data.data.productions || [];
			const events      = evts.data.data.events      || [];
			const members     = mems.data.data.members     || [];
			const enquiries   = enqs.data.data.enquiries   || [];

			allProductions = productions;
			allMembers     = members;
			allEnquiries   = enquiries;

			const pending = enquiries.filter((e: Enquiry) => e.status === 'Pending');
			stats = {
				productions: productions.length,
				events:      events.length,
				members:     members.length,
				enquiries:   pending.length,
			};
			recentProductions = productions.slice(0, 5);
			upcomingEvents    = events.slice(0, 4);
			pendingEnquiries  = pending.slice(0, 5);
		} catch { /* empty */ } finally {
			loading = false;
			// Two rAF ticks ensure the DOM has rendered before triggering transitions
			requestAnimationFrame(() => requestAnimationFrame(() => { chartsReady = true; }));
		}
	});

	const kpis = $derived([
		{ icon: Film,        label: 'Total Productions', value: stats.productions, color: 'text-sjcu-purple', bg: 'bg-sjcu-purple/15' },
		{ icon: CalendarDays,label: 'Upcoming Events',   value: stats.events,      color: 'text-blue-400',   bg: 'bg-blue-400/15'   },
		{ icon: Users,       label: 'Active Members',    value: stats.members,     color: 'text-green-400',  bg: 'bg-green-400/15'  },
		{ icon: Inbox,       label: 'Pending Enquiries', value: stats.enquiries,   color: 'text-yellow-400', bg: 'bg-yellow-400/15' },
	]);

	// ── Productions by Category ─────────────────────────────────────────────
	const PROD_CATS = [
		{ label: 'Christmas Songs',          color: '#7c3aed' },
		{ label: 'General Songs',            color: '#a855f7' },
		{ label: 'Special Songs',            color: '#c084fc' },
		{ label: 'Church Dedication Songs',  color: '#6366f1' },
		{ label: 'Wedding Songs',            color: '#818cf8' },
		{ label: 'Lent Days Song',           color: '#93c5fd' },
	];

	const prodsByCategory = $derived(
		PROD_CATS
			.map(c => ({ ...c, value: allProductions.filter(p => p.category === c.label).length }))
			.sort((a, b) => b.value - a.value)
	);
	const maxProdCat = $derived(Math.max(...prodsByCategory.map(c => c.value), 1));

	// ── Productions by Year (last 5 years) ─────────────────────────────────
	const currentYear = new Date().getFullYear();
	const years = Array.from({ length: 5 }, (_, i) => currentYear - 4 + i);

	const prodsByYear = $derived(
		years.map(y => ({
			year: y,
			value: allProductions.filter(p => {
				const d = p.releaseDate || p.createdAt;
				return d && new Date(d).getFullYear() === y;
			}).length,
		}))
	);
	const maxProdYear = $derived(Math.max(...prodsByYear.map(p => p.value), 1));

	// ── Members by Team Category ────────────────────────────────────────────
	const TEAM = [
		{ label: 'Choir Member' as const, color: '#7c3aed' },
		{ label: 'Leadership'   as const, color: '#a855f7' },
		{ label: 'Media Team'   as const, color: '#22d3ee' },
	];

	const membersByTeam = $derived(
		TEAM.map(t => ({
			...t,
			value: allMembers.filter(m => m.teamCategory?.includes(t.label)).length,
		}))
	);
	const totalTeamSlots = $derived(membersByTeam.reduce((s, t) => s + t.value, 0) || 1);

	// ── Enquiries by Status ─────────────────────────────────────────────────
	const ENQ_STATUS = [
		{ label: 'Pending'   as const, color: '#f59e0b' },
		{ label: 'Contacted' as const, color: '#6366f1' },
		{ label: 'Completed' as const, color: '#22c55e' },
	];

	const enquiriesByStatus = $derived(
		ENQ_STATUS.map(s => ({
			...s,
			value: allEnquiries.filter((e: Enquiry) => e.status === s.label).length,
		}))
	);
	const totalEnqAll = $derived(enquiriesByStatus.reduce((s, t) => s + t.value, 0) || 1);

	// ── Donut maths ─────────────────────────────────────────────────────────
	const DONUT_R    = 38;
	const DONUT_CIRC = 2 * Math.PI * DONUT_R; // ≈ 238.76

	function buildDonut(items: { value: number; color: string; label: string }[], total: number) {
		let cum = 0;
		return items.map(item => {
			const dashLen = (item.value / total) * DONUT_CIRC;
			const dashOff = DONUT_CIRC - (cum / total) * DONUT_CIRC;
			cum += item.value;
			return { color: item.color, label: item.label, value: item.value, dashLen, dashOff };
		});
	}

	const memberSegments  = $derived(buildDonut(membersByTeam,      totalTeamSlots));
	const enquirySegments = $derived(buildDonut(enquiriesByStatus,  totalEnqAll));
</script>

<svelte:head><title>Dashboard — SJCU Admin</title></svelte:head>

<div class="space-y-8">

	<!-- Page header -->
	<div>
		<h2 class="font-display text-2xl sm:text-3xl font-bold text-white">
			Dash<span class="purple-gradient-text">board</span> Overview
		</h2>
		<p class="text-sjcu-text-muted text-sm mt-1">Welcome back, Maestro</p>
		
	</div>
	

	{#if loading}
		<LoadingSpinner size="lg" class="py-10" />
	{:else}

		<!-- KPI cards -->
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
			{#each kpis as kpi}
				<div class="stat-card conic-border">
					<div class="flex items-center justify-between mb-2">
						<div class="w-9 h-9 rounded-xl {kpi.bg} flex items-center justify-center">
							<kpi.icon class="w-5 h-5 {kpi.color}" />
						</div>
						<TrendingUp class="w-4 h-4 text-sjcu-text-muted" />
					</div>
					<p use:countUp={{ target: kpi.value, duration: 1200, delay: 300 }}
					   class="font-display text-3xl font-bold text-white">{kpi.value}</p>
					<p class="text-sjcu-text-muted text-xs mt-0.5">{kpi.label}</p>
				</div>
			{/each}
		</div>

		<!-- ═══════════════════════ ANALYTICS ═══════════════════════ -->
		<div>
			<div class="flex items-center gap-2 mb-4">
				<BarChart3 class="w-4 h-4 text-sjcu-accent" />
				<h3 class="text-white font-semibold text-sm tracking-wide uppercase">Analytics</h3>
			</div>

			<!-- Row 1: Category bars + Member donut -->
			<div class="grid lg:grid-cols-3 gap-4 mb-4">

				<!-- Productions by Category — horizontal bar chart -->
				<div class="admin-card lg:col-span-2">
					<div class="flex items-center justify-between mb-5">
						<div>
							<p class="text-white font-semibold text-sm">Productions by Category</p>
							<p class="text-sjcu-text-muted text-xs mt-0.5">{allProductions.length} total productions</p>
						</div>
						<Film class="w-4 h-4 text-sjcu-text-muted" />
					</div>

					<div class="space-y-3.5">
						{#each prodsByCategory as cat, i}
							<div class="flex items-center gap-3">
								<span class="text-sjcu-text-muted text-xs w-36 text-right shrink-0 leading-tight">{cat.label}</span>
								<div class="flex-1 h-4 rounded-full bg-sjcu-navy-2 overflow-hidden">
									<div
										class="h-full rounded-full"
										style="
											width: {chartsReady ? (cat.value / maxProdCat) * 100 : 0}%;
											background: {cat.color};
											transition: width 0.9s cubic-bezier(0.34,1.56,0.64,1) {i * 0.08}s;
										"
									></div>
								</div>
								<span class="text-white text-xs font-bold w-4 text-right shrink-0">{cat.value}</span>
							</div>
						{/each}
					</div>

					{#if allProductions.length === 0}
						<p class="text-sjcu-text-muted text-xs text-center py-6">No productions yet</p>
					{/if}
				</div>

				<!-- Member Composition — donut chart -->
				<div class="admin-card">
					<div class="flex items-center justify-between mb-4">
						<div>
							<p class="text-white font-semibold text-sm">Member Composition</p>
							<p class="text-sjcu-text-muted text-xs mt-0.5">{allMembers.length} members</p>
						</div>
						<PieChart class="w-4 h-4 text-sjcu-text-muted" />
					</div>

					<div class="flex flex-col items-center gap-4">
						<!-- Donut SVG -->
						<div class="relative w-36 h-36">
							<svg viewBox="0 0 100 100" class="w-full h-full -rotate-90">
								<!-- Track ring -->
								<circle cx="50" cy="50" r="{DONUT_R}" fill="none"
									stroke="rgba(255,255,255,0.06)" stroke-width="13" />
								<!-- Segments -->
								{#each memberSegments as seg, i}
									<circle
										cx="50" cy="50" r="{DONUT_R}" fill="none"
										stroke="{seg.color}" stroke-width="13"
										stroke-dasharray="{chartsReady ? seg.dashLen : 0} {DONUT_CIRC}"
										stroke-dashoffset="{seg.dashOff}"
										style="transition: stroke-dasharray 1s cubic-bezier(0.34,1.56,0.64,1) {i * 0.2}s"
									/>
								{/each}
							</svg>
							<!-- Center label -->
							<div class="absolute inset-0 flex flex-col items-center justify-center">
								<span class="text-white font-bold text-lg leading-none">{allMembers.length}</span>
								<span class="text-sjcu-text-muted text-xs">total</span>
							</div>
						</div>

						<!-- Legend -->
						<div class="w-full space-y-1.5">
							{#each membersByTeam as t}
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-2">
										<span class="w-2.5 h-2.5 rounded-full shrink-0" style="background:{t.color}"></span>
										<span class="text-sjcu-text-muted text-xs">{t.label}</span>
									</div>
									<span class="text-white text-xs font-semibold">{t.value}</span>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<!-- Row 2: Year bars + Enquiry pipeline donut -->
			<div class="grid lg:grid-cols-3 gap-4">

				<!-- Productions by Year — vertical bar chart -->
				<div class="admin-card lg:col-span-2">
					<div class="flex items-center justify-between mb-5">
						<div>
							<p class="text-white font-semibold text-sm">Productions Over the Years</p>
							<p class="text-sjcu-text-muted text-xs mt-0.5">Release count per year</p>
						</div>
						<BarChart3 class="w-4 h-4 text-sjcu-text-muted" />
					</div>

					<div class="flex items-end gap-3" style="height:140px">
						{#each prodsByYear as p, i}
							<div class="flex-1 flex flex-col items-center gap-1 h-full justify-end">
								<!-- Value label -->
								<span class="text-white text-xs font-bold" style="
									opacity: {chartsReady ? 1 : 0};
									transition: opacity 0.4s ease {i * 0.1 + 0.6}s;
								">{p.value}</span>
								<!-- Bar -->
								<div class="w-full rounded-t-lg bar-year" style="
									height: {chartsReady ? Math.max((p.value / maxProdYear) * 110, p.value > 0 ? 6 : 0) : 0}px;
									background: linear-gradient(to top, #7c3aed, #c084fc);
									transition: height 0.9s cubic-bezier(0.34,1.56,0.64,1) {i * 0.08}s;
									min-height: 0;
								"></div>
								<!-- Year label -->
								<span class="text-sjcu-text-muted text-xs mt-1">{p.year}</span>
							</div>
						{/each}
					</div>

					{#if allProductions.length === 0}
						<p class="text-sjcu-text-muted text-xs text-center pt-6">No productions yet</p>
					{/if}
				</div>

				<!-- Enquiry Pipeline — donut chart -->
				<div class="admin-card">
					<div class="flex items-center justify-between mb-4">
						<div>
							<p class="text-white font-semibold text-sm">Enquiry Pipeline</p>
							<p class="text-sjcu-text-muted text-xs mt-0.5">{totalEnqAll} total</p>
						</div>
						<PieChart class="w-4 h-4 text-sjcu-text-muted" />
					</div>

					<div class="flex flex-col items-center gap-4">
						<!-- Donut SVG -->
						<div class="relative w-36 h-36">
							<svg viewBox="0 0 100 100" class="w-full h-full -rotate-90">
								<circle cx="50" cy="50" r="{DONUT_R}" fill="none"
									stroke="rgba(255,255,255,0.06)" stroke-width="13" />
								{#each enquirySegments as seg, i}
									<circle
										cx="50" cy="50" r="{DONUT_R}" fill="none"
										stroke="{seg.color}" stroke-width="13"
										stroke-dasharray="{chartsReady ? seg.dashLen : 0} {DONUT_CIRC}"
										stroke-dashoffset="{seg.dashOff}"
										style="transition: stroke-dasharray 1s cubic-bezier(0.34,1.56,0.64,1) {i * 0.2}s"
									/>
								{/each}
							</svg>
							<div class="absolute inset-0 flex flex-col items-center justify-center">
								<span class="text-white font-bold text-lg leading-none">{totalEnqAll}</span>
								<span class="text-sjcu-text-muted text-xs">enquiries</span>
							</div>
						</div>

						<!-- Legend with percentage -->
						<div class="w-full space-y-2">
							{#each enquiriesByStatus as s}
								{@const pct = totalEnqAll > 0 ? Math.round((s.value / totalEnqAll) * 100) : 0}
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-2">
										<span class="w-2.5 h-2.5 rounded-full shrink-0" style="background:{s.color}"></span>
										<span class="text-sjcu-text-muted text-xs">{s.label}</span>
									</div>
									<div class="flex items-center gap-2">
										<span class="text-white text-xs font-semibold">{s.value}</span>
										<span class="text-sjcu-text-muted text-xs">({pct}%)</span>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</div>
		<!-- ════════════════════ END ANALYTICS ═══════════════════════ -->

		<!-- Content lists -->
		<div class="grid lg:grid-cols-3 gap-6">
			<div class="lg:col-span-2 admin-card">
				<div class="flex items-center justify-between mb-5">
					<h3 class="text-white font-semibold">Recent Productions</h3>
					<a href="/admin/productions" class="text-sjcu-accent text-xs hover:text-white transition-colors">View All →</a>
				</div>
				{#if recentProductions.length === 0}
					<p class="text-sjcu-text-muted text-sm text-center py-8">No productions yet</p>
				{:else}
					<div class="space-y-3">
						{#each recentProductions as p}
							<div class="flex items-center gap-3 p-3 rounded-xl bg-sjcu-navy-2 border border-sjcu-border hover:border-sjcu-purple/30 transition-colors">
								{#if p.thumbnail}
									<img src={p.thumbnail} alt={p.title} class="w-12 h-9 rounded-lg object-cover flex-shrink-0" />
								{:else}
									<div class="w-12 h-9 rounded-lg bg-sjcu-purple/20 flex items-center justify-center flex-shrink-0">
										<Film class="w-4 h-4 text-sjcu-accent" />
									</div>
								{/if}
								<div class="flex-1 min-w-0">
									<p class="text-white text-sm font-medium truncate">{p.title}</p>
									<p class="text-sjcu-text-muted text-xs">{p.category}</p>
								</div>
								<span class="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 flex-shrink-0">Published</span>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<div class="space-y-4">
				<div class="admin-card">
					<div class="flex items-center justify-between mb-4">
						<h3 class="text-white font-semibold text-sm">Schedule</h3>
						<Clock class="w-4 h-4 text-sjcu-text-muted" />
					</div>
					{#if upcomingEvents.length === 0}
						<p class="text-sjcu-text-muted text-xs text-center py-4">No upcoming events</p>
					{:else}
						<div class="space-y-3">
							{#each upcomingEvents.slice(0, 3) as ev}
								<div class="p-3 rounded-xl bg-sjcu-navy-2 border border-sjcu-border">
									<p class="text-white text-xs font-medium truncate">{ev.title}</p>
									<p class="text-sjcu-text-muted text-xs mt-1">
										{new Date(ev.date).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
									</p>
								</div>
							{/each}
						</div>
					{/if}
					<a href="/admin/events" class="text-sjcu-accent text-xs hover:text-white transition-colors block mt-3">+ Add Reminder</a>
				</div>

				<div class="admin-card">
					<div class="flex items-center justify-between mb-4">
						<h3 class="text-white font-semibold text-sm">Pending Enquiries</h3>
						<span class="px-2 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-400">{stats.enquiries}</span>
					</div>
					{#if pendingEnquiries.length === 0}
						<p class="text-sjcu-text-muted text-xs text-center py-4">No pending enquiries</p>
					{:else}
						<div class="space-y-2">
							{#each pendingEnquiries.slice(0, 3) as enq}
								<div class="p-2.5 rounded-lg bg-sjcu-navy-2 border border-sjcu-border">
									<p class="text-white text-xs font-medium">{enq.name}</p>
									<p class="text-sjcu-text-muted text-xs">{enq.eventType}</p>
								</div>
							{/each}
						</div>
						<a href="/admin/enquiries" class="text-sjcu-accent text-xs hover:text-white transition-colors block mt-3">View all →</a>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
