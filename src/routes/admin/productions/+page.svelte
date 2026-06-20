<script lang="ts">
	import { onMount } from 'svelte';
	import { Plus, Edit2, Trash2, Film, GripVertical, Save, ExternalLink, RefreshCw, FileText, Eye, EyeOff } from 'lucide-svelte';
	import { productionsApi } from '$lib/services/api.js';
	import type { Production } from '$lib/types/index.js';
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { showToast } from '$lib/stores/ui.js';

	let productions = $state<Production[]>([]);
	let loading = $state(true);
	let modalOpen = $state(false);
	let editingId = $state<string | null>(null);
	let saving = $state(false);
	let savingOrder = $state(false);
	let orderChanged = $state(false);
	let thumbFile = $state<File | null>(null);
	let thumbPreview = $state('');
	let fetchingThumb = $state(false);
	let thumbCloudinaryUrl = $state('');
	let fetchingDesc = $state(false);
	let syncingId = $state<string | null>(null);
	let togglingId = $state<string | null>(null);

	let dragIndex = $state<number | null>(null);
	let dragOverIndex = $state<number | null>(null);

	let form = $state({ title: '', youtubeLink: '', description: '', releaseDate: '', category: 'General Songs', featured: false });

	function getYoutubeThumbnail(url: string) {
		const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
		return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : '';
	}

	async function load() {
		loading = true; orderChanged = false;
		try { const res = await productionsApi.getAll({ admin: 'true' }); productions = res.data.data.productions || []; }
		catch { productions = []; } finally { loading = false; }
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
		const arr = [...productions];
		const [moved] = arr.splice(dragIndex, 1);
		arr.splice(toIndex, 0, moved);
		productions = arr.map((p, i) => ({ ...p, order: i }));
		orderChanged = true; dragIndex = null; dragOverIndex = null;
	}
	function onDragEnd() { dragIndex = null; dragOverIndex = null; }

	async function saveOrder() {
		savingOrder = true;
		try {
			await productionsApi.reorder(productions.map((p, i) => ({ id: p._id, order: i })));
			showToast('Order saved!', 'success'); orderChanged = false;
		} catch { showToast('Failed to save order', 'error'); } finally { savingOrder = false; }
	}

	function openCreate() {
		editingId = null;
		form = { title: '', youtubeLink: '', description: '', releaseDate: '', category: 'Christmas Songs', featured: false };
		thumbFile = null; thumbPreview = ''; thumbCloudinaryUrl = ''; modalOpen = true;
	}
	function openEdit(p: Production) {
		editingId = p._id;
		form = { title: p.title, youtubeLink: p.youtubeLink, description: p.description, releaseDate: p.releaseDate?.slice(0, 10) || '', category: p.category, featured: p.featured };
		thumbFile = null; thumbCloudinaryUrl = ''; thumbPreview = p.thumbnail || getYoutubeThumbnail(p.youtubeLink); modalOpen = true;
	}
	function handleFileChange(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (file) { thumbFile = file; thumbCloudinaryUrl = ''; thumbPreview = URL.createObjectURL(file); }
	}
	async function fetchThumbFromYoutube() {
		if (!form.youtubeLink) { showToast('Enter a YouTube link first', 'error'); return; }
		fetchingThumb = true;
		try {
			const res = await productionsApi.fetchYoutubeThumbnail(form.youtubeLink);
			thumbCloudinaryUrl = res.data.data.thumbnailUrl;
			thumbFile = null;
			thumbPreview = thumbCloudinaryUrl;
			showToast('Thumbnail fetched!', 'success');
		} catch {
			showToast('Could not fetch YouTube thumbnail', 'error');
		} finally {
			fetchingThumb = false;
		}
	}
	async function toggleHide(p: Production) {
		togglingId = p._id;
		try {
			const res = await productionsApi.toggleHidden(p._id);
			const updated = res.data.data.production;
			productions = productions.map(pr => pr._id === p._id ? { ...pr, hidden: updated.hidden } : pr);
			showToast(updated.hidden ? 'Production hidden from public' : 'Production is now visible', 'success');
		} catch {
			showToast('Failed to update visibility', 'error');
		} finally {
			togglingId = null;
		}
	}

	async function fetchDescFromYoutube() {
		if (!form.youtubeLink) { showToast('Enter a YouTube link first', 'error'); return; }
		fetchingDesc = true;
		try {
			const res = await productionsApi.fetchYoutubeDescription(form.youtubeLink);
			const { description } = res.data.data;
			form.description = description || '';
			showToast('Description fetched from YouTube!', 'success');
		} catch (err: any) {
			const msg = err?.response?.data?.message || 'Could not fetch description';
			showToast(msg, 'error');
		} finally {
			fetchingDesc = false;
		}
	}

	async function handleSave(e: SubmitEvent) {
		e.preventDefault(); saving = true;
		try {
			const fd = new FormData();
			Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
			if (thumbCloudinaryUrl) fd.append('thumbnailUrl', thumbCloudinaryUrl);
			if (thumbFile) fd.append('thumbnail', thumbFile);
			if (editingId) { await productionsApi.update(editingId, fd); showToast('Production updated!', 'success'); }
			else { await productionsApi.create(fd); showToast('Production created!', 'success'); }
			modalOpen = false; await load();
		} catch { showToast('Failed to save', 'error'); } finally { saving = false; }
	}
	async function syncThumbnail(p: Production) {
		if (!p.youtubeLink) { showToast('No YouTube link on this production', 'error'); return; }
		syncingId = p._id;
		try {
			const res = await productionsApi.syncThumbnail(p._id);
			const updated = res.data.data.production;
			productions = productions.map(pr => pr._id === p._id ? { ...pr, thumbnail: updated.thumbnail } : pr);
			showToast('Thumbnail synced from YouTube!', 'success');
		} catch {
			showToast('Failed to sync thumbnail', 'error');
		} finally {
			syncingId = null;
		}
	}

	async function handleDelete(id: string) {
		if (!confirm('Delete this production?')) return;
		try { await productionsApi.delete(id); showToast('Deleted', 'success'); productions = productions.filter(p => p._id !== id); }
		catch { showToast('Failed to delete', 'error'); }
	}
