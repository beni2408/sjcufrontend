<script lang="ts">
	import { Camera, Save, KeyRound, UserCircle2, Eye, EyeOff } from 'lucide-svelte';
	import { authStore } from '$lib/stores/auth.js';
	import { authApi } from '$lib/services/api.js';
	import { showToast } from '$lib/stores/ui.js';

	// ── Profile form ─────────────────────────────────────────
	let form = $state({
		name: $authStore.user?.name ?? '',
		email: $authStore.user?.email ?? '',
		dob: $authStore.user?.dob ? $authStore.user.dob.slice(0, 10) : '',
		gender: $authStore.user?.gender ?? '',
	});

	let avatarFile = $state<File | null>(null);
	let avatarPreview = $state($authStore.user?.avatar ?? '');
	let saving = $state(false);

	let initials = $derived(
		form.name
			.split(' ')
			.map((n) => n[0])
			.slice(0, 2)
			.join('')
			.toUpperCase() || 'A'
	);

	function handleAvatarChange(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (file) {
			avatarFile = file;
			avatarPreview = URL.createObjectURL(file);
		}
	}

	async function saveProfile(e: SubmitEvent) {
		e.preventDefault();
		if (!form.name.trim()) { showToast('Name is required', 'error'); return; }
		if (!form.email.trim()) { showToast('Email is required', 'error'); return; }

		saving = true;
		try {
			const fd = new FormData();
			fd.append('name', form.name.trim());
			fd.append('email', form.email.trim());
			fd.append('dob', form.dob);
			fd.append('gender', form.gender);
			if (avatarFile) fd.append('avatar', avatarFile);

			const res = await authApi.updateProfile(fd);
			const updatedUser = res.data.data.user;
			authStore.updateUser(updatedUser);
			avatarPreview = updatedUser.avatar ?? avatarPreview;
			avatarFile = null;
			showToast('Profile updated successfully', 'success');
		} catch (err: any) {
			showToast(err.response?.data?.message || 'Failed to update profile', 'error');
		} finally {
			saving = false;
		}
	}

	// ── Password form ─────────────────────────────────────────
	let pwd = $state({ current: '', new: '', confirm: '' });
	let showCurrent = $state(false);
	let showNew = $state(false);
	let savingPwd = $state(false);

	async function changePassword(e: SubmitEvent) {
		e.preventDefault();
		if (!pwd.current || !pwd.new || !pwd.confirm) { showToast('All password fields are required', 'error'); return; }
		if (pwd.new.length < 6) { showToast('New password must be at least 6 characters', 'error'); return; }
		if (pwd.new !== pwd.confirm) { showToast('New passwords do not match', 'error'); return; }

		savingPwd = true;
		try {
			await authApi.changePassword(pwd.current, pwd.new);
			pwd = { current: '', new: '', confirm: '' };
			showToast('Password changed successfully', 'success');
		} catch (err: any) {
			showToast(err.response?.data?.message || 'Failed to change password', 'error');
		} finally {
			savingPwd = false;
		}
	}
</script>

<svelte:head><title>My Profile — SJCU Admin</title></svelte:head>

