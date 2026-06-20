<script lang="ts">
	import { onMount } from 'svelte';
	import { Plus, Edit2, Trash2, CalendarDays, MapPin, GripVertical, Save } from 'lucide-svelte';
	import { eventsApi } from '$lib/services/api.js';
	import type { Event as SJCUEvent } from '$lib/types/index.js';
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { showToast } from '$lib/stores/ui.js';

	let events = $state<SJCUEvent[]>([]);
	let loading = $state(true);
	let modalOpen = $state(false);
	let editingId = $state<string | null>(null);
	let saving = $state(false);
	let savingOrder = $state(false);
	let orderChanged = $state(false);
	let bannerFile = $state<File | null>(null);
	let bannerPreview = $state('');

	let dragIndex = $state<number | null>(null);
	let dragOverIndex = $state<number | null>(null);

	let form = $state({ title: '', date: '', time: '', venue: '', description: '', featured: false });

	async function load() {
		loading = true; orderChanged = false;
		try { const res = await eventsApi.getAll(); events = res.data.data.events || []; }
		catch { events = []; } finally { loading = false; }
	}
	onMount(load);

	function onDragStart(e: DragEvent, i: number) {
		dragIndex = i;
		if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
	}
	function onDragOver(e: DragEvent, i: number) { e.preventDefault(); dragOverIndex = i; }
	function onDrop(e: DragEvent, toIndex: number) {
		e.preventDefault();
		if (dragIndex === null || dragIndex === toIndex) { dragIndex = null; dragOverIndex = null; return; }
		const arr = [...events];
		const [moved] = arr.splice(dragIndex, 1);
		arr.splice(toIndex, 0, moved);
		events = arr.map((ev, i) => ({ ...ev, order: i }));
		orderChanged = true; dragIndex = null; dragOverIndex = null;
	}
	function onDragEnd() { dragIndex = null; dragOverIndex = null; }

	async function saveOrder() {
		savingOrder = true;
		try {
			await eventsApi.reorder(events.map((ev, i) => ({ id: ev._id, order: i })));
			showToast('Order saved!', 'success'); orderChanged = false;
		} catch { showToast('Failed to save order', 'error'); } finally { savingOrder = false; }
	}

	function openCreate() {
		editingId = null;
		form = { title: '', date: '', time: '', venue: '', description: '', featured: false };
		bannerFile = null; bannerPreview = ''; modalOpen = true;
	}
	function openEdit(ev: SJCUEvent) {
		editingId = ev._id;
		form = { title: ev.title, date: ev.date?.slice(0, 10) || '', time: ev.time || '', venue: ev.venue, description: ev.description, featured: ev.featured };
		bannerFile = null; bannerPreview = ev.bannerImage; modalOpen = true;
	}
	function handleFileChange(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (file) { bannerFile = file; bannerPreview = URL.createObjectURL(file); }
	}
	async function handleSave(e: SubmitEvent) {
		e.preventDefault(); saving = true;
		try {
			const fd = new FormData();
			Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
			if (bannerFile) fd.append('bannerImage', bannerFile);
			if (editingId) { await eventsApi.update(editingId, fd); showToast('Event updated!', 'success'); }
			else { await eventsApi.create(fd); showToast('Event created!', 'success'); }
			modalOpen = false; await load();
		} catch { showToast('Failed to save event', 'error'); } finally { saving = false; }
	}
	async function handleDelete(id: string) {
		if (!confirm('Delete this event?')) return;
		try { await eventsApi.delete(id); showToast('Event deleted', 'success'); events = events.filter(ev => ev._id !== id); }
		catch { showToast('Failed to delete', 'error'); }
	}
</script>

<svelte:head><title>Events — SJCU Admin</title></svelte:head>

