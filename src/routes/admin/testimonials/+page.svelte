<script lang="ts">
	import { onMount } from 'svelte';
	import { Plus, Edit2, Trash2, MessageSquare, Star, UserCircle2, Check, Clock } from 'lucide-svelte';
	import { testimonialsApi } from '$lib/services/api.js';
	import type { Testimonial } from '$lib/types/index.js';
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { showToast } from '$lib/stores/ui.js';

	let activeTab = $state<'pending' | 'published'>('pending');
	let pending = $state<Testimonial[]>([]);
	let published = $state<Testimonial[]>([]);
	let pendingCount = $state(0);
	let loading = $state(true);
	let modalOpen = $state(false);
	let editingId = $state<string | null>(null);
	let editingStatus = $state<'pending' | 'approved'>('pending');
	let saving = $state(false);
	let approving = $state(false);
	let photoFile = $state<File | null>(null);
	let photoPreview = $state('');

	let form = $state({ name: '', email: '', designation: '', message: '', rating: 5, featured: false });

	async function loadAll() {
		loading = true;
		try {
			const [pendingRes, publishedRes, countRes] = await Promise.all([
				testimonialsApi.getAdmin({ status: 'pending' }),
				testimonialsApi.getAdmin({ status: 'approved' }),
				testimonialsApi.getPendingCount(),
			]);
			pending = pendingRes.data.data.testimonials || [];
			published = publishedRes.data.data.testimonials || [];
			pendingCount = countRes.data.data.count ?? 0;
		} catch {
			pending = [];
			published = [];
			pendingCount = 0;
		} finally {
			loading = false;
		}
	}

	onMount(loadAll);

	function openCreate() {
		editingId = null;
		editingStatus = 'approved';
		form = { name: '', email: '', designation: '', message: '', rating: 5, featured: false };
		photoFile = null;
		photoPreview = '';
		modalOpen = true;
	}

	function openEdit(t: Testimonial) {
		editingId = t._id;
		editingStatus = t.status;
		form = { name: t.name, email: t.email || '', designation: t.designation, message: t.message, rating: t.rating, featured: t.featured };
		photoFile = null;
		photoPreview = t.photo;
		modalOpen = true;
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
			Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
			if (photoFile) fd.append('photo', photoFile);
			if (editingId) {
				await testimonialsApi.update(editingId, fd);
				showToast('Testimonial updated!', 'success');
			} else {
				await testimonialsApi.create(fd);
				showToast('Testimonial added!', 'success');
			}
			modalOpen = false;
			await loadAll();
		} catch {
			showToast('Failed to save', 'error');
		} finally {
			saving = false;
		}
	}

	async function approve(id: string) {
		approving = true;
		try {
			await testimonialsApi.approve(id);
			showToast('Published!', 'success');
			modalOpen = false;
			await loadAll();
		} catch {
			showToast('Failed to publish', 'error');
		} finally {
			approving = false;
		}
	}

	async function handleDelete(id: string) {
		if (!confirm('Delete this testimonial?')) return;
		try {
			await testimonialsApi.delete(id);
			showToast('Deleted', 'success');
			await loadAll();
		} catch {
			showToast('Failed to delete', 'error');
		}
	}

	function timeAgo(iso: string): string {
		const diff = Date.now() - new Date(iso).getTime();
		const m = Math.floor(diff / 60000);
		if (m < 1) return 'just now';
		if (m < 60) return `${m}m ago`;
		const h = Math.floor(m / 60);
		if (h < 24) return `${h}h ago`;
		return `${Math.floor(h / 24)}d ago`;
	}

	function getInitials(name: string): string {
		return name.split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase();
	}
</script>

