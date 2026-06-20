<script lang="ts">
	import { onMount } from 'svelte';
	import { Upload, Trash2, Image, GripVertical, Save, Video, Play, Shuffle } from 'lucide-svelte';
	import { galleryApi, settingsApi } from '$lib/services/api.js';
	import type { GalleryItem } from '$lib/types/index.js';
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
	import { showToast } from '$lib/stores/ui.js';

	let items = $state<GalleryItem[]>([]);
	let loading = $state(true);
	let activeCategory = $state('All');
	let uploading = $state(false);
	let addingVideo = $state(false);
	let savingOrder = $state(false);
	let orderChanged = $state(false);
	let shuffled = $state(false);
	let savingShuffled = $state(false);

	// image upload form
	let uploadFiles = $state<FileList | null>(null);
	let uploadCategory = $state('Events');
	let uploadCaption = $state('');
	let fileInputEl = $state<HTMLInputElement | undefined>(undefined);

	// video upload form
	let videoFile = $state<File | null>(null);
	let videoPreview = $state('');
	let videoCategory = $state('Events');
	let videoCaption = $state('');
	let videoInputEl = $state<HTMLInputElement | undefined>(undefined);

	// drag state
	let dragIndex = $state<number | null>(null);
	let dragOverIndex = $state<number | null>(null);

	const UPLOAD_CATS = ['Productions', 'Events', 'Choir Practice', 'Behind The Scenes', 'Team Moments'];
	const categories = ['All', ...UPLOAD_CATS];
	const filtered = $derived(activeCategory === 'All' ? items : items.filter((i) => i.category === activeCategory));
	const isDraggable = $derived(activeCategory === 'All');

	async function load() {
		loading = true;
		orderChanged = false;
		try {
			const [galleryRes, settingsRes] = await Promise.all([galleryApi.getAll(), settingsApi.get()]);
			items = galleryRes.data.data.gallery || [];
			shuffled = settingsRes.data.data.settings?.galleryShuffled ?? false;
		} catch { items = []; } finally { loading = false; }
	}
	onMount(load);

	async function toggleShuffle() {
		savingShuffled = true;
		try {
			const fd = new FormData();
			fd.append('galleryShuffled', String(!shuffled));
			await settingsApi.update(fd);
			shuffled = !shuffled;
			showToast(shuffled ? 'Shuffle view enabled' : 'Shuffle view disabled', 'success');
		} catch { showToast('Failed to update shuffle setting', 'error'); }
		finally { savingShuffled = false; }
	}

	// ── Drag & Drop ──────────────────────────────────────────────────
	function onDragStart(e: DragEvent, index: number) {
		dragIndex = index;
		if (e.dataTransfer) { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(index)); }
	}
	function onDragOver(e: DragEvent, index: number) {
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
		dragOverIndex = index;
	}
	function onDrop(e: DragEvent, toIndex: number) {
		e.preventDefault();
		if (dragIndex === null || dragIndex === toIndex) { dragIndex = null; dragOverIndex = null; return; }
		const updated = [...items];
		const [moved] = updated.splice(dragIndex, 1);
		updated.splice(toIndex, 0, moved);
		items = updated.map((m, i) => ({ ...m, order: i }));
		orderChanged = true;
		dragIndex = null; dragOverIndex = null;
	}
	function onDragEnd() { dragIndex = null; dragOverIndex = null; }

	async function saveOrder() {
		savingOrder = true;
		try {
			await galleryApi.reorder(items.map((m, i) => ({ id: m._id, order: i })));
			showToast('Order saved!', 'success');
			orderChanged = false;
		} catch { showToast('Failed to save order', 'error'); }
		finally { savingOrder = false; }
	}

	// ── Image Upload ─────────────────────────────────────────────────
	async function handleUpload(e: SubmitEvent) {
		e.preventDefault();
		if (!uploadFiles || uploadFiles.length === 0) { showToast('Please select images', 'error'); return; }
		uploading = true;
		try {
			const fd = new FormData();
			Array.from(uploadFiles).forEach((f) => fd.append('images', f));
			fd.append('category', uploadCategory);
			if (uploadCaption) fd.append('caption', uploadCaption);
			await galleryApi.upload(fd);
			showToast(`${uploadFiles.length} image(s) uploaded!`, 'success');
			uploadFiles = null; uploadCaption = '';
			if (fileInputEl) fileInputEl.value = '';
			await load();
		} catch { showToast('Upload failed', 'error'); } finally { uploading = false; }
	}

	// ── Video Upload ─────────────────────────────────────────────────
	function handleVideoFileChange(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		videoFile = file;
		videoPreview = URL.createObjectURL(file);
	}

	async function handleVideoUpload(e: SubmitEvent) {
		e.preventDefault();
		if (!videoFile) { showToast('Please select a video file', 'error'); return; }
		addingVideo = true;
		try {
			const fd = new FormData();
			fd.append('video', videoFile);
			fd.append('category', videoCategory);
			if (videoCaption) fd.append('caption', videoCaption);
			await galleryApi.uploadVideo(fd);
			showToast('Video uploaded!', 'success');
			videoFile = null; videoCaption = ''; videoPreview = '';
			if (videoInputEl) videoInputEl.value = '';
			await load();
		} catch { showToast('Video upload failed', 'error'); } finally { addingVideo = false; }
	}

	async function handleDelete(id: string) {
		if (!confirm('Delete this item?')) return;
		try { await galleryApi.delete(id); showToast('Deleted', 'success'); items = items.filter((i) => i._id !== id); }
		catch { showToast('Failed to delete', 'error'); }
	}

	function getCloudinaryVideoThumb(url: string): string {
		if (!url) return '';
		return url
			.replace('/video/upload/', '/video/upload/so_0,f_jpg,q_auto,w_640/')
			.replace(/\.\w+$/, '.jpg');
	}
