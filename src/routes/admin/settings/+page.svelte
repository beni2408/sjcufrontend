<script lang="ts">
	import { onMount } from 'svelte';
	import { Save, Settings, KeyRound, Eye, EyeOff, ShieldCheck, Lock, CheckCircle2, AlertCircle } from 'lucide-svelte';
	import { settingsApi, apiKeysApi } from '$lib/services/api.js';
	import { authStore } from '$lib/stores/auth.js';
	import type { Settings as SettingsType } from '$lib/types/index.js';
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
	import { showToast } from '$lib/stores/ui.js';

	type Tab = 'general' | 'apikeys';
	let activeTab = $state<Tab>('general');

	const isSuperAdmin = $derived($authStore.user?.role === 'super_admin');

	// ── General settings ────────────────────────────────────────────────
	let loading = $state(true);
	let saving  = $state(false);
	let logoFile    = $state<File | null>(null);
	let logoPreview = $state('');

	let form = $state({
		email: '', phone: '', address: '', footerText: '',
		socialLinks: { instagram: '', facebook: '', youtube: '', twitter: '' }
	});

	// ── API Keys ─────────────────────────────────────────────────────────
	type KeyStatus = { isSet: boolean; preview: string };
	type KeysMap   = Record<string, KeyStatus>;

	const KEY_DEFS = [
		{ key: 'cloudinaryCloudName', label: 'Cloudinary Cloud Name',   group: 'Cloudinary',  placeholder: 'your-cloud-name', secret: false },
		{ key: 'cloudinaryApiKey',    label: 'Cloudinary API Key',       group: 'Cloudinary',  placeholder: 'Enter new key…',  secret: true  },
		{ key: 'cloudinaryApiSecret', label: 'Cloudinary API Secret',    group: 'Cloudinary',  placeholder: 'Enter new secret…', secret: true },
		{ key: 'emailUser',           label: 'Email Address (SMTP)',      group: 'Email',       placeholder: 'you@gmail.com',   secret: false },
		{ key: 'emailPassword',       label: 'Email App Password',        group: 'Email',       placeholder: 'Enter new password…', secret: true },
		{ key: 'youtubeApiKey',       label: 'YouTube Data API Key',      group: 'YouTube',     placeholder: 'Enter new key…',  secret: true  },
		{ key: 'groqApiKey',          label: 'Groq API Key (AI Chatbot)', group: 'Groq AI',     placeholder: 'gsk_…',           secret: true  },
		{ key: 'resendApiKey',        label: 'Resend API Key (Email)',     group: 'Resend',      placeholder: 're_…',            secret: true  },
	];

	let keyStatus   = $state<KeysMap>({});
	let keyInputs   = $state<Record<string, string>>({});
	let showSecrets = $state<Record<string, boolean>>({});
	let keysLoading = $state(false);
	let keysSaving  = $state(false);

	async function loadKeys() {
		keysLoading = true;
		try {
			const res = await apiKeysApi.get();
			keyStatus = res.data.data.keys;
		} catch {
			showToast('Failed to load API keys', 'error');
		} finally {
			keysLoading = false;
		}
	}

	async function saveKeys(e: SubmitEvent) {
		e.preventDefault();
		const payload: Record<string, string> = {};
		for (const [k, v] of Object.entries(keyInputs)) {
			if (v.trim()) payload[k] = v.trim();
		}
		if (Object.keys(payload).length === 0) {
			showToast('No new values entered', 'error'); return;
		}
		keysSaving = true;
		try {
			const res = await apiKeysApi.update(payload);
			keyStatus = res.data.data.keys;
			keyInputs = {};
			showToast('API keys saved securely!', 'success');
		} catch (err: any) {
			showToast(err.response?.data?.message || 'Failed to save keys', 'error');
		} finally {
			keysSaving = false;
		}
	}

	// ── General settings handlers ────────────────────────────────────────
	onMount(async () => {
		try {
			const res = await settingsApi.get();
			const s: SettingsType = res.data.data.settings;
			form = {
				email: s.email || '', phone: s.phone || '',
				address: s.address || '', footerText: s.footerText || '',
				socialLinks: {
					instagram: s.socialLinks?.instagram || '',
					facebook:  s.socialLinks?.facebook  || '',
					youtube:   s.socialLinks?.youtube   || '',
					twitter:   s.socialLinks?.twitter   || '',
				}
			};
			logoPreview = s.logo || '';
		} catch { } finally { loading = false; }
	});

	function handleLogoChange(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (file) { logoFile = file; logoPreview = URL.createObjectURL(file); }
	}

	async function handleSave(e: SubmitEvent) {
		e.preventDefault();
		saving = true;
		try {
			const fd = new FormData();
			fd.append('email', form.email); fd.append('phone', form.phone);
			fd.append('address', form.address); fd.append('footerText', form.footerText);
			fd.append('socialLinks', JSON.stringify(form.socialLinks));
			if (logoFile) fd.append('logo', logoFile);
			await settingsApi.update(fd);
			showToast('Settings saved!', 'success');
		} catch { showToast('Failed to save settings', 'error'); } finally { saving = false; }
	}

	function onTabChange(tab: Tab) {
		activeTab = tab;
		if (tab === 'apikeys' && isSuperAdmin && Object.keys(keyStatus).length === 0) {
			loadKeys();
		}
	}