<svelte:head><title>Testimonials — SJCU Admin</title></svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
		<div>
			<h2 class="font-display text-2xl font-bold text-white">Testimonials</h2>
			<p class="text-sjcu-text-muted text-sm">{pending.length + published.length} total &mdash; {pendingCount} pending review</p>
		</div>
		<button onclick={openCreate} class="btn-primary text-sm self-start sm:self-auto">
			<Plus class="w-4 h-4" /> Add Testimonial
		</button>
	</div>

	<!-- Tab pills -->
	<div class="flex gap-2">
		<button
			onclick={() => (activeTab = 'pending')}
			class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all {activeTab === 'pending' ? 'bg-sjcu-purple text-white' : 'bg-sjcu-dark border border-sjcu-border text-sjcu-text-muted hover:text-sjcu-text-primary'}"
		>
			<Clock class="w-4 h-4" />
			Pending Review
			{#if pendingCount > 0}
				<span class="ml-1 min-w-[20px] h-5 px-1.5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
					{pendingCount}
				</span>
			{/if}
		</button>
		<button
			onclick={() => (activeTab = 'published')}
			class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all {activeTab === 'published' ? 'bg-sjcu-purple text-white' : 'bg-sjcu-dark border border-sjcu-border text-sjcu-text-muted hover:text-sjcu-text-primary'}"
		>
			<Check class="w-4 h-4" />
			Published
			<span class="ml-1 text-xs opacity-70">({published.length})</span>
		</button>
	</div>

	{#if loading}
		<LoadingSpinner size="lg" class="py-20" />

	{:else if activeTab === 'pending'}
		<!-- Pending tab -->
		{#if pending.length === 0}
			<div class="text-center py-16 text-sjcu-text-muted">
				<MessageSquare class="w-12 h-12 mx-auto mb-3 opacity-30" />
				<p>No pending reviews. All caught up!</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each pending as t}
					<div class="admin-card flex flex-col gap-3">
						<!-- Avatar + name -->
						<div class="flex items-center gap-3">
							{#if t.photo}
								<img src={t.photo} alt={t.name} class="w-10 h-10 rounded-full object-cover border border-sjcu-border flex-shrink-0" />
							{:else}
								<div class="w-10 h-10 rounded-full bg-sjcu-purple/20 border border-sjcu-border flex items-center justify-center flex-shrink-0 text-sjcu-accent font-bold text-sm">
									{getInitials(t.name)}
								</div>
							{/if}
							<div class="min-w-0">
								<p class="text-white text-sm font-semibold truncate">{t.name}</p>
								{#if t.designation}
									<p class="text-sjcu-text-muted text-xs truncate">{t.designation}</p>
								{/if}
							</div>
						</div>

						<!-- Stars -->
						<div class="flex items-center gap-0.5">
							{#each Array(5) as _, i}
								<Star class="w-3.5 h-3.5 {i < t.rating ? 'text-amber-400 fill-amber-400' : 'text-sjcu-border'}" />
							{/each}
						</div>

						<!-- Message preview -->
						<p class="text-sjcu-text-secondary text-sm leading-relaxed line-clamp-3 flex-1">"{t.message}"</p>

						<!-- Submitted time -->
						<p class="text-sjcu-text-muted text-xs flex items-center gap-1">
							<Clock class="w-3 h-3" /> {timeAgo(t.createdAt)}
						</p>

						<!-- Actions -->
						<div class="flex gap-2 pt-1 border-t border-sjcu-border">
							<button onclick={() => openEdit(t)} class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-colors text-xs font-medium">
								<Edit2 class="w-3.5 h-3.5" /> Edit &amp; Review
							</button>
							<button onclick={() => handleDelete(t._id)} class="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors text-xs font-medium">
								<Trash2 class="w-3.5 h-3.5" />
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}

	{:else}
		<!-- Published tab -->
		{#if published.length === 0}
			<div class="text-center py-16 text-sjcu-text-muted">
				<MessageSquare class="w-12 h-12 mx-auto mb-3 opacity-30" />
				<p>No published testimonials yet.</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each published as t}
					<div class="admin-card group relative flex flex-col gap-3">
						<!-- Avatar + name -->
						<div class="flex items-center gap-3">
							{#if t.photo}
								<img src={t.photo} alt={t.name} class="w-10 h-10 rounded-full object-cover border border-sjcu-border flex-shrink-0" />
							{:else}
								<div class="w-10 h-10 rounded-full bg-sjcu-purple/20 border border-sjcu-border flex items-center justify-center flex-shrink-0 text-sjcu-accent font-bold text-sm">
									{getInitials(t.name)}
								</div>
							{/if}
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									<p class="text-white text-sm font-semibold truncate">{t.name}</p>
									{#if t.featured}
										<span class="text-[10px] px-1.5 py-0.5 bg-sjcu-purple/20 text-sjcu-accent rounded flex-shrink-0">Featured</span>
									{/if}
								</div>
								{#if t.designation}
									<p class="text-sjcu-text-muted text-xs truncate">{t.designation}</p>
								{/if}
							</div>
						</div>

						<!-- Stars -->
						<div class="flex items-center gap-0.5">
							{#each Array(5) as _, i}
								<Star class="w-3.5 h-3.5 {i < t.rating ? 'text-amber-400 fill-amber-400' : 'text-sjcu-border'}" />
							{/each}
						</div>

						<!-- Message -->
						<p class="text-sjcu-text-secondary text-sm leading-relaxed line-clamp-3 flex-1">"{t.message}"</p>

						<!-- Actions -->
						<div class="flex gap-2 pt-1 border-t border-sjcu-border">
							<button onclick={() => openEdit(t)} class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-colors text-xs font-medium">
								<Edit2 class="w-3.5 h-3.5" /> Edit
							</button>
							<button onclick={() => handleDelete(t._id)} class="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors text-xs font-medium">
								<Trash2 class="w-3.5 h-3.5" />
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<Modal open={modalOpen} title={editingId ? 'Edit Testimonial' : 'Add Testimonial'} onClose={() => (modalOpen = false)}>
	<form onsubmit={handleSave} class="space-y-4">
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label class="block text-sjcu-text-secondary text-sm mb-1.5">Name *</label>
				<input bind:value={form.name} class="admin-input" required />
			</div>
			<div>
				<label class="block text-sjcu-text-secondary text-sm mb-1.5">Designation</label>
				<input bind:value={form.designation} class="admin-input" placeholder="e.g. Choir Director" />
			</div>
		</div>
		<div>
			<label class="block text-sjcu-text-secondary text-sm mb-1.5">Email</label>
			<input bind:value={form.email} type="email" class="admin-input" placeholder="reviewer@example.com" />
		</div>
		<div>
			<label class="block text-sjcu-text-secondary text-sm mb-1.5">Message *</label>
			<textarea bind:value={form.message} rows={4} class="admin-input resize-none" required></textarea>
		</div>
		<div>
			<label class="block text-sjcu-text-secondary text-sm mb-1.5">Rating (1–5)</label>
			<input bind:value={form.rating} type="number" min={1} max={5} class="admin-input" />
		</div>
		<div>
			<label class="block text-sjcu-text-secondary text-sm mb-1.5">Photo</label>
			{#if photoPreview}
				<img src={photoPreview} alt="Preview" class="w-12 h-12 rounded-full object-cover mb-2" />
			{/if}
			<input type="file" accept="image/*" onchange={handleFileChange} class="text-sjcu-text-secondary text-sm" />
		</div>
		<div class="flex items-center gap-2">
			<input type="checkbox" id="tfeatured" bind:checked={form.featured} />
			<label for="tfeatured" class="text-sjcu-text-secondary text-sm">Mark as featured</label>
		</div>

		<div class="flex justify-end gap-3 pt-2">
			<button type="button" onclick={() => (modalOpen = false)} class="btn-outline text-sm px-5 py-2.5">Cancel</button>
			<button type="submit" class="btn-primary text-sm px-5 py-2.5" disabled={saving}>
				{saving ? 'Saving…' : editingId ? 'Update' : 'Add'}
			</button>
		</div>

		{#if editingId && editingStatus === 'pending'}
			<div class="border-t border-sjcu-border pt-4 mt-2">
				<p class="text-sjcu-text-muted text-xs mb-3">This review is awaiting approval. Review the content above, then publish it to make it visible on the public site.</p>
				<button
					type="button"
					onclick={() => editingId && approve(editingId)}
					disabled={approving}
					class="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 hover:bg-emerald-600/30 transition-colors text-sm font-semibold disabled:opacity-50"
				>
					<Check class="w-4 h-4" />
					{approving ? 'Publishing…' : '✓ Confirm & Publish'}
				</button>
			</div>
		{/if}
	</form>
</Modal>
