<script lang="ts">
	import { onMount } from 'svelte';
	import { Plus, Edit2, Trash2, Mic, CalendarDays, MapPin, Users2, Clock, ListChecks, ImagePlus } from 'lucide-svelte';
	import { auditionsApi } from '$lib/services/api.js';
	import type { Audition } from '$lib/types/index.js';
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { showToast } from '$lib/stores/ui.js';

	let auditions = $state<Audition[]>([]);
	let loading = $state(true);
	let modalOpen = $state(false);
	let editingId = $state<string | null>(null);
	let saving = $state(false);
	let imageFile = $state<File | null>(null);
	let imagePreview = $state('');

	let extendId = $state<string | null>(null);
	let extendDate = $state('');
	let extending = $state(false);

	function toDateInput(d: string) { return d ? new Date(d).toISOString().slice(0, 10) : ''; }

	let form = $state({ title: '', description: '', date: '', venue: '', applicationStart: '', applicationEnd: '', minAge: 5, maxAge: 60 });

	async function load() {
		loading = true;
		try { const res = await auditionsApi.getAll(); auditions = res.data.data.auditions || []; }
		catch { auditions = []; } finally { loading = false; }
	}
	onMount(load);

	function openCreate() {
		editingId = null;
		form = { title: '', description: '', date: '', venue: '', applicationStart: '', applicationEnd: '', minAge: 5, maxAge: 60 };
		imageFile = null; imagePreview = ''; modalOpen = true;
	}
	function openEdit(a: Audition) {
		editingId = a._id;
		form = {
			title: a.title, description: a.description, date: toDateInput(a.date), venue: a.venue,
			applicationStart: toDateInput(a.applicationStart), applicationEnd: toDateInput(a.applicationEnd),
			minAge: a.minAge, maxAge: a.maxAge,
		};
		imageFile = null; imagePreview = a.featureImage; modalOpen = true;
	}
	function handleFileChange(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (file) { imageFile = file; imagePreview = URL.createObjectURL(file); }
	}
	async function handleSave(e: SubmitEvent) {
		e.preventDefault();
		if (Number(form.minAge) > Number(form.maxAge)) { showToast('Minimum age cannot exceed maximum age', 'error'); return; }
		saving = true;
		try {
			const fd = new FormData();
			Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
			if (imageFile) fd.append('featureImage', imageFile);
			if (editingId) { await auditionsApi.update(editingId, fd); showToast('Audition updated!', 'success'); }
			else { await auditionsApi.create(fd); showToast('Audition created!', 'success'); }
			modalOpen = false; await load();
		} catch (err: any) { showToast(err.response?.data?.message || 'Failed to save', 'error'); } finally { saving = false; }
	}
	async function handleDelete(id: string) {
		if (!confirm('Delete this audition and all its applications?')) return;
		try { await auditionsApi.delete(id); showToast('Deleted', 'success'); auditions = auditions.filter((a) => a._id !== id); }
		catch { showToast('Failed to delete', 'error'); }
	}

	function openExtend(a: Audition) { extendId = a._id; extendDate = toDateInput(a.applicationEnd); }
	async function handleExtend(e: SubmitEvent) {
		e.preventDefault();
		if (!extendId) return;
		extending = true;
		try {
			await auditionsApi.extendDeadline(extendId, extendDate);
			showToast('Deadline extended!', 'success');
			extendId = null; await load();
		} catch (err: any) { showToast(err.response?.data?.message || 'Failed to extend deadline', 'error'); } finally { extending = false; }
	}

	function formatDate(d: string) { return d ? new Date(d).toLocaleDateString() : '—'; }
</script>

<svelte:head><title>Auditions — SJCU Admin</title></svelte:head>

