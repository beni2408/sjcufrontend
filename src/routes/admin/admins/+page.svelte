<script lang="ts">
	import { onMount } from 'svelte';
	import { ShieldCheck, Shield, UserPlus, Trash2, RefreshCw, Crown, Lock, Mail, Clock } from 'lucide-svelte';
	import { adminsApi } from '$lib/services/api.js';
	import { authStore } from '$lib/stores/auth.js';
	import { showToast } from '$lib/stores/ui.js';
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';

	const isSuperAdmin = $derived($authStore.user?.role === 'super_admin');
	const currentId    = $derived($authStore.user?._id ?? $authStore.user?.id ?? '');

	type Admin = { _id: string; name: string; email: string; role: string; createdAt: string; avatar?: string };

	let admins   = $state<Admin[]>([]);
	let loading  = $state(true);
	let deleting = $state<string | null>(null);
	let updating = $state<string | null>(null);

	// New admin form
	let showForm  = $state(false);
	let saving    = $state(false);
	let resending = $state<string | null>(null);
	let form = $state({ name: '', email: '', role: 'admin' });
	let errors = $state<Record<string, string>>({});

	async function loadAdmins() {
		loading = true;
		try {
			const res = await adminsApi.list();
			admins = res.data.data.admins;
		} catch {
			showToast('Failed to load admins', 'error');
		} finally {
			loading = false;
		}
	}

	async function handleCreate(e: SubmitEvent) {
		e.preventDefault();
		errors = {};
		if (!form.name.trim())  { errors.name  = 'Name is required'; return; }
		if (!form.email.trim()) { errors.email = 'Email is required'; return; }

		saving = true;
		try {
			await adminsApi.create(form);
			showToast(`Invitation sent to ${form.email}!`, 'success');
			form = { name: '', email: '', role: 'admin' };
			showForm = false;
			await loadAdmins();
		} catch (err: any) {
			showToast(err.response?.data?.message || 'Failed to send invitation', 'error');
		} finally {
			saving = false;
		}
	}

	async function handleResendInvite(admin: Admin) {
		resending = admin._id;
		try {
			await adminsApi.resendInvite(admin._id);
			showToast(`Invitation resent to ${admin.email}`, 'success');
		} catch (err: any) {
			showToast(err.response?.data?.message || 'Failed to resend invitation', 'error');
		} finally {
			resending = null;
		}
	}

	async function toggleRole(admin: Admin) {
		const newRole = admin.role === 'super_admin' ? 'admin' : 'super_admin';
		const label   = newRole === 'super_admin' ? 'promote to Super Admin' : 'demote to Admin';
		if (!confirm(`Are you sure you want to ${label} "${admin.name}"?`)) return;

		updating = admin._id;
		try {
			await adminsApi.updateRole(admin._id, newRole);
			admins = admins.map(a => a._id === admin._id ? { ...a, role: newRole } : a);
			showToast(`${admin.name} is now ${newRole === 'super_admin' ? 'Super Admin' : 'Admin'}`, 'success');
		} catch (err: any) {
			showToast(err.response?.data?.message || 'Failed to update role', 'error');
		} finally {
			updating = null;
		}
	}

	async function handleDelete(admin: Admin) {
		if (!confirm(`Remove "${admin.name}" from admin panel? This cannot be undone.`)) return;
		deleting = admin._id;
		try {
			await adminsApi.delete(admin._id);
			admins = admins.filter(a => a._id !== admin._id);
			showToast(`${admin.name} removed`, 'success');
		} catch (err: any) {
			showToast(err.response?.data?.message || 'Failed to delete', 'error');
		} finally {
			deleting = null;
		}
	}

	onMount(loadAdmins);
</script>

