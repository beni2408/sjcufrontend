<script lang="ts">
	import { onMount } from 'svelte';
	import { Plus, Edit2, Trash2, GripVertical, Save, Building2, Globe, Mail, Phone, MapPin } from 'lucide-svelte';
	import { partnersApi } from '$lib/services/api.js';
	import type { Partner } from '$lib/types/index.js';
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { showToast } from '$lib/stores/ui.js';

	let partners = $state<Partner[]>([]);
	let loading = $state(true);
	let modalOpen = $state(false);
	let editingId = $state<string | null>(null);
	let saving = $state(false);
	let savingOrder = $state(false);
	let orderChanged = $state(false);
	let logoFile = $state<File | null>(null);
	let logoPreview = $state('');

	let dragIndex = $state<number | null>(null);
	let dragOverIndex = $state<number | null>(null);

	let form = $state({
		name: '',
		description: '',
		email: '',
		phone: '',
		website: '',
		address: '',
		order: 0,
	});

	async function load() {
		loading = true;
		orderChanged = false;
		try {
			const res = await partnersApi.getAll();
			partners = res.data.data.partners || [];
		} catch {
			partners = [];
		} finally {
			loading = false;
		}
	}
	onMount(load);

	// ── Drag & Drop ──────────────────────────────────────────────────
	function onDragStart(e: DragEvent, index: number) {
		dragIndex = index;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', String(index));
		}
	}
	function onDragOver(e: DragEvent, index: number) {
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
		dragOverIndex = index;
	}
	function onDrop(e: DragEvent, toIndex: number) {
		e.preventDefault();
		if (dragIndex === null || dragIndex === toIndex) { dragIndex = null; dragOverIndex = null; return; }
		const updated = [...partners];
		const [moved] = updated.splice(dragIndex, 1);
		updated.splice(toIndex, 0, moved);
		partners = updated.map((p, i) => ({ ...p, order: i }));
		orderChanged = true;
		dragIndex = null;
		dragOverIndex = null;
	}
	function onDragEnd() { dragIndex = null; dragOverIndex = null; }

	async function saveOrder() {
		savingOrder = true;
		try {
			await partnersApi.reorder(partners.map((p, i) => ({ id: p._id, order: i })));
			orderChanged = false;
			showToast('Order saved', 'success');
		} catch {
			showToast('Failed to save order', 'error');
		} finally {
			savingOrder = false;
		}
	}

	// ── Modal helpers ────────────────────────────────────────────────
	function openCreate() {
		editingId = null;
		logoFile = null;
		logoPreview = '';
		form = { name: '', description: '', email: '', phone: '', website: '', address: '', order: partners.length };
		modalOpen = true;
	}

	function openEdit(p: Partner) {
		editingId = p._id;
		logoFile = null;
		logoPreview = '';
		form = {
			name: p.name,
			description: p.description || '',
			email: p.email || '',
			phone: p.phone || '',
			website: p.website || '',
			address: p.address || '',
			order: p.order,
		};
		modalOpen = true;
	}

	function handleLogoChange(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		logoFile = file;
		logoPreview = URL.createObjectURL(file);
	}

	async function handleSubmit() {
		if (!form.name.trim()) { showToast('Partner name is required', 'error'); return; }
		saving = true;
		try {
			const fd = new FormData();
			fd.append('name', form.name.trim());
			fd.append('description', form.description);
			fd.append('email', form.email);
			fd.append('phone', form.phone);
			fd.append('website', form.website);
			fd.append('address', form.address);
			fd.append('order', String(form.order));
			if (logoFile) fd.append('logo', logoFile);

			if (editingId) {
				await partnersApi.update(editingId, fd);
				showToast('Partner updated', 'success');
			} else {
				await partnersApi.create(fd);
				showToast('Partner created', 'success');
			}
			modalOpen = false;
			await load();
		} catch {
			showToast('Failed to save partner', 'error');
		} finally {
			saving = false;
		}
	}

	async function handleDelete(p: Partner) {
		if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
		try {
			await partnersApi.delete(p._id);
			showToast('Partner deleted', 'success');
			await load();
		} catch {
			showToast('Failed to delete partner', 'error');
		}
	}
</script>