<div class="space-y-6">
	<div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
		<div>
			<h2 class="font-display text-2xl font-bold text-white">Events</h2>
			<p class="text-sjcu-text-muted text-sm">{events.length} total events</p>
		</div>
		<div class="flex items-center gap-2 flex-wrap">
			{#if orderChanged}
				<button onclick={saveOrder} disabled={savingOrder} class="btn-primary text-sm gap-2">
					<Save class="w-4 h-4" />{savingOrder ? 'Saving...' : 'Save Order'}
				</button>
			{/if}
			<button onclick={openCreate} class="btn-primary text-sm"><Plus class="w-4 h-4" /> Add Event</button>
		</div>
	</div>

	{#if events.length > 0 && !loading}
		<div class="flex items-center gap-2 text-sjcu-text-muted text-xs">
			<GripVertical class="w-3.5 h-3.5" />
			<span>Drag rows to reorder — click <strong class="text-sjcu-accent">Save Order</strong> to apply</span>
		</div>
	{/if}

	{#if loading}
		<LoadingSpinner size="lg" class="py-20" />
	{:else if events.length === 0}
		<div class="text-center py-16 text-sjcu-text-muted">
			<CalendarDays class="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No events yet.</p>
		</div>
	{:else}
		<div class="space-y-2">
			{#each events as ev, i}
				<div
					draggable={true}
					ondragstart={(e) => onDragStart(e, i)}
					ondragover={(e) => onDragOver(e, i)}
					ondrop={(e) => onDrop(e, i)}
					ondragend={onDragEnd}
					class="admin-card flex items-center gap-3 group cursor-grab active:cursor-grabbing select-none transition-all duration-150
						{dragOverIndex === i && dragIndex !== i ? 'ring-2 ring-sjcu-purple scale-[1.01] shadow-purple-glow' : ''}
						{dragIndex === i ? 'opacity-40 scale-[0.98]' : ''}
					"
				>
					<!-- Drag handle + index: desktop only -->
					<div class="hidden sm:block text-sjcu-text-muted/30 group-hover:text-sjcu-text-muted transition-colors flex-shrink-0">
						<GripVertical class="w-5 h-5" />
					</div>
					<span class="hidden sm:inline text-xs text-sjcu-text-muted w-5 flex-shrink-0 font-mono">#{i + 1}</span>

					<!-- Banner thumbnail -->
					<div class="w-14 h-9 sm:w-20 sm:h-12 rounded-lg overflow-hidden flex-shrink-0 bg-sjcu-navy">
						{#if ev.bannerImage}
							<img src={ev.bannerImage} alt={ev.title} class="w-full h-full object-cover pointer-events-none" />
						{:else}
							<div class="w-full h-full flex items-center justify-center"><CalendarDays class="w-5 h-5 text-sjcu-text-muted" /></div>
						{/if}
					</div>

					<!-- Info -->
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-1.5 mb-0.5 min-w-0">
							<p class="text-white font-semibold text-sm truncate">{ev.title}</p>
							{#if ev.featured}<span class="hidden sm:inline px-1.5 py-0.5 text-[10px] bg-sjcu-purple/20 text-sjcu-accent rounded flex-shrink-0">Featured</span>{/if}
						</div>
						<div class="flex flex-wrap items-center gap-2 text-xs text-sjcu-text-muted">
							<span class="flex items-center gap-1 flex-shrink-0"><CalendarDays class="w-3 h-3" />{new Date(ev.date).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
							{#if ev.venue}<span class="flex items-center gap-1 truncate"><MapPin class="w-3 h-3 flex-shrink-0" /><span class="truncate">{ev.venue}</span></span>{/if}
						</div>
					</div>

					<!-- Actions: always visible, compact on mobile -->
					<div class="flex items-center gap-1 sm:gap-2 flex-shrink-0">
						<button onclick={() => openEdit(ev)} class="p-2 rounded-lg bg-blue-500/15 sm:bg-transparent text-blue-400 sm:text-sjcu-text-muted hover:bg-blue-500/20 hover:text-blue-400 transition-colors"><Edit2 class="w-4 h-4" /></button>
						<button onclick={() => handleDelete(ev._id)} class="p-2 rounded-lg bg-red-500/15 sm:bg-transparent text-red-400 sm:text-sjcu-text-muted hover:bg-red-500/20 hover:text-red-400 transition-colors"><Trash2 class="w-4 h-4" /></button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<Modal open={modalOpen} title={editingId ? 'Edit Event' : 'Add New Event'} onClose={() => (modalOpen = false)}>
	<form onsubmit={handleSave} class="space-y-4">
		<div><label class="block text-sjcu-text-secondary text-sm mb-1.5">Event Title *</label><input bind:value={form.title} class="admin-input" required /></div>
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<div><label class="block text-sjcu-text-secondary text-sm mb-1.5">Date *</label><input bind:value={form.date} type="date" class="admin-input" required /></div>
			<div><label class="block text-sjcu-text-secondary text-sm mb-1.5">Time</label><input bind:value={form.time} type="time" class="admin-input" placeholder="e.g. 18:00" /></div>
		</div>
		<div><label class="block text-sjcu-text-secondary text-sm mb-1.5">Venue</label><input bind:value={form.venue} class="admin-input" placeholder="Event venue" /></div>
		<div><label class="block text-sjcu-text-secondary text-sm mb-1.5">Description</label><textarea bind:value={form.description} rows={3} class="admin-input resize-none"></textarea></div>
		<div>
			<label class="block text-sjcu-text-secondary text-sm mb-1.5">Banner Image</label>
			{#if bannerPreview}<img src={bannerPreview} alt="Preview" class="w-full h-28 object-cover rounded-xl mb-2" />{/if}
			<input type="file" accept="image/*" onchange={handleFileChange} class="text-sjcu-text-secondary text-sm" />
		</div>
		<div class="flex items-center gap-2">
			<input type="checkbox" id="efeatured" bind:checked={form.featured} />
			<label for="efeatured" class="text-sjcu-text-secondary text-sm">Mark as featured</label>
		</div>
		<div class="flex justify-end gap-3 pt-2">
			<button type="button" onclick={() => (modalOpen = false)} class="btn-outline text-sm px-5 py-2.5">Cancel</button>
			<button type="submit" class="btn-primary text-sm px-5 py-2.5" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update' : 'Create'} Event</button>
		</div>
	</form>
</Modal>