<svelte:head><title>Manage Admins — SJCU</title></svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between flex-wrap gap-4">
		<div>
			<h2 class="font-display text-2xl font-bold text-white flex items-center gap-2">
				<Crown class="w-6 h-6 text-sjcu-accent" /> Manage Admins
			</h2>
			<p class="text-sjcu-text-muted text-sm mt-1">Add, remove or change roles of admin users</p>
		</div>
		{#if isSuperAdmin}
		<button onclick={() => { showForm = !showForm; errors = {}; }} class="btn-primary gap-2">
			<UserPlus class="w-4 h-4" />
			{showForm ? 'Cancel' : 'Add New Admin'}
		</button>
		{/if}
	</div>

	{#if !isSuperAdmin}
		<div class="admin-card flex flex-col items-center py-16 gap-3 text-center">
			<Lock class="w-10 h-10 text-red-400" />
			<p class="text-sjcu-text-primary font-semibold">Super Admin Access Required</p>
			<p class="text-sjcu-text-muted text-sm">Only super admins can manage admin accounts.</p>
		</div>
	{:else}
		<!-- Add Admin Form -->
		{#if showForm}
			<div class="admin-card space-y-4" style="border: 1px solid rgba(124,58,237,0.4);">
				<h3 class="text-white font-semibold flex items-center gap-2">
					<UserPlus class="w-4 h-4 text-sjcu-accent" /> New Admin Account
				</h3>
				<p class="text-sjcu-text-muted text-xs flex items-center gap-1.5">
					<Mail class="w-3.5 h-3.5" />
					An invitation email will be sent — the admin sets their own password when they accept.
				</p>
				<form onsubmit={handleCreate} class="space-y-4">
					<div class="grid sm:grid-cols-2 gap-4">
						<div>
							<label class="block text-sjcu-text-secondary text-sm mb-1.5">Full Name *</label>
							<input bind:value={form.name} class="admin-input {errors.name ? 'border-red-500/50' : ''}" placeholder="John Doe" />
							{#if errors.name}<p class="text-red-400 text-xs mt-1">{errors.name}</p>{/if}
						</div>
						<div>
							<label class="block text-sjcu-text-secondary text-sm mb-1.5">Email Address *</label>
							<input bind:value={form.email} type="email" class="admin-input {errors.email ? 'border-red-500/50' : ''}" placeholder="admin@sjcu.com" />
							{#if errors.email}<p class="text-red-400 text-xs mt-1">{errors.email}</p>{/if}
						</div>
					</div>
					<div>
						<label class="block text-sjcu-text-secondary text-sm mb-1.5">Role</label>
						<select bind:value={form.role} class="admin-input">
							<option value="admin">Admin</option>
							<option value="super_admin">Super Admin</option>
						</select>
					</div>
					<div class="flex items-center gap-3 pt-1">
						<button type="submit" class="btn-primary" disabled={saving}>
							<Mail class="w-4 h-4" />
							{saving ? 'Sending Invite…' : 'Send Invitation'}
						</button>
					</div>
				</form>
			</div>
		{/if}

		<!-- Admins list -->
		{#if loading}
			<LoadingSpinner size="lg" class="py-20" />
		{:else}
			<div class="space-y-3">
				{#each admins as admin (admin._id)}
					<div class="admin-card flex items-center gap-4 {admin._id === currentId ? 'ring-1 ring-sjcu-purple/40' : ''}">
						<!-- Avatar -->
						<div class="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
							style="background: linear-gradient(135deg,#7c3aed,#9d4edd);">
							{#if admin.avatar}
								<img src={admin.avatar} alt={admin.name} class="w-full h-full rounded-full object-cover" />
							{:else}
								{admin.name.charAt(0).toUpperCase()}
							{/if}
						</div>

						<!-- Info -->
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 flex-wrap">
								<p class="text-sjcu-text-primary font-semibold text-sm truncate">{admin.name}</p>
								{#if admin._id === currentId}
									<span class="text-[10px] px-1.5 py-0.5 rounded font-bold" style="background:rgba(124,58,237,0.2);color:#a78bfa;border:1px solid rgba(124,58,237,0.3);">YOU</span>
								{/if}
								{#if admin.status === 'pending'}
									<span class="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded font-bold" style="background:rgba(245,158,11,0.15);color:#fbbf24;border:1px solid rgba(245,158,11,0.3);">
										<Clock class="w-2.5 h-2.5" /> Invite Pending
									</span>
								{/if}
							</div>
							<p class="text-sjcu-text-muted text-xs truncate">{admin.email}</p>
							<p class="text-sjcu-text-muted text-xs">
								{admin.status === 'pending' ? 'Invitation sent' : 'Joined'} {new Date(admin.createdAt).toLocaleDateString()}
							</p>
						</div>

						<!-- Role badge -->
						<div class="flex-shrink-0">
							{#if admin.role === 'super_admin'}
								<span class="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full" style="background:rgba(245,158,11,0.15);color:#fbbf24;border:1px solid rgba(245,158,11,0.3);">
									<ShieldCheck class="w-3.5 h-3.5" /> Super Admin
								</span>
							{:else}
								<span class="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full" style="background:rgba(124,58,237,0.15);color:#a78bfa;border:1px solid rgba(124,58,237,0.3);">
									<Shield class="w-3.5 h-3.5" /> Admin
								</span>
							{/if}
						</div>

						<!-- Actions (not on self) -->
						{#if admin._id !== currentId}
							<div class="flex items-center gap-1 flex-shrink-0">
								{#if admin.status === 'pending'}
									<!-- Resend invite -->
									<button
										onclick={() => handleResendInvite(admin)}
										disabled={resending === admin._id}
										title="Resend invitation email"
										class="w-8 h-8 flex items-center justify-center rounded-lg text-sjcu-text-muted hover:text-amber-400 hover:bg-amber-400/10 transition-colors disabled:opacity-40"
									>
										{#if resending === admin._id}
											<RefreshCw class="w-4 h-4 animate-spin" />
										{:else}
											<Mail class="w-4 h-4" />
										{/if}
									</button>
								{:else}
									<!-- Toggle role -->
									<button
										onclick={() => toggleRole(admin)}
										disabled={updating === admin._id}
										title={admin.role === 'super_admin' ? 'Demote to Admin' : 'Promote to Super Admin'}
										class="w-8 h-8 flex items-center justify-center rounded-lg text-sjcu-text-muted hover:text-amber-400 hover:bg-amber-400/10 transition-colors disabled:opacity-40"
									>
										{#if updating === admin._id}
											<RefreshCw class="w-4 h-4 animate-spin" />
										{:else}
											<ShieldCheck class="w-4 h-4" />
										{/if}
									</button>
								{/if}
								<button
									onclick={() => handleDelete(admin)}
									disabled={deleting === admin._id}
									title="Remove admin"
									class="w-8 h-8 flex items-center justify-center rounded-lg text-sjcu-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40"
								>
									{#if deleting === admin._id}
										<RefreshCw class="w-4 h-4 animate-spin" />
									{:else}
										<Trash2 class="w-4 h-4" />
									{/if}
								</button>
							</div>
						{/if}
					</div>
				{/each}

				{#if admins.length === 0}
					<div class="admin-card text-center py-12 text-sjcu-text-muted">No admin accounts found.</div>
				{/if}
			</div>
		{/if}
	{/if}
</div>