</script>

<svelte:head><title>Gallery — SJCU Admin</title></svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
		<div>
			<h2 class="font-display text-2xl font-bold text-white">Media Gallery</h2>
			<p class="text-sjcu-text-muted text-sm">{items.length} total items</p>
		</div>
		<div class="flex items-center gap-3 flex-wrap">
			<!-- Shuffle toggle -->
			<button
				onclick={toggleShuffle}
				disabled={savingShuffled}
				class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200
					{shuffled
						? 'bg-sjcu-purple/20 text-sjcu-accent border-sjcu-purple/50'
						: 'bg-transparent text-sjcu-text-muted border-sjcu-border hover:border-sjcu-purple/40 hover:text-sjcu-text-primary'}"
				title="Toggle shuffle view for visitors"
			>
				<Shuffle class="w-4 h-4" />
				{savingShuffled ? 'Saving...' : shuffled ? 'Shuffle: On' : 'Shuffle: Off'}
			</button>

			{#if orderChanged && isDraggable}
				<button onclick={saveOrder} disabled={savingOrder} class="btn-primary text-sm gap-2">
					<Save class="w-4 h-4" />
					{savingOrder ? 'Saving...' : 'Save Order'}
				</button>
			{/if}
		</div>
	</div>

	<!-- Upload forms — side by side on larger screens -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">

		<!-- Image upload -->
		<div class="admin-card">
			<h3 class="text-white font-semibold mb-4 flex items-center gap-2"><Upload class="w-4 h-4 text-sjcu-accent" /> Upload Images</h3>
			<form onsubmit={handleUpload} class="space-y-3">
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="block text-sjcu-text-secondary text-sm mb-1.5">Category *</label>
						<select bind:value={uploadCategory} class="admin-select">
							{#each UPLOAD_CATS as c}<option value={c}>{c}</option>{/each}
						</select>
					</div>
					<div>
						<label class="block text-sjcu-text-secondary text-sm mb-1.5">Caption</label>
						<input bind:value={uploadCaption} class="admin-input" placeholder="Optional caption..." />
					</div>
				</div>
				<div class="border-2 border-dashed border-sjcu-border rounded-xl p-5 text-center hover:border-sjcu-purple/50 transition-colors">
					<Image class="w-7 h-7 text-sjcu-text-muted mx-auto mb-2" />
					<input bind:this={fileInputEl} type="file" accept="image/*,.heic,.heif" multiple onchange={(e) => uploadFiles = (e.target as HTMLInputElement).files} class="text-sjcu-text-secondary text-sm" />
					<p class="text-sjcu-text-muted text-xs mt-1.5">PNG, JPG, WebP — multiple OK</p>
				</div>
				<button type="submit" class="btn-primary text-sm w-full" disabled={uploading}>
					{uploading ? 'Uploading...' : `Upload ${uploadFiles ? uploadFiles.length : 0} Image(s)`}
				</button>
			</form>
		</div>

		<!-- Video upload -->
		<div class="admin-card">
			<h3 class="text-white font-semibold mb-4 flex items-center gap-2"><Video class="w-4 h-4 text-sjcu-accent" /> Upload Video</h3>
			<form onsubmit={handleVideoUpload} class="space-y-3">
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="block text-sjcu-text-secondary text-sm mb-1.5">Category *</label>
						<select bind:value={videoCategory} class="admin-select">
							{#each UPLOAD_CATS as c}<option value={c}>{c}</option>{/each}
						</select>
					</div>
					<div>
						<label class="block text-sjcu-text-secondary text-sm mb-1.5">Caption</label>
						<input bind:value={videoCaption} class="admin-input" placeholder="Optional caption..." />
					</div>
				</div>
				<div class="border-2 border-dashed border-sjcu-border rounded-xl p-5 text-center hover:border-sjcu-purple/50 transition-colors">
					<Video class="w-7 h-7 text-sjcu-text-muted mx-auto mb-2" />
					<input
						bind:this={videoInputEl}
						type="file"
						accept="video/mp4,video/quicktime,video/webm,video/avi,video/x-matroska,.mp4,.mov,.webm,.avi,.mkv,.m4v"
						onchange={handleVideoFileChange}
						class="text-sjcu-text-secondary text-sm"
					/>
					<p class="text-sjcu-text-muted text-xs mt-1.5">MP4, MOV, WebM, AVI, MKV — up to 500 MB</p>
				</div>
				{#if videoPreview}
					<div class="relative rounded-xl overflow-hidden" style="aspect-ratio: 16/9;">
						<video src={videoPreview} class="w-full h-full object-cover" muted></video>
						<div class="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
							<Play class="w-10 h-10 text-white drop-shadow-lg" />
						</div>
						<span class="absolute bottom-2 left-2 text-white text-xs px-2 py-1 rounded bg-black/60">{videoFile?.name}</span>
					</div>
				{/if}
				<button type="submit" class="btn-primary text-sm w-full" disabled={addingVideo || !videoFile}>
					{addingVideo ? 'Uploading...' : 'Upload Video'}
				</button>
			</form>
		</div>
	</div>

	<!-- Filters + drag hint -->
	<div class="flex flex-wrap gap-2">
		{#each categories as cat}
			<button onclick={() => (activeCategory = cat)} class="px-3 py-1.5 rounded-full text-xs font-medium transition-all {activeCategory === cat ? 'bg-sjcu-purple text-white' : 'bg-sjcu-card border border-sjcu-border text-sjcu-text-secondary hover:border-sjcu-purple/40'}">
				{cat}
			</button>
		{/each}
	</div>

	{#if isDraggable && items.length > 0 && !loading}
		<div class="flex items-center gap-2 text-sjcu-text-muted text-xs">
			<GripVertical class="w-3.5 h-3.5" />
			<span>Drag cards to reorder — click <strong class="text-sjcu-accent">Save Order</strong> to apply</span>
		</div>
	{/if}

	{#if loading}
		<LoadingSpinner size="lg" class="py-20" />
	{:else if filtered.length === 0}
		<div class="text-center py-16 text-sjcu-text-muted"><Image class="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No items in this category.</p></div>
	{:else}
		<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
			{#each filtered as item, i}
				<div
					draggable={isDraggable}
					ondragstart={(e) => onDragStart(e, i)}
					ondragover={(e) => onDragOver(e, i)}
					ondrop={(e) => onDrop(e, i)}
					ondragend={onDragEnd}
					class="relative group rounded-xl overflow-hidden aspect-square select-none transition-all duration-200
						{isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}
						{dragOverIndex === i && dragIndex !== i ? 'ring-2 ring-sjcu-purple scale-105' : ''}
						{dragIndex === i ? 'opacity-40 scale-95' : ''}
					"
				>
					{#if item.type === 'video'}
						{@const thumb = getCloudinaryVideoThumb(item.videoUrl)}
						{#if thumb}
							<img src={thumb} alt={item.caption || item.category} class="w-full h-full object-cover" loading="lazy" />
						{:else}
							<div class="w-full h-full bg-sjcu-navy flex items-center justify-center">
								<Video class="w-10 h-10 text-sjcu-accent/60" />
							</div>
						{/if}
						<div class="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
							<div class="w-10 h-10 rounded-full bg-red-600/90 flex items-center justify-center">
								<Play class="w-5 h-5 text-white" />
							</div>
						</div>
					{:else}
						<img src={item.image} alt={item.caption || item.category} class="w-full h-full object-cover" loading="lazy" />
					{/if}

					<!-- Drag handle -->
					{#if isDraggable}
						<div class="absolute top-2 left-2 opacity-0 group-hover:opacity-60 transition-opacity pointer-events-none">
							<GripVertical class="w-4 h-4 text-white drop-shadow" />
						</div>
					{/if}

					<!-- Order badge -->
					<div class="absolute top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
						<span class="text-[10px] text-white bg-black/60 px-1.5 py-0.5 rounded-full">#{i + 1}</span>
					</div>

					<div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
						<span class="text-white text-xs px-2 py-1 rounded bg-sjcu-purple/70">{item.category}</span>
						{#if item.type === 'video'}
							<span class="text-red-300 text-[10px] px-2 py-0.5 rounded bg-red-900/60">Video</span>
						{/if}
						<button onclick={() => handleDelete(item._id)} class="p-2 rounded-full bg-red-500/80 text-white hover:bg-red-500 transition-colors">
							<Trash2 class="w-4 h-4" />
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
