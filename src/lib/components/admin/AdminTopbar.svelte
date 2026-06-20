<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { Search, Bell, Menu, Sun, Moon, UserCircle2, X, Mic, MessageSquare } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.js';
	import { page } from '$app/stores';
	import { themeStore } from '$lib/stores/theme.js';
	import { auditionApplicationsApi, testimonialsApi } from '$lib/services/api.js';
	import type { AuditionApplication } from '$lib/types/index.js';

	let { onMenuToggle }: { onMenuToggle?: () => void } = $props();

	const pageNames: Record<string, string> = {
		'/admin/dashboard': 'Dashboard Overview',
		'/admin/productions': 'Productions Management',
		'/admin/upcoming': 'Upcoming Projects',
		'/admin/events': 'Events & Performances',
		'/admin/members': 'Choir Members',
		'/admin/partners': 'Partners',
		'/admin/memorable-events': 'Memorable Events',
		'/admin/gallery': 'Media Assets',
		'/admin/testimonials': 'Testimonials',
		'/admin/enquiries': 'Production Enquiries',
		'/admin/auditions': 'Auditions',
		'/admin/contacts': 'Contacts',
		'/admin/settings': 'Settings',
		'/admin/admins':   'Manage Admins',
		'/admin/profile': 'My Profile',
	};

	let currentPage = $derived(pageNames[$page.url.pathname] || 'Admin Panel');
	let initials = $derived(
		$authStore.user?.name
			?.split(' ')
			.map((n) => n[0])
			.slice(0, 2)
			.join('')
			.toUpperCase() || 'A'
	);

	const SEEN_KEY = 'sjcu_notif_seen_at';

	let notifications = $state<AuditionApplication[]>([]);
	let pendingReviews = $state(0);
	let seenAt = $state<Date>(new Date(browser ? (localStorage.getItem(SEEN_KEY) ?? 0) : 0));
	let open = $state(false);
	let panelEl = $state<HTMLDivElement | null>(null);

	let unreadCount = $derived(
		notifications.filter((n) => new Date(n.createdAt) > seenAt).length + pendingReviews
	);

	async function fetchNotifications() {
		if (!$authStore.token) return;
		try {
			const [appsRes, reviewsRes] = await Promise.all([
				auditionApplicationsApi.getRecent(),
				testimonialsApi.getPendingCount(),
			]);
			notifications = appsRes.data.data.applications ?? [];
			pendingReviews = reviewsRes.data.data.count ?? 0;
		} catch {
			// silently fail — don't disrupt the admin layout on polling errors
		}
	}

	function markSeen() {
		const now = new Date();
		seenAt = now;
		localStorage.setItem(SEEN_KEY, now.toISOString());
	}

	function toggleOpen() {
		open = !open;
		if (open) markSeen();
	}

	function handleOutsideClick(e: MouseEvent) {
		if (open && panelEl && !panelEl.contains(e.target as Node)) {
			open = false;
		}
	}

	function timeAgo(iso: string) {
		const diff = Date.now() - new Date(iso).getTime();
		const m = Math.floor(diff / 60000);
		if (m < 1) return 'just now';
		if (m < 60) return `${m}m ago`;
		const h = Math.floor(m / 60);
		if (h < 24) return `${h}h ago`;
		return `${Math.floor(h / 24)}d ago`;
	}

	function getAuditionId(app: AuditionApplication) {
		return typeof app.audition === 'object' ? app.audition._id : app.audition;
	}
	function getAuditionTitle(app: AuditionApplication) {
		return typeof app.audition === 'object' ? app.audition.title : 'Audition';
	}

	onMount(() => {
		fetchNotifications();
		const interval = setInterval(fetchNotifications, 30000);
		document.addEventListener('click', handleOutsideClick, true);
		return () => {
			clearInterval(interval);
			document.removeEventListener('click', handleOutsideClick, true);
		};
	});
</script>