<div class="space-y-6">
	<div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
		<div><h2 class="font-display text-2xl font-bold text-white">Auditions</h2><p class="text-sjcu-text-muted text-sm">{auditions.length} total auditions</p></div>
		<button onclick={openCreate} class="btn-primary text-sm self-start sm:self-auto"><Plus class="w-4 h-4" /> New Audition</button>
	</div>

	{#if loading}
		<LoadingSpinner size="lg" class="py-20" />
	{:else if auditions.length === 0}
		<div class="text-center py-16 text-sjcu-text-muted"><Mic class="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No auditions created yet.</p></div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
			{#each auditions as a}
				<div class="admin-card group relative overflow-hidden p-0">
					<div class="h-36 relative">
						{#if a.featureImage}
							<img src={a.featureImage} alt={a.title} class="w-full h-full object-cover" loading="lazy" />
						{:else}
							<div class="w-full h-full bg-sjcu-purple/10 flex items-center justify-center"><Mic class="w-10 h-10 text-sjcu-text-muted" /></div>
						{/if}
						<span class="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[11px] font-medium bg-black/60 text-white/80 backdrop-blur-sm">{a.auditionId}</span>
						<span class="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[11px] font-semibold {a.isOpen ? 'bg-green-500/20 text-green-300 border border-green-500/40' : 'bg-red-500/20 text-red-300 border border-red-500/40'}">{a.isOpen ? 'Open' : 'Closed'}</span>
					</div>

					<div class="p-4 space-y-2">
						<h3 class="text-white font-semibold text-sm">{a.title}</h3>
						<div class="text-sjcu-text-muted text-xs space-y-1">
							<div class="flex items-center gap-1.5"><CalendarDays class="w-3 h-3" /> {formatDate(a.date)}</div>
							<div class="flex items-center gap-1.5"><MapPin class="w-3 h-3" /> {a.venue}</div>
							<div class="flex items-center gap-1.5"><Users2 class="w-3 h-3" /> Age {a.minAge}–{a.maxAge}</div>
							<div class="flex items-center gap-1.5"><Clock class="w-3 h-3" /> Apply by {formatDate(a.applicationEnd)}</div>
						</div>

						<div class="flex items-center gap-1.5 pt-2 flex-wrap">
							<a href={`/admin/auditions/${a._id}/applications`} class="p-1.5 rounded bg-sjcu-purple/20 text-sjcu-accent hover:bg-sjcu-purple/30" title="View Applications"><ListChecks class="w-3.5 h-3.5" /></a>
							<button onclick={() => openExtend(a)} class="p-1.5 rounded bg-amber-500/20 text-amber-400 hover:bg-amber-500/30" title="Extend Deadline"><Clock class="w-3.5 h-3.5" /></button>
							<button onclick={() => openEdit(a)} class="p-1.5 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30" title="Edit"><Edit2 class="w-3.5 h-3.5" /></button>
							<button onclick={() => handleDelete(a._id)} class="p-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30" title="Delete"><Trash2 class="w-3.5 h-3.5" /></button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<Modal open={modalOpen} title={editingId ? 'Edit Audition' : 'New Audition'} onClose={() => (modalOpen = false)}>
	<form onsubmit={handleSave} class="space-y-4">
		<div>
			<label class="block text-sjcu-text-secondary text-sm mb-1.5">Feature Image</label>
			{#if imagePreview}<img src={imagePreview} alt="Preview" class="w-full h-32 object-cover rounded-xl mb-2" />{/if}
			<label class="btn-outline text-xs cursor-pointer inline-flex items-center gap-2">
				<ImagePlus class="w-3.5 h-3.5" /> Choose Image
				<input type="file" accept="image/*" onchange={handleFileChange} class="hidden" />
			</label>
		</div>
		<div><label class="block text-sjcu-text-secondary text-sm mb-1.5">Title *</label><input bind:value={form.title} class="admin-input" required /></div>
		<div><label class="block text-sjcu-text-secondary text-sm mb-1.5">Description</label><textarea bind:value={form.description} rows={3} class="admin-input resize-none"></textarea></div>
		<div class="grid grid-cols-2 gap-4">
			<div><label class="block text-sjcu-text-secondary text-sm mb-1.5">Audition Date *</label><input type="date" bind:value={form.date} class="admin-input" required /></div>
			<div><label class="block text-sjcu-text-secondary text-sm mb-1.5">Venue *</label><input bind:value={form.venue} class="admin-input" required /></div>
		</div>
		<div class="grid grid-cols-2 gap-4">
			<div><label class="block text-sjcu-text-secondary text-sm mb-1.5">Applications Open *</label><input type="date" bind:value={form.applicationStart} class="admin-input" required /></div>
			<div><label class="block text-sjcu-text-secondary text-sm mb-1.5">Applications Close *</label><input type="date" bind:value={form.applicationEnd} class="admin-input" required /></div>
		</div>
		<div class="grid grid-cols-2 gap-4">
			<div><label class="block text-sjcu-text-secondary text-sm mb-1.5">Minimum Age</label><input type="number" min="0" bind:value={form.minAge} class="admin-input" /></div>
			<div><label class="block text-sjcu-text-secondary text-sm mb-1.5">Maximum Age</label><input type="number" min="0" bind:value={form.maxAge} class="admin-input" /></div>
		</div>
		<div class="flex justify-end gap-3 pt-2">
			<button type="button" onclick={() => (modalOpen = false)} class="btn-outline text-sm px-5 py-2.5">Cancel</button>
			<button type="submit" class="btn-primary text-sm px-5 py-2.5" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update' : 'Create'}</button>
		</div>
	</form>
</Modal>

<Modal open={!!extendId} title="Extend Application Deadline" onClose={() => (extendId = null)}>
	<form onsubmit={handleExtend} class="space-y-4">
		<div><label class="block text-sjcu-text-secondary text-sm mb-1.5">New Closing Date *</label><input type="date" bind:value={extendDate} class="admin-input" required /></div>
		<div class="flex justify-end gap-3 pt-2">
			<button type="button" onclick={() => (extendId = null)} class="btn-outline text-sm px-5 py-2.5">Cancel</button>
			<button type="submit" class="btn-primary text-sm px-5 py-2.5" disabled={extending}>{extending ? 'Saving...' : 'Extend'}</button>
		</div>
	</form>
</Modal>
