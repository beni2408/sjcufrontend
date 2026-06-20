<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Plus, Edit2, Trash2, GripVertical, Save,
		Mic, Video, Music, Wand2, MessageSquare, CheckCircle2,
		Images, X
	} from 'lucide-svelte';
	import { upcomingApi } from '$lib/services/api.js';
	import type { UpcomingProject } from '$lib/types/index.js';
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { showToast } from '$lib/stores/ui.js';

	const STAGES = [
		{ key: 'discussion',      label: 'In Discussion',   icon: MessageSquare },
		{ key: 'pre_production',  label: 'Pre-Production',  icon: Music },
		{ key: 'audio_recording', label: 'Audio Recording', icon: Mic },
		{ key: 'video_recording', label: 'Video Recording', icon: Video },
		{ key: 'post_production', label: 'Post Production', icon: Wand2 },
		{ key: 'released',        label: 'Released',        icon: CheckCircle2 },
	] as const;

	type StageKey = typeof STAGES[number]['key'];

	// ─── State ────────────────────────────────────────────────────────────────
	let projects = $state<UpcomingProject[]>([]);
	let loading = $state(true);
	let saving = $state(false);
	let savingOrder = $state(false);
	let orderChanged = $state(false);

	// Modal - basic info
	let modalOpen = $state(false);
	let editingId = $state<string | null>(null);
	let featureFile = $state<File | null>(null);
	let featurePreview = $state('');
	let form = $state({ name: '', description: '', order: 0 });

	// Stage update modal
	let stageModalOpen = $state(false);
	let stageProject = $state<UpcomingProject | null>(null);
	let activeStageKey = $state<StageKey>('discussion');
	let stageForm = $state({ description: '' });
	let stageFiles = $state<File[]>([]);
	let stagePreviews = $state<string[]>([]);
	let stageSaving = $state(false);
	let deletingImageUrl = $state('');

	// Drag
	let dragIndex = $state<number | null>(null);
	let dragOverIndex = $state<number | null>(null);

	// ─── Load ──────────────────────────────────────────────────────────────────
	async function load() {
		loading = true;
		orderChanged = false;
		try {
			const res = await upcomingApi.getAll();
			projects = res.data.data.projects || [];
		} catch {
			projects = [];
		} finally {
			loading = false;
		}
	}
	onMount(load);

	// ─── Drag & Drop ───────────────────────────────────────────────────────────
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
		const updated = [...projects];
		const [moved] = updated.splice(dragIndex, 1);
		updated.splice(toIndex, 0, moved);
		projects = updated.map((p, i) => ({ ...p, order: i }));
		orderChanged = true;
		dragIndex = null;
		dragOverIndex = null;
	}
	function onDragEnd() { dragIndex = null; dragOverIndex = null; }

	async function saveOrder() {
		savingOrder = true;
		try {
			await upcomingApi.reorder(projects.map((p, i) => ({ id: p._id, order: i })));
			showToast('Order saved!', 'success');
			orderChanged = false;
		} catch {
			showToast('Failed to save order', 'error');
		} finally {
			savingOrder = false;
		}
	}

	// ─── CRUD - Basic Info ─────────────────────────────────────────────────────
	function openCreate() {
		editingId = null;
		form = { name: '', description: '', order: projects.length };
		featureFile = null;
		featurePreview = '';
		modalOpen = true;
	}

	function openEdit(p: UpcomingProject) {
		editingId = p._id;
		form = { name: p.name, description: p.description, order: p.order };
		featureFile = null;
		featurePreview = p.featureImage;
		modalOpen = true;
	}

	function handleFeatureFileChange(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (file) { featureFile = file; featurePreview = URL.createObjectURL(file); }
	}

	async function handleSave(e: SubmitEvent) {
		e.preventDefault();
		saving = true;
		try {
			const fd = new FormData();
			fd.append('name', form.name);
			fd.append('description', form.description);
			fd.append('order', String(form.order));
			if (featureFile) fd.append('featureImage', featureFile);

			if (editingId) {
				await upcomingApi.update(editingId, fd);
				showToast('Project updated!', 'success');
			} else {
				await upcomingApi.create(fd);
				showToast('Project created!', 'success');
			}
			modalOpen = false;
			await load();
		} catch {
			showToast('Failed to save project', 'error');
		} finally {
			saving = false;
		}
	}

	async function handleDelete(id: string) {
		if (!confirm('Delete this project and all its images?')) return;
		try {
			await upcomingApi.delete(id);
			showToast('Project deleted', 'success');
			projects = projects.filter(p => p._id !== id);
		} catch {
			showToast('Failed to delete', 'error');
		}
	}

	// ─── Stage Update ──────────────────────────────────────────────────────────
	function openStageModal(p: UpcomingProject) {
		stageProject = p;
		activeStageKey = p.currentStage;
		stageForm = { description: p[p.currentStage]?.description ?? '' };
		stageFiles = []; stagePreviews = [];
		stageModalOpen = true;
	}

	function selectStage(key: StageKey) {
		if (!stageProject) return;
		activeStageKey = key;
		stageForm = { description: stageProject[key]?.description ?? '' };
		stageFiles = []; stagePreviews = [];
	}

	function handleStageFilesChange(e: Event) {
		const files = (e.target as HTMLInputElement).files;
		if (!files) return;
		stageFiles = Array.from(files);
		stagePreviews = stageFiles.map(f => URL.createObjectURL(f));
	}

	async function handleStageUpdate() {
		if (!stageProject) return;
		stageSaving = true;
		try {
			const fd = new FormData();
			fd.append('stageKey', activeStageKey);
			fd.append('description', stageForm.description);
			for (const file of stageFiles) fd.append('images', file);

			const res = await upcomingApi.updateStage(stageProject._id, fd);
			const updated = res.data.data.project as UpcomingProject;
			stageProject = updated;
			projects = projects.map(p => p._id === updated._id ? updated : p);
			stageFiles = []; stagePreviews = [];
			showToast('Stage updated!', 'success');
		} catch {
			showToast('Failed to update stage', 'error');
		} finally {
			stageSaving = false;
		}
	}

	async function handleDeleteStageImage(imageUrl: string) {
		if (!stageProject) return;
		deletingImageUrl = imageUrl;
		try {
			const res = await upcomingApi.deleteStageImage(stageProject._id, activeStageKey, imageUrl);
			const updated = res.data.data.project as UpcomingProject;
			stageProject = updated;
			projects = projects.map(p => p._id === updated._id ? updated : p);
			showToast('Image deleted', 'success');
		} catch {
			showToast('Failed to delete image', 'error');
		} finally {
			deletingImageUrl = '';
		}
	}

	function stageIndex(key: string) {
		return STAGES.findIndex(s => s.key === key);
	}

	const activeStageData = $derived(stageProject ? stageProject[activeStageKey] : null);
