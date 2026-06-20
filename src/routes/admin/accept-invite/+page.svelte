<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Eye, EyeOff, ShieldCheck, AlertTriangle, Loader2 } from 'lucide-svelte';
	import { adminsApi } from '$lib/services/api.js';
	import { authStore } from '$lib/stores/auth.js';

	const token = $derived($page.url.searchParams.get('token') ?? '');

	let password    = $state('');
	let confirm     = $state('');
	let showPass    = $state(false);
	let showConfirm = $state(false);
	let loading     = $state(false);
	let done        = $state(false);
	let error       = $state('');

	onMount(() => {
		if (!token) error = 'Invalid invitation link. Please check your email for the correct link.';
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		if (password.length < 6)   { error = 'Password must be at least 6 characters'; return; }
		if (password !== confirm)   { error = 'Passwords do not match'; return; }

		loading = true;
		try {
			const res = await adminsApi.acceptInvite({ token, password });
			const { token: jwt, user } = res.data.data;
			authStore.login(jwt, user);
			done = true;
			setTimeout(() => goto('/admin/dashboard'), 2000);
		} catch (err: any) {
			error = err.response?.data?.message || 'Something went wrong. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head><title>Accept Invitation — SJCU Admin</title></svelte:head>

<div class="min-h-screen flex items-center justify-center p-4" style="background: rgb(var(--sjcu-dark));">
	<div class="w-full max-w-md">

		<!-- Logo -->
		<div class="text-center mb-8">
			<div class="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
				style="border: 2px solid rgba(139,92,246,0.55); box-shadow: 0 0 24px rgba(124,58,237,0.4); background: rgba(255,255,255,0.05);">
				<img src="/logo.png" alt="SJCU" class="w-16 h-16 object-contain" />
			</div>
			<p class="text-sjcu-text-muted text-xs tracking-[0.25em] uppercase font-semibold">St. John's Carol Union</p>
		</div>

		<div class="rounded-2xl p-8 space-y-6" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);">

			{#if done}
				<!-- Success state -->
				<div class="text-center space-y-4 py-4">
					<div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style="background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.3);">
						<ShieldCheck class="w-8 h-8 text-green-400" />
					</div>
					<h2 class="font-display text-2xl font-bold text-white">Welcome Aboard!</h2>
					<p class="text-sjcu-text-muted text-sm">Your account is activated. Redirecting to dashboard…</p>
					<div class="flex justify-center">
						<Loader2 class="w-5 h-5 text-sjcu-accent animate-spin" />
					</div>
				</div>

			{:else if !token}
				<!-- Invalid link -->
				<div class="text-center space-y-3 py-4">
					<AlertTriangle class="w-12 h-12 text-amber-400 mx-auto" />
					<h2 class="font-display text-xl font-bold text-white">Invalid Invitation</h2>
					<p class="text-sjcu-text-muted text-sm">{error}</p>
				</div>

			{:else}
				<!-- Set password form -->
				<div class="text-center space-y-1">
					<h2 class="font-display text-2xl font-bold text-white">Accept Invitation</h2>
					<p class="text-sjcu-text-muted text-sm">You've been invited as an SJCU Admin. Set your password to get started.</p>
				</div>

				{#if error}
					<div class="flex items-center gap-2 p-3 rounded-lg text-sm" style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #f87171;">
						<AlertTriangle class="w-4 h-4 flex-shrink-0" />
						{error}
					</div>
				{/if}

				<form onsubmit={handleSubmit} class="space-y-4">
					<div>
						<label class="block text-sjcu-text-secondary text-sm mb-1.5">New Password</label>
						<div class="relative">
							<input
								type={showPass ? 'text' : 'password'}
								bind:value={password}
								placeholder="At least 6 characters"
								class="admin-input pr-10"
								required
							/>
							<button type="button" onclick={() => showPass = !showPass}
								class="absolute right-3 top-1/2 -translate-y-1/2 text-sjcu-text-muted hover:text-sjcu-text-primary transition-colors">
								{#if showPass}<EyeOff class="w-4 h-4" />{:else}<Eye class="w-4 h-4" />{/if}
							</button>
						</div>
					</div>

					<div>
						<label class="block text-sjcu-text-secondary text-sm mb-1.5">Confirm Password</label>
						<div class="relative">
							<input
								type={showConfirm ? 'text' : 'password'}
								bind:value={confirm}
								placeholder="Repeat your password"
								class="admin-input pr-10"
								required
							/>
							<button type="button" onclick={() => showConfirm = !showConfirm}
								class="absolute right-3 top-1/2 -translate-y-1/2 text-sjcu-text-muted hover:text-sjcu-text-primary transition-colors">
								{#if showConfirm}<EyeOff class="w-4 h-4" />{:else}<Eye class="w-4 h-4" />{/if}
							</button>
						</div>
					</div>

					<button type="submit" disabled={loading} class="btn-primary w-full justify-center mt-2">
						{#if loading}
							<Loader2 class="w-4 h-4 animate-spin" /> Activating…
						{:else}
							<ShieldCheck class="w-4 h-4" /> Activate My Account
						{/if}
					</button>
				</form>
			{/if}
		</div>

		<p class="text-center text-sjcu-text-muted text-xs mt-6">
			St. John's Carol Union &mdash; Admin Portal
		</p>
	</div>
</div>