<div class="max-w-2xl mx-auto space-y-6">

	<!-- Profile card -->
	<div class="admin-card p-8">
		<h2 class="font-display text-xl font-bold text-white mb-6">My Profile</h2>

		<form onsubmit={saveProfile} class="space-y-6">
			<!-- Avatar -->
			<div class="flex flex-col items-center gap-4">
				<div class="relative group">
					<div class="w-28 h-28 rounded-full border-2 border-sjcu-border overflow-hidden bg-sjcu-purple/20 flex items-center justify-center">
						{#if avatarPreview}
							<img src={avatarPreview} alt="Avatar" class="w-full h-full object-cover" />
						{:else}
							<span class="text-3xl font-bold text-sjcu-accent">{initials}</span>
						{/if}
					</div>
					<!-- Upload overlay -->
					<label
						class="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
						title="Change photo"
					>
						<Camera class="w-6 h-6 text-white" />
						<input type="file" accept="image/*" onchange={handleAvatarChange} class="hidden" />
					</label>
				</div>
				<p class="text-sjcu-text-muted text-xs">Hover over the photo to change it</p>
			</div>

			<!-- Name -->
			<div>
				<label class="block text-sjcu-text-secondary text-sm mb-1.5" for="name">Full Name *</label>
				<input id="name" type="text" bind:value={form.name} class="admin-input" placeholder="Your full name" />
			</div>

			<!-- Email -->
			<div>
				<label class="block text-sjcu-text-secondary text-sm mb-1.5" for="email">Email Address *</label>
				<input id="email" type="email" bind:value={form.email} class="admin-input" placeholder="admin@example.com" />
			</div>

			<!-- DOB + Gender row -->
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div>
					<label class="block text-sjcu-text-secondary text-sm mb-1.5" for="dob">Date of Birth</label>
					<input id="dob" type="date" bind:value={form.dob} class="admin-input" />
				</div>
				<div>
					<label class="block text-sjcu-text-secondary text-sm mb-1.5" for="gender">Gender</label>
					<select id="gender" bind:value={form.gender} class="admin-select">
						<option value="">Prefer not to say</option>
						<option value="male">Male</option>
						<option value="female">Female</option>
						<option value="other">Other</option>
					</select>
				</div>
			</div>

			<div class="flex justify-end pt-2">
				<button type="submit" class="btn-primary" disabled={saving}>
					{#if saving}
						<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
						Saving...
					{:else}
						<Save class="w-4 h-4" /> Save Profile
					{/if}
				</button>
			</div>
		</form>
	</div>

	<!-- Change password card -->
	<div class="admin-card p-8">
		<h2 class="font-display text-xl font-bold text-white mb-6 flex items-center gap-2">
			<KeyRound class="w-5 h-5 text-sjcu-accent" /> Change Password
		</h2>

		<form onsubmit={changePassword} class="space-y-4">
			<div>
				<label class="block text-sjcu-text-secondary text-sm mb-1.5" for="current-pwd">Current Password *</label>
				<div class="relative">
					<input
						id="current-pwd"
						type={showCurrent ? 'text' : 'password'}
						bind:value={pwd.current}
						class="admin-input pr-10"
						placeholder="Enter current password"
					/>
					<button
						type="button"
						onclick={() => (showCurrent = !showCurrent)}
						class="absolute right-3 top-1/2 -translate-y-1/2 text-sjcu-text-muted hover:text-sjcu-text-primary transition-colors"
					>
						{#if showCurrent}<EyeOff class="w-4 h-4" />{:else}<Eye class="w-4 h-4" />{/if}
					</button>
				</div>
			</div>

			<div>
				<label class="block text-sjcu-text-secondary text-sm mb-1.5" for="new-pwd">New Password *</label>
				<div class="relative">
					<input
						id="new-pwd"
						type={showNew ? 'text' : 'password'}
						bind:value={pwd.new}
						class="admin-input pr-10"
						placeholder="At least 6 characters"
					/>
					<button
						type="button"
						onclick={() => (showNew = !showNew)}
						class="absolute right-3 top-1/2 -translate-y-1/2 text-sjcu-text-muted hover:text-sjcu-text-primary transition-colors"
					>
						{#if showNew}<EyeOff class="w-4 h-4" />{:else}<Eye class="w-4 h-4" />{/if}
					</button>
				</div>
			</div>

			<div>
				<label class="block text-sjcu-text-secondary text-sm mb-1.5" for="confirm-pwd">Confirm New Password *</label>
				<input
					id="confirm-pwd"
					type="password"
					bind:value={pwd.confirm}
					class="admin-input"
					placeholder="Repeat new password"
				/>
			</div>

			<div class="flex justify-end pt-2">
				<button type="submit" class="btn-primary" disabled={savingPwd}>
					{#if savingPwd}
						<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
						Updating...
					{:else}
						<KeyRound class="w-4 h-4" /> Update Password
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>
