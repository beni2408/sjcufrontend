<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.js';
	import { authApi } from '$lib/services/api.js';
	import {
		LayoutDashboard, Users, Film, CalendarDays, Image, MessageSquare,
		Inbox, Settings, LogOut, Plus, ChevronRight, Rocket, Handshake, Star, X,
		ChevronsLeft, Contact as ContactIcon, Mic, UserCircle, Crown
	} from 'lucide-svelte';

	let {
		sidebarOpen = false,
		collapsed   = false,
		onClose,
		onToggleCollapse,
	}: {
		sidebarOpen?:        boolean;
		collapsed?:          boolean;
		onClose?:            () => void;
		onToggleCollapse?:   () => void;
	} = $props();

	const links = [
		{ href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
		{ href: '/admin/productions', label: 'Productions', icon: Film },
		{ href: '/admin/upcoming', label: 'Upcoming Projects', icon: Rocket },
		{ href: '/admin/auditions', label: 'Auditions', icon: Mic },
		{ href: '/admin/events', label: 'Events', icon: CalendarDays },
		{ href: '/admin/members', label: 'Choir Members', icon: Users },
		{ href: '/admin/partners', label: 'Partners', icon: Handshake },
		{ href: '/admin/memorable-events', label: 'Memorable Events', icon: Star },
		{ href: '/admin/gallery', label: 'Media Assets', icon: Image },
		{ href: '/admin/testimonials', label: 'Testimonials', icon: MessageSquare },
		{ href: '/admin/enquiries', label: 'Enquiries', icon: Inbox },
		{ href: '/admin/contacts', label: 'Contacts', icon: ContactIcon },
		{ href: '/admin/settings', label: 'Settings', icon: Settings },
		{ href: '/admin/admins',  label: 'Manage Admins', icon: Crown },
		{ href: '/admin/profile', label: 'My Profile', icon: UserCircle },
	];

	async function handleLogout() {
		await authApi.logout().catch(() => {});
		authStore.logout();
		goto('/admin/login');
	}

	function handleNavClick() {
		onClose?.();
	}
</script>

<!-- Mobile: fixed overlay drawer; Desktop (lg+): static sidebar with collapse support -->
<aside
	class="
		fixed inset-y-0 left-0 z-30 flex-shrink-0 bg-sjcu-navy border-r border-sjcu-border flex flex-col overflow-hidden
		transition-[transform,width] duration-300 ease-in-out
		{sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
		lg:static lg:translate-x-0 lg:z-auto
		{collapsed ? 'lg:w-16' : 'lg:w-64'}
		w-64
	"
>
	<!-- Header: logo + collapse toggle (desktop) / close button (mobile) -->
	<div class="relative flex-shrink-0 border-b border-sjcu-border overflow-hidden">
		<!-- Gradient backdrop -->
		<div class="absolute inset-0 pointer-events-none" style="background: linear-gradient(135deg, rgba(109,40,217,0.18) 0%, rgba(10,10,26,0) 70%);"></div>
		<div class="absolute -top-6 -left-6 w-28 h-28 rounded-full pointer-events-none" style="background: radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%); filter: blur(16px);"></div>

		<div class="relative flex items-center justify-between px-3 py-3 gap-2 {collapsed ? 'lg:justify-center' : ''}">
			<div class="flex items-center gap-3 min-w-0">
				<!-- Logo with glow ring — clickable to expand when collapsed -->
				<button
					onclick={collapsed ? onToggleCollapse : undefined}
					class="relative flex-shrink-0 {collapsed ? 'lg:cursor-pointer' : 'cursor-default'}"
					title={collapsed ? 'Expand sidebar' : undefined}
					tabindex={collapsed ? 0 : -1}
					type="button"
				>
					<div class="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center transition-all duration-300 {collapsed ? 'hover:scale-105' : ''}"
						style="border: 2px solid rgba(139,92,246,0.55); box-shadow: 0 0 18px rgba(124,58,237,0.45), inset 0 0 8px rgba(124,58,237,0.1); background: rgba(255,255,255,0.05);">
						<img src="/logo.png" alt="SJCU" class="w-10 h-10 object-contain" />
					</div>
					<!-- Outer pulse ring -->
					<span class="absolute inset-0 rounded-full border border-sjcu-purple/40 animate-ping" style="animation-duration:3s; animation-timing-function:ease-out;"></span>
				</button>

				<!-- Text block -->
				<div class="flex flex-col leading-none min-w-0 {collapsed ? 'lg:hidden' : ''}">
					<div class="flex items-center gap-1.5 mb-0.5">
						<span class="font-display font-extrabold text-white text-sm tracking-tight truncate">St. John's</span>
					</div>
					<span class="font-display font-bold text-xs tracking-[0.2em] uppercase truncate" style="background: linear-gradient(90deg,#a78bfa,#7c3aed); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;">Carol Union</span>
					<span class="text-[9px] font-semibold tracking-[0.25em] uppercase text-sjcu-text-muted mt-1">Admin Portal</span>
				</div>
			</div>

			<div class="flex items-center gap-1 flex-shrink-0">
				{#if !collapsed}
				<button
					onclick={onToggleCollapse}
					class="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg text-sjcu-text-muted hover:text-sjcu-text-primary hover:bg-white/10 transition-colors"
					aria-label="Collapse sidebar"
					title="Collapse sidebar"
				>
					<ChevronsLeft class="w-4 h-4" />
				</button>
				{/if}
				<button
					onclick={onClose}
					class="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-sjcu-text-muted hover:text-white hover:bg-white/10 transition-colors"
					aria-label="Close menu"
				>
					<X class="w-4 h-4" />
				</button>
			</div>
		</div>
	</div>

	<!-- User info (hidden when collapsed) -->
	<div class="p-4 border-b border-sjcu-border flex-shrink-0 {collapsed ? 'lg:hidden' : ''}">
		<p class="text-sjcu-text-muted text-xs mb-2 px-2 uppercase tracking-widest">Welcome back,</p>
		<p class="text-sjcu-text-primary font-semibold text-sm px-2">{$authStore.user?.name || 'Admin'}</p>
		<p class="text-sjcu-text-muted text-xs px-2">{$authStore.user?.role || ''}</p>
	</div>

	<!-- Nav links -->
	<nav class="flex-1 p-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
		<p class="text-sjcu-text-muted text-xs px-3 py-2 uppercase tracking-widest {collapsed ? 'hidden' : 'hidden lg:block'}">Admin Panel</p>
		{#each links as link}
			<a
				href={link.href}
				onclick={handleNavClick}
				class="admin-sidebar-link {$page.url.pathname === link.href ? 'active' : ''} {collapsed ? 'lg:justify-center lg:px-0' : ''}"
				title={collapsed ? link.label : ''}
			>
				<link.icon class="w-4 h-4 flex-shrink-0" />
				<span class="truncate {collapsed ? 'lg:hidden' : ''}">{link.label}</span>
				{#if $page.url.pathname === link.href && !collapsed}
					<ChevronRight class="w-3.5 h-3.5 ml-auto hidden lg:block" />
				{/if}
			</a>
		{/each}
	</nav>

	<!-- Bottom actions -->
	<div class="p-2 border-t border-sjcu-border space-y-1 flex-shrink-0">
		{#if collapsed}
			<!-- Icon-only mode -->
			<a
				href="/admin/productions"
				onclick={handleNavClick}
				title="New Production"
				class="hidden lg:flex w-full items-center justify-center p-2.5 rounded-xl bg-sjcu-purple text-white hover:bg-sjcu-purple-light transition-colors card-ripple btn-glow-hover"
			>
				<Plus class="w-4 h-4" />
			</a>
			<button
				onclick={handleLogout}
				title="Logout"
				class="hidden lg:flex w-full items-center justify-center p-2.5 rounded-xl text-sjcu-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
			>
				<LogOut class="w-4 h-4" />
			</button>
		{/if}
		<!-- Full labels (mobile always + desktop when expanded) -->
		<a
			href="/admin/productions"
			onclick={handleNavClick}
			class="card-ripple btn-glow-hover flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sjcu-purple text-white text-sm font-medium hover:bg-sjcu-purple-light transition-colors {collapsed ? 'lg:hidden' : ''}"
		>
			<Plus class="w-4 h-4" />
			New Production
		</a>
		<button
			onclick={handleLogout}
			class="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sjcu-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 text-sm {collapsed ? 'lg:hidden' : ''}"
		>
			<LogOut class="w-4 h-4" />
			Logout
		</button>
	</div>
</aside>
