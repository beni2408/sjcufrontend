<script lang="ts">
	import { onMount } from 'svelte';
	import { Plus, Edit2, Trash2, Contact as ContactIcon, Search, Download, Mail, Phone } from 'lucide-svelte';
	import { contactsApi } from '$lib/services/api.js';
	import type { Contact } from '$lib/types/index.js';
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { showToast } from '$lib/stores/ui.js';

	let contacts = $state<Contact[]>([]);
	let loading = $state(true);
	let search = $state('');
	let modalOpen = $state(false);
	let editingId = $state<string | null>(null);
	let saving = $state(false);

	let form = $state({ fullName: '', email: '', phone: '' });

	const filtered = $derived(contacts.filter((c) => {
		if (!search) return true;
		const q = search.toLowerCase();
		return c.fullName.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q);
	}));

	async function load() {
		loading = true;
		try { const res = await contactsApi.getAll(); contacts = res.data.data.contacts || []; }
		catch { contacts = []; } finally { loading = false; }
	}
	onMount(load);

	function openCreate() {
		editingId = null; form = { fullName: '', email: '', phone: '' }; modalOpen = true;
	}
	function openEdit(c: Contact) {
		editingId = c._id; form = { fullName: c.fullName, email: c.email, phone: c.phone }; modalOpen = true;
	}
	async function handleSave(e: SubmitEvent) {
		e.preventDefault();
		if (!form.fullName.trim()) { showToast('Full name is required', 'error'); return; }
		saving = true;
		try {
			if (editingId) { await contactsApi.update(editingId, form); showToast('Contact updated!', 'success'); }
			else { await contactsApi.create(form); showToast('Contact added!', 'success'); }
			modalOpen = false; await load();
		} catch { showToast('Failed to save', 'error'); } finally { saving = false; }
	}
	async function handleDelete(id: string) {
		if (!confirm('Delete this contact?')) return;
		try { await contactsApi.delete(id); showToast('Deleted', 'success'); contacts = contacts.filter((c) => c._id !== id); }
		catch { showToast('Failed to delete', 'error'); }
	}

	function exportCSV() {
		const rows = [['Full Name', 'Email', 'Phone', 'Date Added'], ...filtered.map((c) => [c.fullName, c.email, c.phone, new Date(c.createdAt).toLocaleDateString()])];
		const csv = rows.map((r) => r.join(',')).join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a'); a.href = url; a.download = 'contacts.csv'; a.click();
	}
</script>

<svelte:head><title>Contacts — SJCU Admin</title></svelte:head>

<div class="space-y-6">
	<div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
		<div><h2 class="font-display text-2xl font-bold text-white">Contacts</h2><p class="text-sjcu-text-muted text-sm">{contacts.length} total contacts</p></div>
		<div class="flex gap-2 self-start sm:self-auto">
			<button onclick={exportCSV} class="btn-outline text-sm"><Download class="w-4 h-4" /> Export CSV</button>
			<button onclick={openCreate} class="btn-primary text-sm"><Plus class="w-4 h-4" /> Add Contact</button>
		</div>
	</div>

	<div class="relative">
		<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sjcu-text-muted pointer-events-none" />
		<input bind:value={search} placeholder="Search by name, email, or phone..." class="admin-input pl-9" />
	</div>

	{#if loading}
		<LoadingSpinner size="lg" class="py-20" />
	{:else if filtered.length === 0}
		<div class="text-center py-16 text-sjcu-text-muted"><ContactIcon class="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No contacts found.</p></div>
	{:else}
		<div class="admin-card overflow-hidden p-0">
			<div class="overflow-x-auto">
				<table class="w-full min-w-[600px]">
					<thead>
						<tr class="border-b border-sjcu-border">
							{#each ['Full Name', 'Email', 'Phone', 'Date Added', 'Actions'] as h}
								<th class="text-left text-sjcu-text-muted text-xs uppercase tracking-wide font-medium px-4 py-3.5 {h === 'Actions' ? 'text-right' : ''}">{h}</th>
							{/each}
						</tr>
					</thead>
					<tbody class="divide-y divide-sjcu-border">
						{#each filtered as c}
							<tr class="hover:bg-sjcu-navy-2/50 transition-colors group">
								<td class="px-4 py-3.5 text-white text-sm font-medium">{c.fullName}</td>
								<td class="px-4 py-3.5 text-sjcu-text-secondary text-sm">
									{#if c.email}<span class="flex items-center gap-1.5"><Mail class="w-3.5 h-3.5 text-sjcu-text-muted" />{c.email}</span>{:else}<span class="text-sjcu-text-muted">—</span>{/if}
								</td>
								<td class="px-4 py-3.5 text-sjcu-text-secondary text-sm">
									{#if c.phone}<span class="flex items-center gap-1.5"><Phone class="w-3.5 h-3.5 text-sjcu-text-muted" />{c.phone}</span>{:else}<span class="text-sjcu-text-muted">—</span>{/if}
								</td>
								<td class="px-4 py-3.5 text-sjcu-text-muted text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
								<td class="px-4 py-3.5">
									<div class="flex items-center justify-end gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
										<button onclick={() => openEdit(c)} class="p-1.5 rounded hover:bg-blue-500/20 text-sjcu-text-muted hover:text-blue-400"><Edit2 class="w-3.5 h-3.5" /></button>
										<button onclick={() => handleDelete(c._id)} class="p-1.5 rounded hover:bg-red-500/20 text-sjcu-text-muted hover:text-red-400"><Trash2 class="w-3.5 h-3.5" /></button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>

<Modal open={modalOpen} title={editingId ? 'Edit Contact' : 'Add Contact'} onClose={() => (modalOpen = false)}>
	<form onsubmit={handleSave} class="space-y-4">
		<div><label class="block text-sjcu-text-secondary text-sm mb-1.5">Full Name *</label><input bind:value={form.fullName} class="admin-input" required /></div>
		<div><label class="block text-sjcu-text-secondary text-sm mb-1.5">Email Address</label><input bind:value={form.email} type="email" class="admin-input" placeholder="optional" /></div>
		<div><label class="block text-sjcu-text-secondary text-sm mb-1.5">Phone Number</label><input bind:value={form.phone} type="tel" class="admin-input" placeholder="optional" /></div>
		<div class="flex justify-end gap-3 pt-2">
			<button type="button" onclick={() => (modalOpen = false)} class="btn-outline text-sm px-5 py-2.5">Cancel</button>
			<button type="submit" class="btn-primary text-sm px-5 py-2.5" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update' : 'Add'}</button>
		</div>
	</form>
</Modal>
