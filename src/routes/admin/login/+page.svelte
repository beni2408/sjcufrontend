<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Lock, Mail, Eye, EyeOff, Music2 } from 'lucide-svelte';
	import { authApi } from '$lib/services/api.js';
	import { authStore } from '$lib/stores/auth.js';
	import { showToast } from '$lib/stores/ui.js';

	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let loading = $state(false);
	let errors = $state<{ email?: string; password?: string }>({});

	onMount(() => {
		if ($authStore.token) goto('/admin/dashboard');
	});

	async function handleLogin(e: SubmitEvent) {
		e.preventDefault();
		errors = {};

		if (!email) { errors.email = 'Email is required'; return; }
		if (!password) { errors.password = 'Password is required'; return; }

		loading = true;
		try {
			const res = await authApi.login(email, password);
			const { token, user } = res.data.data;
			authStore.login(token, user);
			showToast(`Welcome back, ${user.name}!`, 'success');
			goto('/admin/dashboard');
		} catch (err: any) {
			showToast(err.response?.data?.message || 'Invalid credentials', 'error');
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Admin Login — St. John's Carol Union</title>
</svelte:head>

<div class="min-h-screen bg-sjcu-dark flex">
	<div class="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-sjcu-navy-2 via-sjcu-purple-dim/30 to-sjcu-dark flex-col items-center justify-center p-12">
		<div class="absolute inset-0 bg-purple-glow opacity-40 pointer-events-none"></div>
		<div class="relative z-10 flex flex-col items-center text-center gap-8">
			<div class="w-32 h-32 rounded-full bg-white/10 border-2 border-white/20 overflow-hidden flex items-center justify-center">
				<img src="/logo.png" alt="SJCU" class="w-28 h-28 object-contain" />
			</div>
			<div>
				<h1 class="font-display text-4xl font-bold text-sjcu-text-primary mb-2">St. John's Carol Union</h1>
				<p class="text-sjcu-accent text-sm tracking-widest uppercase">Administration Portal</p>
			</div>
			<div class="grid grid-cols-2 gap-4 w-full max-w-xs">
				{#each [{ label: 'Productions', value: 'Manage' }, { label: 'Events', value: 'Track' }, { label: 'Members', value: 'Direct' }, { label: 'Gallery', value: 'Curate' }] as stat}
					<div class="glass-card p-4 text-center">
						<p class="text-sjcu-text-primary font-semibold text-sm">{stat.value}</p>
						<p class="text-sjcu-text-muted text-xs">{stat.label}</p>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<div class="flex-1 flex items-center justify-center p-8">
		<div class="w-full max-w-md">
			<div class="lg:hidden flex items-center gap-3 mb-8 justify-center">
				<div class="w-12 h-12 rounded-full bg-white/10 border border-white/20 overflow-hidden flex items-center justify-center">
					<img src="/logo.png" alt="SJCU" class="w-10 h-10 object-contain" />
				</div>
				<span class="font-display text-xl font-bold text-sjcu-text-primary">SJCU Admin</span>
			</div>

			<div class="mb-8">
				<h2 class="font-display text-3xl font-bold text-sjcu-text-primary mb-2">Welcome Back</h2>
				<p class="text-sjcu-text-secondary">Sign in to access the administration panel</p>
			</div>

			<form onsubmit={handleLogin} class="space-y-5" novalidate>
				<div>
					<label class="block text-sjcu-text-secondary text-sm mb-1.5" for="email">Email Address</label>
					<div class="relative">
						<Mail class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sjcu-text-muted pointer-events-none" />
						<input
							id="email"
							type="email"
							placeholder="admin@sjcu.com"
							bind:value={email}
							class="admin-input pl-10 {errors.email ? 'border-red-500/50' : ''}"
							autocomplete="email"
						/>
					</div>
					{#if errors.email}<p class="text-red-400 text-xs mt-1">{errors.email}</p>{/if}
				</div>

				<div>
					<label class="block text-sjcu-text-secondary text-sm mb-1.5" for="password">Password</label>
					<div class="relative">
						<Lock class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sjcu-text-muted pointer-events-none" />
						<input
							id="password"
							type={showPassword ? 'text' : 'password'}
							placeholder="Enter your password"
							bind:value={password}
							class="admin-input pl-10 pr-10 {errors.password ? 'border-red-500/50' : ''}"
							autocomplete="current-password"
						/>
						<button
							type="button"
							onclick={() => (showPassword = !showPassword)}
							class="absolute right-3.5 top-1/2 -translate-y-1/2 text-sjcu-text-muted hover:text-white transition-colors"
							aria-label="Toggle password visibility"
						>
							{#if showPassword}
								<EyeOff class="w-4 h-4" />
							{:else}
								<Eye class="w-4 h-4" />
							{/if}
						</button>
					</div>
					{#if errors.password}<p class="text-red-400 text-xs mt-1">{errors.password}</p>{/if}
				</div>

				<button type="submit" class="btn-primary w-full justify-center py-3.5" disabled={loading}>
					{#if loading}
						<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
						Signing in...
					{:else}
						Sign In to Dashboard
					{/if}
				</button>
			</form>

			<p class="text-sjcu-text-muted text-xs text-center mt-8">
				Authorized personnel only. All activity is logged.
			</p>
		</div>
	</div>
</div>