</script>

<svelte:head><title>Upcoming Projects — SJCU Admin</title></svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
		<div>
			<h2 class="font-display text-2xl font-bold text-white">Upcoming Projects</h2>
			<p class="text-sjcu-text-muted text-sm">{projects.length} total projects</p>
		</div>
		<div class="flex items-center gap-2 flex-wrap">
			{#if orderChanged}
				<button onclick={saveOrder} disabled={savingOrder} class="btn-primary text-sm gap-2">
					<Save class="w-4 h-4" />
					{savingOrder ? 'Saving...' : 'Save Order'}
				</button>
			{/if}
			<button onclick={openCreate} class="btn-primary text-sm">
				<Plus class="w-4 h-4" /> Add Project
			</button>
		</div>
	</div>

	<!-- Drag hint -->
	{#if projects.length > 1 && !loading}
		<div class="flex items-center gap-2 text-sjcu-text-muted text-xs">
			<GripVertical class="w-3.5 h-3.5" />
			<span>Drag cards to reorder — click <strong class="text-sjcu-accent">Save Order</strong> to persist</span>
		</div>
	{/if}

	{#if loading}
		<LoadingSpinner size="lg" class="py-20" />
	{:else if projects.length === 0}
		<div class="text-center py-20 text-sjcu-text-muted">
			<Images class="w-12 h-12 mx-auto mb-3 opacity-30" />
			<p>No upcoming projects yet.</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
			{#each projects as project, i}
				<div
					draggable={true}
					ondragstart={(e) => onDragStart(e, i)}
					ondragover={(e) => onDragOver(e, i)}
					ondrop={(e) => onDrop(e, i)}
					ondragend={onDragEnd}
					class="admin-card group relative overflow-hidden transition-all duration-200 select-none cursor-grab active:cursor-grabbing
						{dragOverIndex === i && dragIndex !== i ? 'ring-2 ring-sjcu-purple scale-[1.02] shadow-purple-glow' : ''}
						{dragIndex === i ? 'opacity-40 scale-95' : ''}
					"
				>
					<!-- Drag handle -->
					<div class="absolute top-3 left-3 opacity-0 group-hover:opacity-40 transition-opacity z-10">
						<GripVertical class="w-4 h-4 text-sjcu-text-muted" />
					</div>

					<!-- Action buttons -->
					<div class="absolute top-3 right-3 flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10">
						<button
							onclick={() => openEdit(project)}
							class="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
							title="Edit project info"
						>
							<Edit2 class="w-3.5 h-3.5" />
						</button>
						<button
							onclick={() => openStageModal(project)}
							class="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
							title="Update stage"
						>
							<Mic class="w-3.5 h-3.5" />
						</button>
						<button
							onclick={() => handleDelete(project._id)}
							class="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
							title="Delete project"
						>
							<Trash2 class="w-3.5 h-3.5" />
						</button>
					</div>

					<!-- Feature image -->
					{#if project.featureImage}
						<div class="relative h-40 overflow-hidden rounded-t-xl mb-0 -mx-5 -mt-5">
							<img
								src={project.featureImage}
								alt={project.name}
								class="w-full h-full object-cover"
								loading="lazy"
							/>
							<div class="absolute inset-0" style="background: linear-gradient(to top, rgba(15,10,40,1) 0%, transparent 60%);"></div>
						</div>
					{:else}
						<div class="relative h-32 overflow-hidden rounded-t-xl mb-0 -mx-5 -mt-5 flex items-center justify-center" style="background: rgba(124,58,237,0.08);">
							<Images class="w-10 h-10 text-white/10" />
						</div>
					{/if}

					<div class="pt-3">
						<!-- Stage progress -->
						<div class="flex items-center gap-0.5 mb-3">
							{#each STAGES as stage, idx}
								<div
									class="h-1 flex-1 rounded-full transition-all"
									style="background: {idx <= stageIndex(project.currentStage) ? 'rgba(124,58,237,0.85)' : 'rgba(255,255,255,0.08)'};"
								></div>
							{/each}
						</div>

						<div class="flex items-start justify-between gap-2">
							<div class="flex-1 min-w-0">
								<h3 class="text-white font-semibold text-sm truncate">{project.name}</h3>
								{#if project.description}
									<p class="text-sjcu-text-muted text-xs mt-0.5 line-clamp-1">{project.description}</p>
								{/if}
							</div>
							<span
								class="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
								style="background: rgba(124,58,237,0.2); color: #c4b5fd; border: 1px solid rgba(124,58,237,0.35);"
							>
								{STAGES.find(s => s.key === project.currentStage)?.label ?? project.currentStage}
							</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Add / Edit Modal -->
<Modal open={modalOpen} title={editingId ? 'Edit Project' : 'Add Project'} onClose={() => (modalOpen = false)}>
	<form onsubmit={handleSave} class="space-y-4">
		<div>
			<label class="block text-sjcu-text-secondary text-sm mb-1.5">Project Name *</label>
			<input bind:value={form.name} class="admin-input" placeholder="e.g. New Album 2025" required />
		</div>
		<div>
			<label class="block text-sjcu-text-secondary text-sm mb-1.5">Description</label>
			<textarea bind:value={form.description} rows={3} class="admin-input resize-none" placeholder="Brief overview of the project..."></textarea>
		</div>
		<div>
			<label class="block text-sjcu-text-secondary text-sm mb-1.5">Feature Image</label>
			{#if featurePreview}
				<div class="relative w-32 h-20 rounded-xl overflow-hidden mb-2 border border-sjcu-border">
					<img src={featurePreview} alt="Preview" class="w-full h-full object-cover" />
				</div>
			{/if}
			<input type="file" accept="image/*" onchange={handleFeatureFileChange} class="text-sjcu-text-secondary text-sm" />
		</div>
		<div class="flex justify-end gap-3 pt-2">
			<button type="button" onclick={() => (modalOpen = false)} class="btn-outline text-sm px-5 py-2.5">Cancel</button>
			<button type="submit" class="btn-primary text-sm px-5 py-2.5" disabled={saving}>
				{saving ? 'Saving...' : editingId ? 'Update' : 'Create'} Project
			</button>
		</div>
	</form>
</Modal>

<!-- Stage Update Modal -->
<Modal open={stageModalOpen} title="Update Project Stage" onClose={() => (stageModalOpen = false)}>
	{#if stageProject}
		<div class="space-y-5">
			<!-- Stage tabs row -->
			<div class="flex flex-wrap gap-1.5">
				{#each STAGES as stage, idx}
					{@const isActive = activeStageKey === stage.key}
					{@const isCompleted = idx < stageIndex(stageProject.currentStage)}
					<button
						type="button"
						onclick={() => selectStage(stage.key)}
						class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150
							{isActive
								? 'border-sjcu-purple bg-sjcu-purple/20 text-sjcu-accent'
								: isCompleted
									? 'border-purple-800/50 bg-purple-900/20 text-purple-400 hover:border-sjcu-purple/50'
									: 'border-sjcu-border bg-transparent text-sjcu-text-muted hover:border-sjcu-purple/30 hover:text-white'
							}"
					>
						<stage.icon class="w-3 h-3" />
						{stage.label}
					</button>
				{/each}
			</div>

			<!-- Active stage note -->
			<p class="text-sjcu-text-muted text-xs">
				Saving will set <strong class="text-sjcu-accent">{STAGES.find(s => s.key === activeStageKey)?.label}</strong> as the current stage.
			</p>

			<!-- Description -->
			<div>
				<label class="block text-sjcu-text-secondary text-sm mb-1.5">Stage Description</label>
				<textarea
					bind:value={stageForm.description}
					rows={3}
					class="admin-input resize-none"
					placeholder="What's happening in this stage..."
				></textarea>
			</div>

			<!-- Add images -->
			<div>
				<label class="block text-sjcu-text-secondary text-sm mb-1.5">
					Add Images
					<span class="text-sjcu-text-muted text-xs ml-1">(select multiple at once)</span>
				</label>
				<label class="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed cursor-pointer transition-all duration-150 hover:border-sjcu-purple/60 hover:bg-sjcu-purple/5"
					style="border-color: rgba(124,58,237,0.3);">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-sjcu-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
					</svg>
					<span class="text-sjcu-text-secondary text-sm">
						{stageFiles.length > 0 ? `${stageFiles.length} image${stageFiles.length > 1 ? 's' : ''} selected — click to change` : 'Choose images…'}
					</span>
					<input type="file" accept="image/*" multiple onchange={handleStageFilesChange} class="hidden" />
				</label>

				<!-- Preview grid of selected files -->
				{#if stagePreviews.length > 0}
					<div class="grid grid-cols-4 gap-2 mt-3">
						{#each stagePreviews as preview, i}
							<div class="relative aspect-square rounded-lg overflow-hidden" style="border: 1px solid rgba(124,58,237,0.25);">
								<img src={preview} alt="Preview {i+1}" class="w-full h-full object-cover" />
								<div class="absolute bottom-0 left-0 right-0 text-center text-[9px] text-white/50 py-0.5"
									style="background: rgba(0,0,0,0.4);">{i+1}</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Existing stage images -->
			{#if activeStageData && activeStageData.images && activeStageData.images.length > 0}
				<div>
					<p class="text-sjcu-text-secondary text-sm mb-2">Uploaded Images</p>
					<div class="grid grid-cols-4 gap-2">
						{#each activeStageData.images as imgUrl}
							<div class="relative group/img rounded-lg overflow-hidden aspect-square">
								<img
									src={imgUrl}
									alt="Stage image"
									class="w-full h-full object-cover"
									loading="lazy"
								/>
								<button
									onclick={() => handleDeleteStageImage(imgUrl)}
									disabled={deletingImageUrl === imgUrl}
									class="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500/80 text-white opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-500"
									title="Delete image"
								>
									{#if deletingImageUrl === imgUrl}
										<span class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
									{:else}
										<X class="w-3 h-3" />
									{/if}
								</button>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Save button -->
			<div class="flex justify-end gap-3 pt-2">
				<button type="button" onclick={() => (stageModalOpen = false)} class="btn-outline text-sm px-5 py-2.5">Cancel</button>
				<button
					type="button"
					onclick={handleStageUpdate}
					class="btn-primary text-sm px-5 py-2.5"
					disabled={stageSaving}
				>
					{stageSaving ? 'Saving...' : 'Update Stage'}
				</button>
			</div>
		</div>
	{/if}
</Modal>