</script>

<svelte:head><title>Settings — SJCU Admin</title></svelte:head>

<div class="space-y-6 max-w-2xl">
	<div>
		<h2 class="font-display text-2xl font-bold text-white">Settings</h2>
		<p class="text-sjcu-text-muted text-sm">Manage your website configuration</p>
	</div>

	<!-- Tabs — only shown to super_admin since they have two tabs -->
	{#if isSuperAdmin}
	<div class="flex gap-1 p-1 rounded-xl" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);">
		<button
			onclick={() => onTabChange('general')}
			class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
				{activeTab === 'general' ? 'bg-sjcu-purple text-white shadow-lg' : 'text-sjcu-text-muted hover:text-sjcu-text-primary'}"
		>
			<Settings class="w-4 h-4" /> General
		</button>
		<button
			onclick={() => onTabChange('apikeys')}
			class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
				{activeTab === 'apikeys' ? 'bg-sjcu-purple text-white shadow-lg' : 'text-sjcu-text-muted hover:text-sjcu-text-primary'}"
		>
			<KeyRound class="w-4 h-4" /> API Keys
			<span class="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase" style="background: rgba(239,68,68,0.2); color: #f87171; border: 1px solid rgba(239,68,68,0.3);">SECURE</span>
		</button>
	</div>
	{/if}

	<!-- ── GENERAL TAB ── -->
	{#if activeTab === 'general'}
		{#if loading}
			<LoadingSpinner size="lg" class="py-20" />
		{:else}
			<form onsubmit={handleSave} class="space-y-6">
				<div class="admin-card space-y-5">
					<h3 class="text-white font-semibold flex items-center gap-2"><Settings class="w-4 h-4 text-sjcu-accent" /> Site Logo</h3>
					<div class="flex items-center gap-5">
						{#if logoPreview}
							<img src={logoPreview} alt="Logo" class="w-20 h-20 rounded-full object-contain border-2 border-sjcu-border bg-white/5" />
						{:else}
							<div class="w-20 h-20 rounded-full bg-sjcu-purple/20 border-2 border-sjcu-border flex items-center justify-center">
								<img src="/logo.png" alt="Default Logo" class="w-16 h-16 object-contain" />
							</div>
						{/if}
						<div>
							<label class="block text-sjcu-text-secondary text-sm mb-1.5">Upload Logo</label>
							<input type="file" accept="image/*" onchange={handleLogoChange} class="text-sjcu-text-secondary text-sm" />
							<p class="text-sjcu-text-muted text-xs mt-1">PNG or SVG recommended. Transparent background preferred.</p>
						</div>
					</div>
				</div>

				<div class="admin-card space-y-4">
					<h3 class="text-white font-semibold">Contact Information</h3>
					<div><label class="block text-sjcu-text-secondary text-sm mb-1.5">Email Address</label><input bind:value={form.email} type="email" class="admin-input" placeholder="info@sjcu.com" /></div>
					<div><label class="block text-sjcu-text-secondary text-sm mb-1.5">Phone Number</label><input bind:value={form.phone} class="admin-input" placeholder="+91 98765 43210" /></div>
					<div><label class="block text-sjcu-text-secondary text-sm mb-1.5">Address</label><textarea bind:value={form.address} rows={2} class="admin-input resize-none" placeholder="Madathuvilai, Arumuganeri, Tamil Nadu, India"></textarea></div>
				</div>

				<div class="admin-card space-y-4">
					<h3 class="text-white font-semibold">Social Links</h3>
					<div><label class="block text-sjcu-text-secondary text-sm mb-1.5">Instagram</label><input bind:value={form.socialLinks.instagram} class="admin-input" placeholder="https://instagram.com/sjcu" /></div>
					<div><label class="block text-sjcu-text-secondary text-sm mb-1.5">Facebook</label><input bind:value={form.socialLinks.facebook} class="admin-input" placeholder="https://facebook.com/sjcu" /></div>
					<div><label class="block text-sjcu-text-secondary text-sm mb-1.5">YouTube</label><input bind:value={form.socialLinks.youtube} class="admin-input" placeholder="https://youtube.com/@sjcu" /></div>
					<div><label class="block text-sjcu-text-secondary text-sm mb-1.5">Twitter / X</label><input bind:value={form.socialLinks.twitter} class="admin-input" placeholder="https://twitter.com/sjcu" /></div>
				</div>

				<div class="admin-card">
					<label class="block text-sjcu-text-secondary text-sm mb-1.5">Footer Text</label>
					<input bind:value={form.footerText} class="admin-input" placeholder="© 2024 St. John's Carol Union. All rights reserved." />
				</div>

				<button type="submit" class="btn-primary" disabled={saving}>
					<Save class="w-4 h-4" />
					{saving ? 'Saving...' : 'Save All Settings'}
				</button>
			</form>
		{/if}
	{/if}

	<!-- ── API KEYS TAB ── -->
	{#if activeTab === 'apikeys'}
		{#if !isSuperAdmin}
			<div class="admin-card flex items-center gap-4 py-10 justify-center flex-col text-center">
				<Lock class="w-10 h-10 text-red-400" />
				<p class="text-sjcu-text-primary font-semibold">Super Admin Access Required</p>
				<p class="text-sjcu-text-muted text-sm">Only super admins can view or edit API keys.</p>
			</div>
		{:else}
			<!-- Security banner -->
			<div class="flex items-start gap-3 p-4 rounded-xl" style="background: rgba(124,58,237,0.1); border: 1px solid rgba(124,58,237,0.3);">
				<ShieldCheck class="w-5 h-5 text-sjcu-accent flex-shrink-0 mt-0.5" />
				<div>
					<p class="text-sjcu-text-primary text-sm font-semibold">End-to-End Encrypted Storage</p>
					<p class="text-sjcu-text-muted text-xs mt-0.5">All keys are encrypted with AES-256-GCM before being stored in the database. Raw values are never logged or returned. Only the encrypted ciphertext exists in MongoDB.</p>
				</div>
			</div>

			{#if keysLoading}
				<LoadingSpinner size="lg" class="py-20" />
			{:else}
				<form onsubmit={saveKeys} class="space-y-5">
					{#each ['Cloudinary', 'Email', 'YouTube', 'Groq AI', 'Resend'] as group}
						{@const groupKeys = KEY_DEFS.filter(k => k.group === group)}
						<div class="admin-card space-y-4">
							<h3 class="text-white font-semibold flex items-center gap-2">
								<KeyRound class="w-4 h-4 text-sjcu-accent" />
								{group}
								{#if group === 'Groq AI'}<span class="text-[10px] text-sjcu-text-muted font-normal">(AI Chatbot)</span>{/if}
							</h3>

							{#each groupKeys as def}
								<div>
									<label class="flex items-center gap-1.5 text-sjcu-text-secondary text-sm mb-1.5">
										{def.label}
										{#if keyStatus[def.key]?.isSet}
											<span class="flex items-center gap-0.5 text-green-400 text-[10px] font-semibold">
												<CheckCircle2 class="w-3 h-3" /> SET
											</span>
										{:else}
											<span class="flex items-center gap-0.5 text-amber-400 text-[10px] font-semibold">
												<AlertCircle class="w-3 h-3" /> NOT SET
											</span>
										{/if}
									</label>

									<!-- Current masked preview -->
									{#if keyStatus[def.key]?.isSet && !keyInputs[def.key]}
										<div class="flex items-center gap-2 px-3 py-2.5 rounded-lg mb-2 font-mono text-xs" style="background: rgba(124,58,237,0.08); border: 1px solid rgba(124,58,237,0.2);">
											<Lock class="w-3 h-3 text-sjcu-accent flex-shrink-0" />
											<span class="text-sjcu-text-secondary flex-1">{keyStatus[def.key].preview}</span>
										</div>
									{/if}

									<!-- New value input -->
									<div class="relative">
										<input
											type={def.secret && !showSecrets[def.key] ? 'password' : 'text'}
											bind:value={keyInputs[def.key]}
											placeholder={keyStatus[def.key]?.isSet ? 'Enter new value to update…' : def.placeholder}
											class="admin-input pr-10 font-mono text-sm"
										/>
										{#if def.secret}
											<button
												type="button"
												onclick={() => showSecrets[def.key] = !showSecrets[def.key]}
												class="absolute right-3 top-1/2 -translate-y-1/2 text-sjcu-text-muted hover:text-sjcu-text-primary transition-colors"
											>
												{#if showSecrets[def.key]}
													<EyeOff class="w-4 h-4" />
												{:else}
													<Eye class="w-4 h-4" />
												{/if}
											</button>
										{/if}
									</div>
									<p class="text-sjcu-text-muted text-[11px] mt-1">Leave blank to keep existing value.</p>
								</div>
							{/each}
						</div>
					{/each}

					<div class="flex items-center gap-3">
						<button type="submit" class="btn-primary" disabled={keysSaving}>
							<ShieldCheck class="w-4 h-4" />
							{keysSaving ? 'Encrypting & Saving…' : 'Save API Keys Securely'}
						</button>
						<p class="text-sjcu-text-muted text-xs">Only fields with new values will be updated.</p>
					</div>
				</form>
			{/if}
		{/if}
	{/if}
</div>