<div class="space-y-6">
	<!-- header -->
	<div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
		<div>
			<h1 class="font-display text-2xl font-bold text-white">Associated Partners</h1>
			<p class="text-sjcu-text-muted text-sm mt-1">{partners.length} partner{partners.length !== 1 ? 's' : ''}</p>
		</div>
		<div class="flex items-center gap-2 flex-wrap">
			{#if orderChanged}
				<button onclick={saveOrder} disabled={savingOrder} class="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors disabled:opacity-50">
					<Save class="w-4 h-4" />
					{savingOrder ? 'Saving…' : 'Save Order'}
				</button>
			{/if}
			<button onclick={openCreate} class="flex items-center gap-2 px-4 py-2 rounded-xl bg-sjcu-purple hover:bg-sjcu-purple-light text-white text-sm font-medium transition-colors">
				<Plus class="w-4 h-4" />
				Add Partner
			</button>
		</div>
	</div>

	{#if loading}
		<div class="flex justify-center py-20"><LoadingSpinner /></div>
	{:else if partners.length === 0}
		<div class="flex flex-col items-center justify-center py-24 text-center">
			<div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
				<Building2 class="w-8 h-8 text-sjcu-text-muted" />
			</div>
			<p class="text-white font-medium mb-1">No partners yet</p>
			<p class="text-sjcu-text-muted text-sm">Add your first associated partner to get started.</p>
		</div>
	{:else}
		<p class="text-sjcu-text-muted text-xs">Drag rows to reorder. Changes are saved when you click "Save Order".</p>
		<div class="space-y-3">
			{#each partners as partner, i}
				<div
					class="flex items-center gap-3 p-3 sm:p-4 rounded-2xl bg-sjcu-card border transition-all duration-200 {dragOverIndex === i ? 'border-sjcu-purple bg-sjcu-purple/10' : 'border-sjcu-border'}"
					draggable="true"
					ondragstart={(e) => onDragStart(e, i)}
					ondragover={(e) => onDragOver(e, i)}
					ondrop={(e) => onDrop(e, i)}
					ondragend={onDragEnd}
				>
					<!-- Drag handle: desktop only -->
					<div class="hidden sm:block cursor-grab active:cursor-grabbing text-sjcu-text-muted hover:text-white transition-colors flex-shrink-0">
						<GripVertical class="w-5 h-5" />
					</div>

					<!-- Logo: compact on mobile -->
					<div class="w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-white/8 border border-white/10 overflow-hidden flex items-center justify-center flex-shrink-0">
						{#if partner.logo}
							<img src={partner.logo} alt={partner.name} class="w-full h-full object-contain p-1" />
						{:else}
							<Building2 class="w-5 h-5 sm:w-6 sm:h-6 text-sjcu-text-muted" />
						{/if}
					</div>

					<!-- Info -->
					<div class="flex-1 min-w-0">
						<p class="text-white font-semibold text-sm truncate">{partner.name}</p>
						{#if partner.description}
							<p class="text-sjcu-text-muted text-xs mt-0.5 truncate">{partner.description}</p>
						{/if}
						<!-- Contact details: only show on sm+ to avoid overflow on mobile -->
						<div class="hidden sm:flex flex-wrap items-center gap-3 mt-1.5">
							{#if partner.email}
								<span class="flex items-center gap-1 text-xs text-sjcu-text-muted truncate">
									<Mail class="w-3 h-3 flex-shrink-0" /><span class="truncate">{partner.email}</span>
								</span>
							{/if}
							{#if partner.phone}
								<span class="flex items-center gap-1 text-xs text-sjcu-text-muted flex-shrink-0">
									<Phone class="w-3 h-3" />{partner.phone}
								</span>
							{/if}
							{#if partner.website}
								<span class="flex items-center gap-1 text-xs text-sjcu-text-muted truncate">
									<Globe class="w-3 h-3 flex-shrink-0" /><span class="truncate">{partner.website.replace(/^https?:\/\//, '')}</span>
								</span>
							{/if}
							{#if partner.address}
								<span class="flex items-center gap-1 text-xs text-sjcu-text-muted truncate">
									<MapPin class="w-3 h-3 flex-shrink-0" /><span class="truncate">{partner.address}</span>
								</span>
							{/if}
						</div>
						<!-- Mobile: show phone only (short, useful) -->
						{#if partner.phone}
							<p class="sm:hidden flex items-center gap-1 text-xs text-sjcu-text-muted mt-0.5">
								<Phone class="w-3 h-3" />{partner.phone}
							</p>
						{/if}
					</div>

					<!-- Actions: colored tap targets on mobile -->
					<div class="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
						<button
							onclick={() => openEdit(partner)}
							class="w-8 h-8 rounded-xl bg-blue-500/15 sm:bg-white/5 hover:bg-blue-500/20 text-blue-400 sm:text-sjcu-text-muted hover:text-blue-400 flex items-center justify-center transition-colors"
						>
							<Edit2 class="w-4 h-4" />
						</button>
						<button
							onclick={() => handleDelete(partner)}
							class="w-8 h-8 rounded-xl bg-red-500/15 sm:bg-white/5 hover:bg-red-500/20 text-red-400 sm:text-sjcu-text-muted hover:text-red-400 flex items-center justify-center transition-colors"
						>
							<Trash2 class="w-4 h-4" />
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- create / edit modal -->
<Modal open={modalOpen} title={editingId ? 'Edit Partner' : 'Add Partner'} onClose={() => (modalOpen = false)}>
	<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-5">

		<!-- logo upload -->
		<div class="flex flex-col items-center gap-3">
			<div class="w-24 h-24 rounded-2xl overflow-hidden bg-white/8 border-2 border-dashed border-white/20 flex items-center justify-center">
				{#if logoPreview}
					<img src={logoPreview} alt="Preview" class="w-full h-full object-contain p-2" />
				{:else if editingId && partners.find(p => p._id === editingId)?.logo}
					<img src={partners.find(p => p._id === editingId)?.logo} alt="Logo" class="w-full h-full object-contain p-2" />
				{:else}
					<Building2 class="w-8 h-8 text-sjcu-text-muted" />
				{/if}
			</div>
			<label class="cursor-pointer px-4 py-2 rounded-xl bg-white/8 border border-white/15 text-sjcu-text-secondary hover:text-white hover:border-sjcu-purple/50 text-sm transition-colors">
				{logoFile ? 'Change Logo' : 'Upload Logo'}
				<input type="file" accept="image/*" class="hidden" onchange={handleLogoChange} />
			</label>
		</div>

		<!-- name -->
		<div>
			<label class="block text-sjcu-text-muted text-xs mb-1.5 uppercase tracking-widest">Partner Name *</label>
			<input
				bind:value={form.name}
				placeholder="e.g. Diocese of Jaffna"
				class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-sjcu-text-muted text-sm focus:outline-none focus:border-sjcu-purple/60 focus:ring-1 focus:ring-sjcu-purple/30 transition-all"
			/>
		</div>

		<!-- description -->
		<div>
			<label class="block text-sjcu-text-muted text-xs mb-1.5 uppercase tracking-widest">Description</label>
			<textarea
				bind:value={form.description}
				rows="3"
				placeholder="Brief description of this partner organisation…"
				class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-sjcu-text-muted text-sm focus:outline-none focus:border-sjcu-purple/60 focus:ring-1 focus:ring-sjcu-purple/30 transition-all resize-none"
			></textarea>
		</div>

		<!-- email + phone side by side -->
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<div>
				<label class="block text-sjcu-text-muted text-xs mb-1.5 uppercase tracking-widest">Contact Email</label>
				<input
					bind:value={form.email}
					type="email"
					placeholder="contact@partner.org"
					class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-sjcu-text-muted text-sm focus:outline-none focus:border-sjcu-purple/60 focus:ring-1 focus:ring-sjcu-purple/30 transition-all"
				/>
			</div>
			<div>
				<label class="block text-sjcu-text-muted text-xs mb-1.5 uppercase tracking-widest">Contact Phone</label>
				<input
					bind:value={form.phone}
					type="tel"
					placeholder="+94 77 000 0000"
					class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-sjcu-text-muted text-sm focus:outline-none focus:border-sjcu-purple/60 focus:ring-1 focus:ring-sjcu-purple/30 transition-all"
				/>
			</div>
		</div>

		<!-- website -->
		<div>
			<label class="block text-sjcu-text-muted text-xs mb-1.5 uppercase tracking-widest">Website</label>
			<input
				bind:value={form.website}
				type="url"
				placeholder="https://www.partner.org"
				class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-sjcu-text-muted text-sm focus:outline-none focus:border-sjcu-purple/60 focus:ring-1 focus:ring-sjcu-purple/30 transition-all"
			/>
		</div>

		<!-- address -->
		<div>
			<label class="block text-sjcu-text-muted text-xs mb-1.5 uppercase tracking-widest">Address</label>
			<textarea
				bind:value={form.address}
				rows="2"
				placeholder="123 Main Street, City, Country…"
				class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-sjcu-text-muted text-sm focus:outline-none focus:border-sjcu-purple/60 focus:ring-1 focus:ring-sjcu-purple/30 transition-all resize-none"
			></textarea>
		</div>

		<!-- submit -->
		<div class="flex justify-end gap-3 pt-2">
			<button
				type="button"
				onclick={() => (modalOpen = false)}
				class="px-5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sjcu-text-secondary hover:text-white text-sm transition-colors"
			>
				Cancel
			</button>
			<button
				type="submit"
				disabled={saving}
				class="px-6 py-2.5 rounded-xl bg-sjcu-purple hover:bg-sjcu-purple-light text-white text-sm font-medium transition-colors disabled:opacity-50"
			>
				{saving ? 'Saving…' : editingId ? 'Update Partner' : 'Add Partner'}
			</button>
		</div>
	</form>
</Modal>