<header class="h-14 bg-sjcu-navy border-b border-sjcu-border flex items-center justify-between px-4 sm:px-6 flex-shrink-0 gap-3">
	<div class="flex items-center gap-3 min-w-0">
		<button
			onclick={onMenuToggle}
			class="lg:hidden flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-sjcu-text-muted hover:text-sjcu-text-primary hover:bg-sjcu-purple/10 transition-colors"
			aria-label="Toggle menu"
		>
			<Menu class="w-5 h-5" />
		</button>
		<h1 class="text-sjcu-text-primary font-semibold text-sm sm:text-base truncate">{currentPage}</h1>
	</div>

	<div class="flex items-center gap-2 sm:gap-3 flex-shrink-0">
		<div class="relative hidden md:block">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sjcu-text-muted pointer-events-none" />
			<input
				type="text"
				placeholder="Search..."
				class="bg-sjcu-dark border border-sjcu-border text-sjcu-text-primary placeholder-sjcu-text-muted rounded-xl pl-9 pr-4 py-2 text-sm w-44 lg:w-56 focus:outline-none focus:border-sjcu-purple transition-colors"
			/>
		</div>

		<button
			onclick={() => themeStore.toggle()}
			class="icon-bounce relative w-9 h-9 rounded-lg bg-sjcu-dark border border-sjcu-border flex items-center justify-center text-sjcu-text-muted hover:text-sjcu-accent hover:border-sjcu-purple/40 transition-colors"
			aria-label="Toggle theme"
		>
			{#if $themeStore === 'dark'}
				<Sun class="w-4 h-4" />
			{:else}
				<Moon class="w-4 h-4" />
			{/if}
		</button>

		<!-- Bell / Notifications -->
		<div class="relative" bind:this={panelEl}>
			<button
				onclick={toggleOpen}
				class="icon-bounce relative w-9 h-9 rounded-lg bg-sjcu-dark border border-sjcu-border flex items-center justify-center text-sjcu-text-muted hover:text-sjcu-text-primary hover:border-sjcu-purple/40 transition-colors"
				aria-label="Notifications"
			>
				<Bell class="w-4 h-4" />
				{#if unreadCount > 0}
					<span class="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
						{unreadCount > 9 ? '9+' : unreadCount}
					</span>
				{/if}
			</button>

			{#if open}
				<div class="absolute right-0 top-11 w-80 bg-sjcu-navy border border-sjcu-border rounded-2xl shadow-2xl z-50 overflow-hidden">
					<!-- Header -->
					<div class="flex items-center justify-between px-4 py-3 border-b border-sjcu-border">
						<span class="text-sjcu-text-primary font-semibold text-sm">Notifications</span>
						<button onclick={() => (open = false)} class="text-sjcu-text-muted hover:text-sjcu-text-primary transition-colors">
							<X class="w-4 h-4" />
						</button>
					</div>

					<!-- List -->
					<div class="max-h-80 overflow-y-auto divide-y divide-sjcu-border/50">
						<!-- Pending reviews row -->
						{#if pendingReviews > 0}
							<button
								onclick={() => { open = false; goto('/admin/testimonials'); }}
								class="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-sjcu-purple/10 transition-colors bg-amber-500/5"
							>
								<div class="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
									<MessageSquare class="w-4 h-4 text-amber-400" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2">
										<p class="text-sjcu-text-primary text-sm font-medium">
											{pendingReviews} review{pendingReviews > 1 ? 's' : ''} awaiting approval
										</p>
										<span class="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0"></span>
									</div>
									<p class="text-sjcu-text-muted text-xs mt-0.5">Click to review and publish</p>
								</div>
							</button>
						{/if}

						<!-- Audition applications -->
						{#if notifications.length === 0 && pendingReviews === 0}
							<div class="py-10 text-center text-sjcu-text-muted text-sm">No notifications</div>
						{:else}
							{#each notifications as notif}
								{@const isNew = new Date(notif.createdAt) > seenAt}
								<button
									onclick={() => { open = false; goto(`/admin/auditions/${getAuditionId(notif)}/applications`); }}
									class="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-sjcu-purple/10 transition-colors {isNew ? 'bg-sjcu-purple/5' : ''}"
								>
									{#if notif.photo}
										<img src={notif.photo} alt={notif.name} class="w-9 h-9 rounded-full object-cover border border-sjcu-border flex-shrink-0 mt-0.5" />
									{:else}
										<div class="w-9 h-9 rounded-full bg-sjcu-purple/20 border border-sjcu-border flex items-center justify-center flex-shrink-0 mt-0.5">
											<UserCircle2 class="w-5 h-5 text-sjcu-text-muted" />
										</div>
									{/if}
									<div class="flex-1 min-w-0">
										<div class="flex items-center gap-2">
											<p class="text-sjcu-text-primary text-sm font-medium truncate">{notif.name}</p>
											{#if isNew}
												<span class="w-2 h-2 rounded-full bg-sjcu-accent flex-shrink-0"></span>
											{/if}
										</div>
										<div class="flex items-center gap-1.5 mt-0.5">
											<Mic class="w-3 h-3 text-sjcu-accent flex-shrink-0" />
											<p class="text-sjcu-text-muted text-xs truncate">{getAuditionTitle(notif)}</p>
										</div>
										<p class="text-sjcu-text-muted text-xs mt-0.5">{timeAgo(notif.createdAt)}</p>
									</div>
								</button>
							{/each}
						{/if}
					</div>

					<!-- Footer -->
					<div class="border-t border-sjcu-border px-4 py-2.5 flex gap-4">
						<button
							onclick={() => { open = false; goto('/admin/auditions'); }}
							class="text-sjcu-accent text-xs hover:underline"
						>
							View all auditions →
						</button>
						{#if pendingReviews > 0}
							<button
								onclick={() => { open = false; goto('/admin/testimonials'); }}
								class="text-amber-400 text-xs hover:underline"
							>
								Review testimonials →
							</button>
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<a
			href="/admin/profile"
			title="My Profile"
			class="w-9 h-9 rounded-full bg-sjcu-purple/30 border border-sjcu-purple/50 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden hover:ring-2 hover:ring-sjcu-accent transition-all"
		>
			{#if $authStore.user?.avatar}
				<img src={$authStore.user.avatar} alt="avatar" class="w-full h-full object-cover" />
			{:else}
				{initials}
			{/if}
		</a>
	</div>
</header>
