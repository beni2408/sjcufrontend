<script lang="ts">
	import { onMount } from 'svelte';
	import { Plus, Edit2, Trash2, GripVertical, Save, Images, X, Upload, Play, Calendar, MapPin, Film } from 'lucide-svelte';
	import { memorableEventsApi } from '$lib/services/api.js';
	import type { MemorableEvent } from '$lib/types/index.js';
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { showToast } from '$lib/stores/ui.js';

	let events = $state<MemorableEvent[]>([]);
	let loading = $state(true);
	let modalOpen = $state(false);
	let galleryModalOpen = $state(false);
	let editingId = $state<string | null>(null);
	let managingEvent = $state<MemorableEvent | null>(null);
	let saving = $state(false);
	let savingOrder = $state(false);
	let orderChanged = $state(false);
	let coverFile = $state<File | null>(null);
	let coverPreview = $state('');
	let galleryFiles = $state<File[]>([]);
	let galleryPreviews = $state<{ url: string; isVideo: boolean }[]>([]);
	let uploadingGallery = $state(false);
	let fetchingCover = $state(false);
	let fetchingDesc = $state(false);
	let coverCloudinaryUrl = $state('');
	let deletingImg = $state<string | null>(null);

	let dragIndex = $state<number | null>(null);
	let dragOverIndex = $state<number | null>(null);

	let form = $state({ name: '', description: '', date: '', venue: '', youtubeLink: '', order: 0 });

	function formatDate(d: string) {
		if (!d) return '';
		return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
	}

	async function load() {
		loading = true; orderChanged = false;
		try {
			const res = await memorableEventsApi.getAll();
			events = res.data.data.events || [];
		} catch { events = []; } finally { loading = false; }
	}
	onMount(load);

	// drag
	function onDragStart(e: DragEvent, i: number) { dragIndex = i; if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'; }
	function onDragOver(e: DragEvent, i: number) { e.preventDefault(); dragOverIndex = i; }
	function onDrop(e: DragEvent, to: number) {
		e.preventDefault();
		if (dragIndex === null || dragIndex === to) { dragIndex = null; dragOverIndex = null; return; }
		const arr = [...events];
		const [moved] = arr.splice(dragIndex, 1);
		arr.splice(to, 0, moved);
		events = arr.map((ev, i) => ({ ...ev, order: i }));
		orderChanged = true; dragIndex = null; dragOverIndex = null;
	}
	function onDragEnd() { dragIndex = null; dragOverIndex = null; }

	async function saveOrder() {
		savingOrder = true;
		try {
			await memorableEventsApi.reorder(events.map((ev, i) => ({ id: ev._id, order: i })));
			orderChanged = false; showToast('Order saved', 'success');
		} catch { showToast('Failed to save order', 'error'); } finally { savingOrder = false; }
	}

	function openCreate() {
		editingId = null; coverFile = null; coverPreview = ''; coverCloudinaryUrl = '';
		form = { name: '', description: '', date: '', venue: '', youtubeLink: '', order: events.length };
		modalOpen = true;
	}
	function openEdit(ev: MemorableEvent) {
		editingId = ev._id; coverFile = null; coverPreview = ''; coverCloudinaryUrl = '';
		form = {
			name: ev.name, description: ev.description || '', venue: ev.venue || '',
			date: ev.date ? ev.date.slice(0, 10) : '',
			youtubeLink: ev.youtubeLink || '', order: ev.order,
		};
		modalOpen = true;
	}

	function openGalleryManager(ev: MemorableEvent) {
		managingEvent = ev; galleryFiles = []; galleryPreviews = []; galleryModalOpen = true;
	}

	function handleCoverChange(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		coverFile = file; coverPreview = URL.createObjectURL(file);
	}

	function handleGalleryChange(e: Event) {
		const files = Array.from((e.target as HTMLInputElement).files || []);
		if (!files.length) return;
		galleryFiles = files;
		galleryPreviews = files.map(f => ({ url: URL.createObjectURL(f), isVideo: f.type.startsWith('video/') }));
	}

	async function fetchCoverFromYoutube() {
		if (!form.youtubeLink) { showToast('Enter a YouTube link first', 'error'); return; }
		fetchingCover = true;
		try {
			const res = await memorableEventsApi.fetchYoutubeCover(form.youtubeLink);
			coverCloudinaryUrl = res.data.data.coverUrl;
			coverFile = null;
			coverPreview = coverCloudinaryUrl;
			showToast('Cover image fetched from YouTube!', 'success');
		} catch {
			showToast('Could not fetch YouTube thumbnail', 'error');
		} finally {
			fetchingCover = false;
		}
	}

	async function fetchDescFromYoutube() {
		if (!form.youtubeLink) { showToast('Enter a YouTube link first', 'error'); return; }
		fetchingDesc = true;
		try {
			const res = await memorableEventsApi.fetchYoutubeDescription(form.youtubeLink);
			form.description = res.data.data.description || '';
			showToast('Description fetched from YouTube!', 'success');
		} catch (err: any) {
			showToast(err?.response?.data?.message || 'Could not fetch description', 'error');
		} finally {
			fetchingDesc = false;
		}
	}

	async function handleSubmit() {
		if (!form.name.trim()) { showToast('Event name is required', 'error'); return; }
		saving = true;
		try {
			const fd = new FormData();
			fd.append('name', form.name.trim());
			fd.append('description', form.description);
			fd.append('venue', form.venue);
			fd.append('youtubeLink', form.youtubeLink);
			fd.append('order', String(form.order));
			if (form.date) fd.append('date', form.date);
			if (coverFile) fd.append('coverImage', coverFile);
			else if (coverCloudinaryUrl) fd.append('coverImageUrl', coverCloudinaryUrl);

			if (editingId) { await memorableEventsApi.update(editingId, fd); showToast('Event updated', 'success'); }
			else { await memorableEventsApi.create(fd); showToast('Event created', 'success'); }
			modalOpen = false; await load();
		} catch { showToast('Failed to save event', 'error'); } finally { saving = false; }
	}

	async function uploadGallery() {
		if (!managingEvent || galleryFiles.length === 0) return;
		uploadingGallery = true;
		try {
			const fd = new FormData();
			galleryFiles.forEach(f => fd.append('files', f));
			const count = galleryFiles.length;
			const res = await memorableEventsApi.addGallery(managingEvent._id, fd);
			managingEvent = res.data.data.event;
			events = events.map(ev => ev._id === managingEvent!._id ? managingEvent! : ev);
			galleryFiles = []; galleryPreviews = [];
			showToast(`${count} photo${count !== 1 ? 's' : ''} uploaded`, 'success');
		} catch { showToast('Upload failed', 'error'); } finally { uploadingGallery = false; }
	}

	async function deleteGalleryImg(imageUrl: string) {
		if (!managingEvent) return;
		deletingImg = imageUrl;
		try {
			const res = await memorableEventsApi.deleteGalleryImage(managingEvent._id, imageUrl);
			managingEvent = res.data.data.event;
			events = events.map(ev => ev._id === managingEvent!._id ? managingEvent! : ev);
			showToast('Image deleted', 'success');
		} catch { showToast('Failed to delete image', 'error'); } finally { deletingImg = null; }
	}

	function getGalleryUrl(item: MemorableEvent['gallery'][number]): string {
		return typeof item === 'string' ? item : item.url;
	}
	function getGalleryType(item: MemorableEvent['gallery'][number]): 'image' | 'video' {
		return typeof item === 'string' ? 'image' : item.type;
	}

	async function handleDelete(ev: MemorableEvent) {
		if (!confirm(`Delete "${ev.name}"? All images will be removed.`)) return;
		try {
			await memorableEventsApi.delete(ev._id);
			showToast('Event deleted', 'success'); await load();
		} catch { showToast('Failed to delete', 'error'); }
	}
</script>

<div class="space-y-6">
	<!-- header -->
	<div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
		<div>
			<h1 class="font-display text-2xl font-bold text-white">Memorable Events</h1>
			<p class="text-sjcu-text-muted text-sm mt-1">{events.length} event{events.length !== 1 ? 's' : ''}</p>
		</div>
		<div class="flex items-center gap-2 flex-wrap">
			{#if orderChanged}
				<button onclick={saveOrder} disabled={savingOrder}
					class="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors disabled:opacity-50">
					<Save class="w-4 h-4" />{savingOrder ? 'Saving…' : 'Save Order'}
				</button>
			{/if}
			<button onclick={openCreate}
				class="flex items-center gap-2 px-4 py-2 rounded-xl bg-sjcu-purple hover:bg-sjcu-purple-light text-white text-sm font-medium transition-colors">
				<Plus class="w-4 h-4" />Add Event
			</button>
		</div>
	</div>

	{#if loading}
		<div class="flex justify-center py-20"><LoadingSpinner /></div>
	{:else if events.length === 0}
		<div class="flex flex-col items-center justify-center py-24 text-center">
			<div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
				<Images class="w-8 h-8 text-sjcu-text-muted" />
			</div>
			<p class="text-white font-medium mb-1">No memorable events yet</p>
			<p class="text-sjcu-text-muted text-sm">Add your first event to get started.</p>
		</div>
	{:else}
		<p class="text-sjcu-text-muted text-xs">Drag rows to reorder.</p>
		<div class="space-y-3">
			{#each events as ev, i}
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

					<!-- Cover thumbnail: compact on mobile -->
					<div class="w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-sjcu-navy border border-white/10 flex-shrink-0">
						{#if ev.coverImage}
							<img src={ev.coverImage} alt={ev.name} class="w-full h-full object-cover" />
						{:else}
							<div class="w-full h-full flex items-center justify-center">
								<Images class="w-5 h-5 text-sjcu-text-muted" />
							</div>
						{/if}
					</div>

					<!-- Info -->
					<div class="flex-1 min-w-0">
						<p class="text-white font-semibold text-sm truncate">{ev.name}</p>
						<div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
							{#if ev.date}
								<span class="flex items-center gap-1 text-xs text-sjcu-text-muted flex-shrink-0">
									<Calendar class="w-3 h-3" />{formatDate(ev.date)}
								</span>
							{/if}
							{#if ev.venue}
								<span class="hidden sm:flex items-center gap-1 text-xs text-sjcu-text-muted truncate">
									<MapPin class="w-3 h-3 flex-shrink-0" /><span class="truncate">{ev.venue}</span>
								</span>
							{/if}
							<span class="flex items-center gap-1 text-xs text-sjcu-text-muted flex-shrink-0">
								<Images class="w-3 h-3" />{ev.gallery.length}
							</span>
							{#if ev.youtubeLink}
								<span class="flex items-center gap-1 text-xs text-red-400 flex-shrink-0">
									<Play class="w-3 h-3" /><span class="hidden sm:inline">Video</span>
								</span>
							{/if}
						</div>
					</div>

					<!-- Actions: icon-only Gallery button on mobile, full label on sm+ -->
					<div class="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
						<button onclick={() => openGalleryManager(ev)}
							class="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-sjcu-purple/15 hover:bg-sjcu-purple/30 text-sjcu-accent text-xs font-medium transition-colors">
							<Images class="w-3.5 h-3.5 flex-shrink-0" />
							<span class="hidden sm:inline">Gallery</span>
						</button>
						<button onclick={() => openEdit(ev)}
							class="w-8 h-8 rounded-xl bg-blue-500/15 sm:bg-white/5 hover:bg-blue-500/20 text-blue-400 sm:text-sjcu-text-muted hover:text-blue-400 flex items-center justify-center transition-colors">
							<Edit2 class="w-4 h-4" />
						</button>
						<button onclick={() => handleDelete(ev)}
							class="w-8 h-8 rounded-xl bg-red-500/15 sm:bg-white/5 hover:bg-red-500/20 text-red-400 sm:text-sjcu-text-muted hover:text-red-400 flex items-center justify-center transition-colors">
							<Trash2 class="w-4 h-4" />
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Create / Edit modal -->
<Modal open={modalOpen} title={editingId ? 'Edit Event' : 'Add Memorable Event'} onClose={() => (modalOpen = false)}>
	<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-5">

		<!-- cover image -->
		<div class="flex flex-col items-center gap-3">
			<div class="w-full h-40 rounded-2xl overflow-hidden bg-white/5 border-2 border-dashed border-white/15 flex items-center justify-center">
				{#if coverPreview}
					<img src={coverPreview} alt="Preview" class="w-full h-full object-cover" />
				{:else if editingId && events.find(e => e._id === editingId)?.coverImage}
					<img src={events.find(e => e._id === editingId)?.coverImage} alt="Cover" class="w-full h-full object-cover" />
				{:else}
					<div class="text-center">
						<Images class="w-8 h-8 text-sjcu-text-muted mx-auto mb-1" />
						<p class="text-sjcu-text-muted text-xs">Cover Image</p>
					</div>
				{/if}
			</div>
			<div class="flex items-center gap-2 w-full">
				<label class="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/8 border border-white/15 text-sjcu-text-secondary hover:text-white hover:border-sjcu-purple/50 text-sm transition-colors cursor-pointer">
					<Upload class="w-3.5 h-3.5" />
					{coverFile ? 'Change Cover' : 'Upload Image'}
					<input type="file" accept="image/*" class="hidden" onchange={handleCoverChange} />
				</label>
				<button
					type="button"
					onclick={fetchCoverFromYoutube}
					disabled={fetchingCover || !form.youtubeLink}
					class="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed
						{coverCloudinaryUrl ? 'border-green-500/40 text-green-400 bg-green-500/8 hover:bg-green-500/15' : 'border-red-500/40 text-red-400 bg-red-500/8 hover:bg-red-500/15'}"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a2.994 2.994 0 0 0-2.109-2.118C19.506 3.546 12 3.546 12 3.546s-7.506 0-9.389.522A2.994 2.994 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a2.994 2.994 0 0 0 2.109 2.118C4.494 20.454 12 20.454 12 20.454s7.506 0 9.389-.522a2.994 2.994 0 0 0 2.109-2.118C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
					{fetchingCover ? 'Fetching…' : coverCloudinaryUrl ? 'Re-fetch' : 'From YouTube'}
				</button>
			</div>
		</div>

		<!-- name -->
		<div>
			<label class="block text-sjcu-text-muted text-xs mb-1.5 uppercase tracking-widest">Event Name *</label>
			<input bind:value={form.name} placeholder="e.g. Christmas Concert 2023"
				class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-sjcu-text-muted text-sm focus:outline-none focus:border-sjcu-purple/60 transition-all" />
		</div>

		<!-- date + venue -->
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<div>
				<label class="block text-sjcu-text-muted text-xs mb-1.5 uppercase tracking-widest">Date</label>
				<input bind:value={form.date} type="date"
					class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-sjcu-purple/60 transition-all" />
			</div>
			<div>
				<label class="block text-sjcu-text-muted text-xs mb-1.5 uppercase tracking-widest">Venue</label>
				<input bind:value={form.venue} placeholder="Church Hall, Arumuganeri"
					class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-sjcu-text-muted text-sm focus:outline-none focus:border-sjcu-purple/60 transition-all" />
			</div>
		</div>

		<!-- description -->
		<div>
			<div class="flex items-center justify-between mb-1.5">
				<label class="text-sjcu-text-muted text-xs uppercase tracking-widest">Description</label>
				<button
					type="button"
					onclick={fetchDescFromYoutube}
					disabled={fetchingDesc || !form.youtubeLink}
					class="flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed
						{form.description ? 'border-green-500/40 text-green-400 bg-green-500/8 hover:bg-green-500/15' : 'border-red-500/40 text-red-400 bg-red-500/8 hover:bg-red-500/15'}"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a2.994 2.994 0 0 0-2.109-2.118C19.506 3.546 12 3.546 12 3.546s-7.506 0-9.389.522A2.994 2.994 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a2.994 2.994 0 0 0 2.109 2.118C4.494 20.454 12 20.454 12 20.454s7.506 0 9.389-.522a2.994 2.994 0 0 0 2.109-2.118C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
					{fetchingDesc ? 'Fetching…' : 'Fetch from YouTube'}
				</button>
			</div>
			<textarea bind:value={form.description} rows="3" placeholder="Describe the event or fetch from YouTube above…"
				class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-sjcu-text-muted text-sm focus:outline-none focus:border-sjcu-purple/60 transition-all resize-none"></textarea>
		</div>

		<!-- youtube link -->
		<div>
			<label class="flex items-center gap-2 text-sjcu-text-muted text-xs mb-1.5 uppercase tracking-widest">
				<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-red-400" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a2.994 2.994 0 0 0-2.109-2.118C19.506 3.546 12 3.546 12 3.546s-7.506 0-9.389.522A2.994 2.994 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a2.994 2.994 0 0 0 2.109 2.118C4.494 20.454 12 20.454 12 20.454s7.506 0 9.389-.522a2.994 2.994 0 0 0 2.109-2.118C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
				YouTube Video Link
			</label>
			<input bind:value={form.youtubeLink} placeholder="https://youtube.com/watch?v=..."
				class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-sjcu-text-muted text-sm focus:outline-none focus:border-sjcu-purple/60 transition-all" />
		</div>

		<div class="flex justify-end gap-3 pt-2">
			<button type="button" onclick={() => (modalOpen = false)}
				class="px-5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sjcu-text-secondary hover:text-white text-sm transition-colors">
				Cancel
			</button>
			<button type="submit" disabled={saving}
				class="px-6 py-2.5 rounded-xl bg-sjcu-purple hover:bg-sjcu-purple-light text-white text-sm font-medium transition-colors disabled:opacity-50">
				{saving ? 'Saving…' : editingId ? 'Update Event' : 'Create Event'}
			</button>
		</div>
	</form>
</Modal>

<!-- Gallery manager modal -->
{#if managingEvent}
<Modal open={galleryModalOpen} title="Manage Gallery — {managingEvent.name}" onClose={() => (galleryModalOpen = false)}>
	<div class="space-y-5">
		<!-- upload new images -->
		<div>
			<label class="block text-sjcu-text-muted text-xs mb-2 uppercase tracking-widest">Add Photos & Videos</label>
			<label class="flex flex-col items-center justify-center gap-2 w-full py-6 rounded-2xl border-2 border-dashed border-white/15 hover:border-sjcu-purple/50 cursor-pointer transition-colors">
				<Upload class="w-6 h-6 text-sjcu-text-muted" />
				<span class="text-sjcu-text-muted text-sm">{galleryFiles.length > 0 ? `${galleryFiles.length} file(s) selected` : 'Click to select photos or videos'}</span>
				<span class="text-sjcu-text-muted text-xs">Images (JPG, PNG, WebP) or Videos (MP4, MOV, WebM) • Multiple</span>
				<input type="file" accept="image/*,video/*" multiple class="hidden" onchange={handleGalleryChange} />
			</label>

			<!-- previews -->
			{#if galleryPreviews.length > 0}
				<div class="grid grid-cols-4 gap-2 mt-3">
					{#each galleryPreviews as prev}
						<div class="aspect-square rounded-xl overflow-hidden relative bg-black">
							{#if prev.isVideo}
								<!-- svelte-ignore a11y_media_has_caption -->
								<video src={prev.url} preload="metadata" class="w-full h-full object-cover opacity-80"></video>
								<div class="absolute inset-0 flex items-center justify-center pointer-events-none">
									<div class="w-7 h-7 rounded-full bg-black/50 flex items-center justify-center">
										<Play class="w-3.5 h-3.5 fill-white text-white" />
									</div>
								</div>
							{:else}
								<img src={prev.url} alt="Preview" class="w-full h-full object-cover" />
							{/if}
						</div>
					{/each}
				</div>
				<button onclick={uploadGallery} disabled={uploadingGallery}
					class="mt-3 w-full py-2.5 rounded-xl bg-sjcu-purple hover:bg-sjcu-purple-light text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
					<Upload class="w-4 h-4" />
					{uploadingGallery ? 'Uploading…' : `Upload ${galleryFiles.length} File${galleryFiles.length !== 1 ? 's' : ''}`}
				</button>
			{/if}
		</div>

		<!-- existing gallery -->
		{#if managingEvent.gallery.length > 0}
			<div>
				<label class="block text-sjcu-text-muted text-xs mb-2 uppercase tracking-widest">
					Existing Media ({managingEvent.gallery.length})
				</label>
				<div class="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1" style="scrollbar-width: thin;">
					{#each managingEvent.gallery as item}
						{@const url = getGalleryUrl(item)}
						{@const type = getGalleryType(item)}
						<div class="group relative aspect-square rounded-xl overflow-hidden bg-black">
							{#if type === 'video'}
								<!-- svelte-ignore a11y_media_has_caption -->
								<video src={url} preload="metadata" class="w-full h-full object-cover opacity-80"></video>
								<div class="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center pointer-events-none">
									<Film class="w-2.5 h-2.5 text-white" />
								</div>
							{:else}
								<img src={url} alt="Gallery" class="w-full h-full object-cover" />
							{/if}
							<button
								onclick={() => deleteGalleryImg(url)}
								disabled={deletingImg === url}
								class="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
							>
								{#if deletingImg === url}
									<div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
								{:else}
									<X class="w-5 h-5 text-red-400" />
								{/if}
							</button>
						</div>
					{/each}
				</div>
			</div>
		{:else}
			<p class="text-sjcu-text-muted text-sm text-center py-4">No media yet — upload some above.</p>
		{/if}

		<div class="flex justify-end">
			<button onclick={() => (galleryModalOpen = false)}
				class="px-5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sjcu-text-secondary hover:text-white text-sm transition-colors">
				Done
			</button>
		</div>
	</div>
</Modal>
{/if}
