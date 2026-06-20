<script lang="ts">
	import { onMount } from 'svelte';
	import { Plus, Edit2, Trash2, Users, Search, UserCircle2, GripVertical, Save, Globe, ExternalLink } from 'lucide-svelte';
	import { membersApi } from '$lib/services/api.js';
	import type { Member } from '$lib/types/index.js';
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { showToast } from '$lib/stores/ui.js';

	let members = $state<Member[]>([]);
	let loading = $state(true);
	let search = $state('');
	let filterCat = $state('All');
	let modalOpen = $state(false);
	let editingId = $state<string | null>(null);
	let saving = $state(false);
	let savingOrder = $state(false);
	let orderChanged = $state(false);
	let photoFile = $state<File | null>(null);
	let photoPreview = $state('');

	// drag state
	let dragIndex = $state<number | null>(null);
	let dragOverIndex = $state<number | null>(null);

	const cats = ['All', 'Leadership', 'Choir Member', 'Media Team'];

	const CATS = ['Leadership', 'Choir Member', 'Media Team'] as const;
	let form = $state({
		name: '', position: '', gender: 'Male' as 'Male' | 'Female',
		teamCategories: ['Choir Member'] as string[],
		description: '', order: 0,
		socialLinks: { instagram: '', facebook: '', youtube: '', twitter: '' },
		slug: '',
		seo: { metaTitle: '', metaDescription: '', ogTitle: '', ogDescription: '', ogImage: '', primaryKeywords: '', secondaryKeywords: '' }
	});

	// SEO auto-fill previews
	const seoTitlePreview  = $derived(form.seo.metaTitle  || (form.name && form.position ? `${form.name} — ${form.position} | St. John's Carol Union` : ''));
	const seoDescPreview   = $derived(form.seo.metaDescription || (form.name && form.position ? `${form.name} serves as ${form.position} at St. John's Carol Union.${form.description ? ' ' + form.description : ''}` : ''));
	const ogTitlePreview   = $derived(form.seo.ogTitle   || seoTitlePreview);
	const ogImagePreview   = $derived(form.seo.ogImage   || photoPreview || '');
	const ogDescPreview    = $derived(form.seo.ogDescription || seoDescPreview);
	const primaryKwPreview = $derived(form.seo.primaryKeywords || (form.name && form.position ? `${form.name}, ${form.position}, St. John's Carol Union` : ''));
	const secondaryKwPreview = $derived(form.seo.secondaryKeywords || 'SJCU, Carol Union, Tamil Nadu choir, Christian music');
	const slugPreview      = $derived(form.slug || (form.name ? form.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') : ''));

	const filtered = $derived(
		search || filterCat !== 'All'
			? members.filter((m) => {
					const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.position.toLowerCase().includes(search.toLowerCase());
					const matchCat = filterCat === 'All' || (Array.isArray(m.teamCategory) ? m.teamCategory.includes(filterCat) : m.teamCategory === filterCat);
					return matchSearch && matchCat;
				})
			: members
	);

	// only show drag UI when not filtering
	const isDraggable = $derived(!search && filterCat === 'All');

	async function load() {
		loading = true;
		orderChanged = false;
		try { const res = await membersApi.getAll(); members = res.data.data.members || []; }
		catch { members = []; } finally { loading = false; }
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
		const updated = [...members];
		const [moved] = updated.splice(dragIndex, 1);
		updated.splice(toIndex, 0, moved);
		// reassign order values
		members = updated.map((m, i) => ({ ...m, order: i }));
		orderChanged = true;
		dragIndex = null;
		dragOverIndex = null;
	}

	function onDragEnd() { dragIndex = null; dragOverIndex = null; }

	async function saveOrder() {
		savingOrder = true;
		try {
			await membersApi.reorder(members.map((m, i) => ({ id: m._id, order: i })));
			showToast('Order saved!', 'success');
			orderChanged = false;
		} catch { showToast('Failed to save order', 'error'); }
		finally { savingOrder = false; }
	}

	// ── CRUD ─────────────────────────────────────────────────────────
	const emptyForm = () => ({
		name: '', position: '', gender: 'Male' as 'Male' | 'Female',
		teamCategories: ['Choir Member'] as string[],
		description: '', order: members.length,
		socialLinks: { instagram: '', facebook: '', youtube: '', twitter: '' },
		slug: '',
		seo: { metaTitle: '', metaDescription: '', ogTitle: '', ogDescription: '', ogImage: '', primaryKeywords: '', secondaryKeywords: '' }
	});

	function openCreate() {
		editingId = null;
		form = emptyForm();
		photoFile = null; photoPreview = ''; modalOpen = true;
	}
	function openEdit(m: Member) {
		editingId = m._id;
		const cats = Array.isArray(m.teamCategory) ? m.teamCategory : [m.teamCategory];
		form = {
			name: m.name, position: m.position, gender: m.gender || 'Male',
			teamCategories: cats, description: m.description || '', order: m.order,
			socialLinks: { instagram: m.socialLinks?.instagram || '', facebook: m.socialLinks?.facebook || '', youtube: m.socialLinks?.youtube || '', twitter: m.socialLinks?.twitter || '' },
			slug: m.slug || '',
			seo: {
				metaTitle:         m.seo?.metaTitle         || '',
				metaDescription:   m.seo?.metaDescription   || '',
				ogTitle:           m.seo?.ogTitle           || '',
				ogDescription:     m.seo?.ogDescription     || '',
				ogImage:           m.seo?.ogImage           || '',
				primaryKeywords:   (m.seo?.primaryKeywords   ?? []).join(', '),
				secondaryKeywords: (m.seo?.secondaryKeywords ?? []).join(', '),
			}
		};
		photoFile = null; photoPreview = m.photo; modalOpen = true;
	}

	function toggleCat(cat: string) {
		if (form.teamCategories.includes(cat)) {
			if (form.teamCategories.length > 1) form.teamCategories = form.teamCategories.filter(c => c !== cat);
		} else {
			form.teamCategories = [...form.teamCategories, cat];
		}
	}
	function handleFileChange(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (file) { photoFile = file; photoPreview = URL.createObjectURL(file); }
	}
	async function handleSave(e: SubmitEvent) {
		e.preventDefault();
		saving = true;
		try {
			const fd = new FormData();
			fd.append('name', form.name); fd.append('position', form.position);
			fd.append('gender', form.gender);
			fd.append('teamCategory', JSON.stringify(form.teamCategories));
			fd.append('description', form.description);
			fd.append('order', String(form.order));
			fd.append('socialLinks', JSON.stringify(form.socialLinks));
			fd.append('slug', form.slug.trim());
			// Use auto-generated fallback for any field left blank
			const savedOgImage = form.seo.ogImage.trim()
				|| (photoPreview.startsWith('https://') ? photoPreview : '');
			fd.append('seo', JSON.stringify({
				metaTitle:         seoTitlePreview,
				metaDescription:   seoDescPreview,
				ogTitle:           ogTitlePreview,
				ogDescription:     ogDescPreview,
				ogImage:           savedOgImage,
				primaryKeywords:   primaryKwPreview.split(',').map(k => k.trim()).filter(Boolean),
				secondaryKeywords: secondaryKwPreview.split(',').map(k => k.trim()).filter(Boolean),
			}));
			if (photoFile) fd.append('photo', photoFile);
			if (editingId) { await membersApi.update(editingId, fd); showToast('Member updated!', 'success'); }
			else { await membersApi.create(fd); showToast('Member added!', 'success'); }
			modalOpen = false; await load();
		} catch { showToast('Failed to save', 'error'); } finally { saving = false; }
	}
	async function handleDelete(id: string) {
		if (!confirm('Delete this member?')) return;
		try { await membersApi.delete(id); showToast('Member deleted', 'success'); members = members.filter((m) => m._id !== id); }
		catch { showToast('Failed to delete', 'error'); }
	}
</script>

<svelte:head><title>Members — SJCU Admin</title></svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
		<div>
			<h2 class="font-display text-2xl font-bold text-white">Choir Members</h2>
			<p class="text-sjcu-text-muted text-sm">{members.length} total members</p>
		</div>
		<div class="flex items-center gap-2 flex-wrap">
			{#if orderChanged && isDraggable}
				<button onclick={saveOrder} disabled={savingOrder} class="btn-primary text-sm gap-2">
					<Save class="w-4 h-4" />
					{savingOrder ? 'Saving...' : 'Save Order'}
				</button>
			{/if}
			<button onclick={openCreate} class="btn-primary text-sm"><Plus class="w-4 h-4" /> Add Member</button>
		</div>
	</div>

	<!-- Filters -->
	<div class="flex flex-col sm:flex-row gap-3">
		<div class="relative flex-1">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sjcu-text-muted pointer-events-none" />
			<input bind:value={search} placeholder="Search members..." class="admin-input pl-9" />
		</div>
		<select bind:value={filterCat} class="admin-select sm:w-44">
			{#each cats as c}<option value={c}>{c}</option>{/each}
		</select>
	</div>

	<!-- Drag hint -->
	{#if isDraggable && members.length > 0 && !loading}
		<div class="flex items-center gap-2 text-sjcu-text-muted text-xs">
			<GripVertical class="w-3.5 h-3.5" />
			<span>Drag cards to reorder — changes save when you click <strong class="text-sjcu-accent">Save Order</strong></span>
		</div>
	{/if}

	{#if loading}
		<LoadingSpinner size="lg" class="py-20" />
	{:else if filtered.length === 0}
		<div class="text-center py-16 text-sjcu-text-muted">
			<Users class="w-12 h-12 mx-auto mb-3 opacity-30" />
			<p>No members found.</p>
		</div>
	{:else}
		<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
			{#each filtered as m, i}
				<div
					draggable={isDraggable}
					ondragstart={(e) => onDragStart(e, i)}
					ondragover={(e) => onDragOver(e, i)}
					ondrop={(e) => onDrop(e, i)}
					ondragend={onDragEnd}
					class="admin-card flex flex-col items-center text-center p-4 group relative transition-all duration-200 select-none
						{isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}
						{dragOverIndex === i && dragIndex !== i ? 'ring-2 ring-sjcu-purple scale-105 shadow-purple-glow' : ''}
						{dragIndex === i ? 'opacity-40 scale-95' : ''}
					"
				>
					<!-- Drag handle -->
					{#if isDraggable}
						<div class="absolute top-2 left-2 opacity-0 group-hover:opacity-40 transition-opacity">
							<GripVertical class="w-4 h-4 text-sjcu-text-muted" />
						</div>
					{/if}

					<!-- Order badge -->
					<div class="absolute top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
						<span class="text-[10px] text-sjcu-text-muted bg-sjcu-border px-1.5 py-0.5 rounded-full">#{i + 1}</span>
					</div>

					<!-- Edit / Delete -->
					<div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
						<button onclick={() => openEdit(m)} class="p-1 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"><Edit2 class="w-3 h-3" /></button>
						<button onclick={() => handleDelete(m._id)} class="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"><Trash2 class="w-3 h-3" /></button>
					</div>

					<!-- Photo -->
					{#if m.photo}
						<img src={m.photo} alt={m.name} class="w-16 h-16 rounded-full object-cover border-2 border-sjcu-border mb-3 pointer-events-none" loading="lazy" />
					{:else}
						<div class="w-16 h-16 rounded-full bg-sjcu-purple/20 border-2 border-sjcu-border flex items-center justify-center mb-3">
							<UserCircle2 class="w-8 h-8 text-sjcu-text-muted" />
						</div>
					{/if}

					<p class="text-white text-sm font-semibold">{m.name}</p>
					<p class="text-sjcu-text-muted text-xs">{m.position}</p>
					{#if m.slug}
						<a href="/team/{m.slug}" target="_blank" class="mt-1 flex items-center gap-1 text-sjcu-accent text-[10px] hover:underline" onclick={(e) => e.stopPropagation()}>
							<ExternalLink class="w-2.5 h-2.5" /> /team/{m.slug}
						</a>
					{/if}
					<div class="mt-2 flex flex-wrap gap-1 justify-center">
						<span class="px-2 py-0.5 text-xs rounded-full {m.gender === 'Female' ? 'bg-pink-500/20 text-pink-300' : 'bg-blue-500/20 text-blue-300'}">{m.gender === 'Female' ? '♀ Women' : '♂ Men'}</span>
						{#each (Array.isArray(m.teamCategory) ? m.teamCategory : [m.teamCategory]) as cat}
							<span class="px-2 py-0.5 text-xs rounded-full bg-sjcu-purple/20 text-sjcu-accent">{cat}</span>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Add / Edit Modal -->
<Modal open={modalOpen} title={editingId ? 'Edit Member' : 'Add Member'} onClose={() => (modalOpen = false)}>
	<form onsubmit={handleSave} class="space-y-4">
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<div><label class="block text-sjcu-text-secondary text-sm mb-1.5">Full Name *</label><input bind:value={form.name} class="admin-input" required /></div>
			<div><label class="block text-sjcu-text-secondary text-sm mb-1.5">Position *</label><input bind:value={form.position} class="admin-input" placeholder="e.g. Lead Vocalist" required /></div>
		</div>
		<div>
			<label class="block text-sjcu-text-secondary text-sm mb-2">Section *</label>
			<div class="flex gap-3">
				{#each ['Male', 'Female'] as g}
					<button
						type="button"
						onclick={() => (form.gender = g as 'Male' | 'Female')}
						class="flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all duration-150 {form.gender === g ? 'bg-sjcu-purple/30 border-sjcu-purple text-sjcu-accent' : 'bg-transparent border-sjcu-border text-sjcu-text-muted hover:border-sjcu-purple/50'}"
					>{g === 'Male' ? '♂ Men' : '♀ Women'}</button>
				{/each}
			</div>
		</div>
		<div>
			<label class="block text-sjcu-text-secondary text-sm mb-2">Categories * <span class="text-sjcu-text-muted text-xs">(select all that apply)</span></label>
			<div class="flex gap-2 flex-wrap">
				{#each CATS as cat}
					<button
						type="button"
						onclick={() => toggleCat(cat)}
						class="px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150 {form.teamCategories.includes(cat) ? 'bg-sjcu-purple/30 border-sjcu-purple text-sjcu-accent' : 'bg-transparent border-sjcu-border text-sjcu-text-muted hover:border-sjcu-purple/50'}"
					>{cat}</button>
				{/each}
			</div>
		</div>
		<div><label class="block text-sjcu-text-secondary text-sm mb-1.5">Description</label><textarea bind:value={form.description} rows={2} class="admin-input resize-none"></textarea></div>
		<div>
			<p class="text-sjcu-text-secondary text-sm mb-2">Social Links</p>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
				<input bind:value={form.socialLinks.instagram} class="admin-input text-xs" placeholder="Instagram URL" />
				<input bind:value={form.socialLinks.facebook} class="admin-input text-xs" placeholder="Facebook URL" />
				<input bind:value={form.socialLinks.youtube} class="admin-input text-xs" placeholder="YouTube URL" />
				<input bind:value={form.socialLinks.twitter} class="admin-input text-xs" placeholder="Twitter URL" />
			</div>
		</div>
		<div>
			<label class="block text-sjcu-text-secondary text-sm mb-1.5">Photo</label>
			{#if photoPreview}<img src={photoPreview} alt="Preview" class="w-16 h-16 rounded-full object-cover mb-2" />{/if}
			<input type="file" accept="image/*" onchange={handleFileChange} class="text-sjcu-text-secondary text-sm" />
		</div>

		<!-- SEO Section -->
		<div class="border-t border-sjcu-border pt-4 space-y-3">
			<div class="flex items-center gap-2 mb-3">
				<Globe class="w-4 h-4 text-sjcu-accent" />
				<p class="text-white text-sm font-semibold">SEO & Profile Page</p>
				<span class="text-[10px] px-1.5 py-0.5 rounded font-bold tracking-widest uppercase" style="background:rgba(124,58,237,0.15);color:#a78bfa;border:1px solid rgba(124,58,237,0.3);">Google</span>
			</div>

			<!-- URL Slug -->
			<div>
				<label class="block text-sjcu-text-secondary text-sm mb-1">URL Slug</label>
				<div class="flex items-center gap-2">
					<span class="text-sjcu-text-muted text-xs whitespace-nowrap">/team/</span>
					<input bind:value={form.slug} class="admin-input flex-1 text-sm font-mono" placeholder="auto-generated from name" />
				</div>
				{#if slugPreview}<p class="text-sjcu-text-muted text-xs mt-1">Preview: <span class="text-sjcu-accent">/team/{slugPreview}</span></p>{/if}
			</div>

			<!-- Meta Title -->
			<div>
				<label class="block text-sjcu-text-secondary text-sm mb-1">Meta Title</label>
				<input bind:value={form.seo.metaTitle} class="admin-input text-sm" placeholder="Leave blank to auto-generate" />
				{#if !form.seo.metaTitle && seoTitlePreview}<p class="text-sjcu-text-muted text-xs mt-1">Auto: <em>{seoTitlePreview}</em></p>{/if}
			</div>

			<!-- Meta Description -->
			<div>
				<label class="block text-sjcu-text-secondary text-sm mb-1">Meta Description</label>
				<textarea bind:value={form.seo.metaDescription} rows={2} class="admin-input resize-none text-sm" placeholder="Leave blank to auto-generate from description"></textarea>
				{#if !form.seo.metaDescription && seoDescPreview}<p class="text-sjcu-text-muted text-xs mt-1">Auto: <em class="line-clamp-1">{seoDescPreview.substring(0,100)}…</em></p>{/if}
			</div>

			<div class="grid sm:grid-cols-2 gap-3">
				<div>
					<label class="block text-sjcu-text-secondary text-sm mb-1">OG Title <span class="text-sjcu-text-muted text-xs">(social share)</span></label>
					<input bind:value={form.seo.ogTitle} class="admin-input text-sm" placeholder="Leave blank to auto-generate" />
					{#if !form.seo.ogTitle && ogTitlePreview}<p class="text-sjcu-text-muted text-xs mt-1">Auto: <em class="line-clamp-1">{ogTitlePreview}</em></p>{/if}
				</div>
				<div>
					<label class="block text-sjcu-text-secondary text-sm mb-1">OG Image URL <span class="text-sjcu-text-muted text-xs">(uses photo if blank)</span></label>
					<input bind:value={form.seo.ogImage} class="admin-input text-sm" placeholder="Leave blank to use profile photo" />
					{#if !form.seo.ogImage && ogImagePreview}<p class="text-sjcu-text-muted text-xs mt-1">Auto: <em class="line-clamp-1 font-mono">{ogImagePreview}</em></p>{/if}
				</div>
			</div>

			<div>
				<label class="block text-sjcu-text-secondary text-sm mb-1">OG Description</label>
				<input bind:value={form.seo.ogDescription} class="admin-input text-sm" placeholder="Leave blank to auto-generate" />
				{#if !form.seo.ogDescription && ogDescPreview}<p class="text-sjcu-text-muted text-xs mt-1">Auto: <em class="line-clamp-1">{ogDescPreview.substring(0,100)}…</em></p>{/if}
			</div>

			<div class="grid sm:grid-cols-2 gap-3">
				<div>
					<label class="block text-sjcu-text-secondary text-sm mb-1">Primary Keywords</label>
					<input bind:value={form.seo.primaryKeywords} class="admin-input text-sm" placeholder="Leave blank to auto-generate" />
					{#if !form.seo.primaryKeywords && primaryKwPreview}<p class="text-sjcu-text-muted text-xs mt-1">Auto: <em>{primaryKwPreview}</em></p>
					{:else}<p class="text-sjcu-text-muted text-xs mt-1">Comma-separated</p>{/if}
				</div>
				<div>
					<label class="block text-sjcu-text-secondary text-sm mb-1">Secondary Keywords</label>
					<input bind:value={form.seo.secondaryKeywords} class="admin-input text-sm" placeholder="Leave blank to auto-generate" />
					{#if !form.seo.secondaryKeywords && secondaryKwPreview}<p class="text-sjcu-text-muted text-xs mt-1">Auto: <em>{secondaryKwPreview}</em></p>
					{:else}<p class="text-sjcu-text-muted text-xs mt-1">Comma-separated</p>{/if}
				</div>
			</div>
		</div>

		<div class="flex justify-end gap-3 pt-2">
			<button type="button" onclick={() => (modalOpen = false)} class="btn-outline text-sm px-5 py-2.5">Cancel</button>
			<button type="submit" class="btn-primary text-sm px-5 py-2.5" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update' : 'Add'} Member</button>
		</div>
	</form>
</Modal>