</script>

<svelte:head><title>Productions — SJCU Admin</title></svelte:head>

<div class="space-y-6">
	<div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
		<div>
			<h2 class="font-display text-2xl font-bold text-white">Productions</h2>
			<p class="text-sjcu-text-muted text-sm">{productions.length} total productions</p>
		</div>
		<div class="flex items-center gap-2 flex-wrap">
			{#if orderChanged}
				<button onclick={saveOrder} disabled={savingOrder} class="btn-primary text-sm gap-2">
					<Save class="w-4 h-4" />{savingOrder ? 'Saving...' : 'Save Order'}
				</button>
			{/if}
			<button onclick={openCreate} class="btn-primary text-sm"><Plus class="w-4 h-4" /> Add Production</button>
		</div>
	</div>

	{#if productions.length > 0 && !loading}
		<div class="flex items-center gap-2 text-sjcu-text-muted text-xs">
			<GripVertical class="w-3.5 h-3.5" />
			<span>Drag rows to reorder — click <strong class="text-sjcu-accent">Save Order</strong> to apply</span>
		</div>
	{/if}

	{#if loading}
		<LoadingSpinner size="lg" class="py-20" />
	{:else if productions.length === 0}
		<div class="text-center py-16 text-sjcu-text-muted">
			<Film class="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No productions yet.</p>
		</div>
	{:else}
		<div class="space-y-2">
			{#each productions as p, i}
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
					<!-- Drag handle + index: desktop only (touch drag not reliable) -->
					<div class="hidden sm:block text-sjcu-text-muted/30 group-hover:text-sjcu-text-muted transition-colors flex-shrink-0">
						<GripVertical class="w-5 h-5" />
					</div>
					<span class="hidden sm:inline text-xs text-sjcu-text-muted w-5 flex-shrink-0 font-mono">#{i + 1}</span>

					<!-- Thumbnail -->
					<div class="w-14 h-9 sm:w-20 sm:h-12 rounded-lg overflow-hidden flex-shrink-0 bg-sjcu-navy">
						{#if p.thumbnail}
							<img src={p.thumbnail} alt={p.title} class="w-full h-full object-cover pointer-events-none" />
						{:else if p.youtubeLink}
							<img src={getYoutubeThumbnail(p.youtubeLink)} alt={p.title} class="w-full h-full object-cover pointer-events-none" />
						{:else}
							<div class="w-full h-full flex items-center justify-center"><Film class="w-5 h-5 text-sjcu-text-muted" /></div>
						{/if}
					</div>

					<!-- Info -->
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-1.5 mb-0.5 min-w-0">
							<p class="text-sm truncate font-semibold {p.hidden ? 'text-sjcu-text-muted line-through' : 'text-white'}">{p.title}</p>
							{#if p.featured}<span class="hidden sm:inline px-1.5 py-0.5 text-[10px] bg-sjcu-purple/20 text-sjcu-accent rounded flex-shrink-0">Featured</span>{/if}
							{#if p.hidden}<span class="px-1.5 py-0.5 text-[10px] bg-orange-500/20 text-orange-400 rounded flex-shrink-0">Hidden</span>{/if}
						</div>
						<div class="flex items-center gap-2 text-xs text-sjcu-text-muted">
							<span class="truncate">{p.category}</span>
							{#if p.releaseDate}<span class="flex-shrink-0">{new Date(p.releaseDate).getFullYear()}</span>{/if}
						</div>
					</div>

					<!-- Mobile: Edit + Delete only (always visible) -->
					<div class="flex sm:hidden items-center gap-1 flex-shrink-0">
						<button onclick={() => openEdit(p)} class="p-2 rounded-lg bg-blue-500/15 text-blue-400 active:bg-blue-500/30"><Edit2 class="w-4 h-4" /></button>
						<button onclick={() => handleDelete(p._id)} class="p-2 rounded-lg bg-red-500/15 text-red-400 active:bg-red-500/30"><Trash2 class="w-4 h-4" /></button>
					</div>

					<!-- Desktop: all actions, hover-reveal -->
					<div class="hidden sm:flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
						<a href={p.youtubeLink} target="_blank" rel="noopener noreferrer" class="p-2 rounded-lg hover:bg-white/10 text-sjcu-text-muted hover:text-white transition-colors" onclick={(e) => e.stopPropagation()}>
							<ExternalLink class="w-4 h-4" />
						</a>
						{#if p.youtubeLink}
							<button
								onclick={() => syncThumbnail(p)}
								disabled={syncingId === p._id}
								title="Sync thumbnail from YouTube"
								class="p-2 rounded-lg hover:bg-yellow-500/20 text-sjcu-text-muted hover:text-yellow-400 transition-colors disabled:opacity-50"
							>
								<RefreshCw class="w-4 h-4 {syncingId === p._id ? 'animate-spin' : ''}" />
							</button>
						{/if}
						<button
							onclick={() => toggleHide(p)}
							disabled={togglingId === p._id}
							title={p.hidden ? 'Make visible' : 'Hide from public'}
							class="p-2 rounded-lg transition-colors disabled:opacity-50
								{p.hidden ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30' : 'hover:bg-orange-500/20 text-sjcu-text-muted hover:text-orange-400'}"
						>
							{#if p.hidden}
								<Eye class="w-4 h-4" />
							{:else}
								<EyeOff class="w-4 h-4" />
							{/if}
						</button>
						<button onclick={() => openEdit(p)} class="p-2 rounded-lg hover:bg-blue-500/20 text-sjcu-text-muted hover:text-blue-400 transition-colors"><Edit2 class="w-4 h-4" /></button>
						<button onclick={() => handleDelete(p._id)} class="p-2 rounded-lg hover:bg-red-500/20 text-sjcu-text-muted hover:text-red-400 transition-colors"><Trash2 class="w-4 h-4" /></button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<Modal open={modalOpen} title={editingId ? 'Edit Production' : 'Add New Production'} onClose={() => (modalOpen = false)}>
	<form onsubmit={handleSave} class="space-y-4">
		<div><label class="block text-sjcu-text-secondary text-sm mb-1.5">Title *</label><input bind:value={form.title} class="admin-input" required /></div>
		<div><label class="block text-sjcu-text-secondary text-sm mb-1.5">YouTube Link *</label><input bind:value={form.youtubeLink} class="admin-input" placeholder="https://youtube.com/watch?v=..." required /></div>
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<div>
				<label class="block text-sjcu-text-secondary text-sm mb-1.5">Category *</label>
				<select bind:value={form.category} class="admin-select">
					<option>General Songs</option><option>Special Songs</option><option>Christmas Songs</option><option>Church Dedication Songs</option><option>Wedding Songs</option><option>Lent Days Song</option>
				</select>
			</div>
			<div><label class="block text-sjcu-text-secondary text-sm mb-1.5">Release Date</label><input bind:value={form.releaseDate} type="date" class="admin-input" /></div>
		</div>
		<div>
			<div class="flex items-center justify-between mb-1.5">
				<label class="text-sjcu-text-secondary text-sm">Description</label>
				<button
					type="button"
					onclick={fetchDescFromYoutube}
					disabled={fetchingDesc || !form.youtubeLink}
					class="flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed
						{form.description ? 'border-green-500/40 text-green-400 bg-green-500/8 hover:bg-green-500/15' : 'border-red-500/40 text-red-400 bg-red-500/8 hover:bg-red-500/15'}"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a2.994 2.994 0 0 0-2.109-2.118C19.506 3.546 12 3.546 12 3.546s-7.506 0-9.389.522A2.994 2.994 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a2.994 2.994 0 0 0 2.109 2.118C4.494 20.454 12 20.454 12 20.454s7.506 0 9.389-.522a2.994 2.994 0 0 0 2.109-2.118C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
					{fetchingDesc ? 'Fetching…' : 'Fetch from YouTube'}
				</button>
			</div>
			<textarea bind:value={form.description} rows={4} class="admin-input resize-none" placeholder="Write a description or fetch it from the YouTube video above…"></textarea>
		</div>
		<div>
			<label class="block text-sjcu-text-secondary text-sm mb-2">Thumbnail</label>
			{#if thumbPreview}
				<img src={thumbPreview} alt="Preview" class="w-full h-32 object-cover rounded-xl mb-3" />
			{/if}
			<div class="flex items-center gap-2">
				<!-- Upload custom file -->
				<label class="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-sjcu-border text-sjcu-text-secondary text-sm cursor-pointer hover:border-sjcu-purple/50 hover:text-white transition-all duration-150">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
					Upload Image
					<input type="file" accept="image/*" onchange={handleFileChange} class="hidden" />
				</label>
				<!-- Fetch from YouTube -->
				<button
					type="button"
					onclick={fetchThumbFromYoutube}
					disabled={fetchingThumb}
					class="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all duration-150 disabled:opacity-50
						{thumbCloudinaryUrl ? 'border-green-500/50 text-green-400 bg-green-500/10' : 'border-red-500/40 text-red-400 bg-red-500/10 hover:border-red-400 hover:bg-red-500/15'}"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a2.994 2.994 0 0 0-2.109-2.118C19.506 3.546 12 3.546 12 3.546s-7.506 0-9.389.522A2.994 2.994 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a2.994 2.994 0 0 0 2.109 2.118C4.494 20.454 12 20.454 12 20.454s7.506 0 9.389-.522a2.994 2.994 0 0 0 2.109-2.118C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
					{fetchingThumb ? 'Fetching...' : thumbCloudinaryUrl ? 'Re-fetch YouTube' : 'Take from YouTube'}
				</button>
			</div>
		</div>
		<div class="flex items-center gap-2">
			<input type="checkbox" id="pfeatured" bind:checked={form.featured} />
			<label for="pfeatured" class="text-sjcu-text-secondary text-sm">Mark as featured</label>
		</div>
		<div class="flex justify-end gap-3 pt-2">
			<button type="button" onclick={() => (modalOpen = false)} class="btn-outline text-sm px-5 py-2.5">Cancel</button>
			<button type="submit" class="btn-primary text-sm px-5 py-2.5" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update' : 'Create'} Production</button>
		</div>
	</form>
</Modal>
