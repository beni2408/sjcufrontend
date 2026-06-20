<script lang="ts">
	import { onMount } from 'svelte';
	import { Inbox, Trash2, Eye, Search, Download } from 'lucide-svelte';
	import { enquiriesApi } from '$lib/services/api.js';
	import type { Enquiry } from '$lib/types/index.js';
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { showToast } from '$lib/stores/ui.js';

	let enquiries = $state<Enquiry[]>([]);
	let loading = $state(true);
	let filterStatus = $state('All');
	let search = $state('');
	let viewEnquiry = $state<Enquiry | null>(null);

	const statuses = ['All', 'Pending', 'Contacted', 'Completed'];

	const filtered = $derived(enquiries.filter((e) => {
		const matchStatus = filterStatus === 'All' || e.status === filterStatus;
		const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase());
		return matchStatus && matchSearch;
	}));

	async function load() {
		loading = true;
		try { const res = await enquiriesApi.getAll(); enquiries = res.data.data.enquiries || []; }
		catch { enquiries = []; } finally { loading = false; }
	}
	onMount(load);

	async function updateStatus(id: string, status: string) {
		try {
			await enquiriesApi.update(id, { status });
			enquiries = enquiries.map((e) => e._id === id ? { ...e, status: status as Enquiry['status'] } : e);
			showToast(`Status updated to ${status}`, 'success');
		} catch { showToast('Failed to update', 'error'); }
	}

	async function handleDelete(id: string) {
		if (!confirm('Delete this enquiry?')) return;
		try { await enquiriesApi.delete(id); showToast('Deleted', 'success'); enquiries = enquiries.filter((e) => e._id !== id); }
		catch { showToast('Failed to delete', 'error'); }
	}

	function exportCSV() {
		const rows = [['Name', 'Email', 'Phone', 'Status', 'Date'], ...filtered.map((e) => [e.name, e.email, e.phone, e.status, new Date(e.createdAt).toLocaleDateString()])];
		const csv = rows.map((r) => r.join(',')).join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a'); a.href = url; a.download = 'enquiries.csv'; a.click();
	}

	const statusClass: Record<string, string> = { Pending: 'badge-pending', Contacted: 'badge-contacted', Completed: 'badge-completed' };
</script>

<svelte:head><title>Enquiries — SJCU Admin</title></svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div><h2 class="font-display text-2xl font-bold text-white">Contact Enquiries</h2><p class="text-sjcu-text-muted text-sm">{enquiries.length} total enquiries</p></div>
		<button onclick={exportCSV} class="btn-outline text-sm"><Download class="w-4 h-4" /> Export CSV</button>
	</div>

	<div class="flex flex-col sm:flex-row gap-3">
		<div class="relative flex-1"><Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sjcu-text-muted pointer-events-none" /><input bind:value={search} placeholder="Search by name or email..." class="admin-input pl-9" /></div>
		<select bind:value={filterStatus} class="admin-select sm:w-40">{#each statuses as s}<option value={s}>{s}</option>{/each}</select>
	</div>

	{#if loading}
		<LoadingSpinner size="lg" class="py-20" />
	{:else if filtered.length === 0}
		<div class="text-center py-16 text-sjcu-text-muted"><Inbox class="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No enquiries found.</p></div>
	{:else}
		<div class="admin-card overflow-hidden p-0">
			<div class="overflow-x-auto">
				<table class="w-full min-w-[500px]">
					<thead>
						<tr class="border-b border-sjcu-border">
							{#each ['Name', 'Phone', 'Status', 'Date', 'Actions'] as h}
								<th class="text-left text-sjcu-text-muted text-xs uppercase tracking-wide font-medium px-4 py-3.5 {h === 'Actions' ? 'text-right' : ''}">{h}</th>
							{/each}
						</tr>
					</thead>
					<tbody class="divide-y divide-sjcu-border">
						{#each filtered as enq}
							<tr class="hover:bg-sjcu-navy-2/50 transition-colors group">
								<td class="px-4 py-3.5">
									<p class="text-white text-sm font-medium">{enq.name}</p>
									<p class="text-sjcu-text-muted text-xs">{enq.email}</p>
								</td>
								<td class="px-4 py-3.5 text-sjcu-text-secondary text-sm">{enq.phone}</td>
								<td class="px-4 py-3.5">
									<select
										value={enq.status}
										onchange={(e) => updateStatus(enq._id, (e.target as HTMLSelectElement).value)}
										class="text-xs rounded-full px-2 py-1 border-0 outline-none cursor-pointer {statusClass[enq.status]} bg-transparent"
									>
										{#each ['Pending', 'Contacted', 'Completed'] as s}<option value={s}>{s}</option>{/each}
									</select>
								</td>
								<td class="px-4 py-3.5 text-sjcu-text-muted text-xs">{new Date(enq.createdAt).toLocaleDateString()}</td>
								<td class="px-4 py-3.5">
									<div class="flex items-center justify-end gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
										<button onclick={() => (viewEnquiry = enq)} class="p-1.5 rounded hover:bg-sjcu-purple/20 text-sjcu-text-muted hover:text-sjcu-accent"><Eye class="w-3.5 h-3.5" /></button>
										<button onclick={() => handleDelete(enq._id)} class="p-1.5 rounded hover:bg-red-500/20 text-sjcu-text-muted hover:text-red-400"><Trash2 class="w-3.5 h-3.5" /></button>
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

<Modal open={!!viewEnquiry} title="Enquiry Details" onClose={() => (viewEnquiry = null)}>
	{#if viewEnquiry}
		<div class="space-y-4">
			{#each [['Name', viewEnquiry.name], ['Email', viewEnquiry.email], ['Phone', viewEnquiry.phone], ['Status', viewEnquiry.status], ['Submitted', new Date(viewEnquiry.createdAt).toLocaleString()]] as [label, value]}
				<div class="flex flex-col sm:flex-row sm:items-center gap-1">
					<span class="text-sjcu-text-muted text-sm w-28 flex-shrink-0">{label}</span>
					<span class="text-white text-sm">{value}</span>
				</div>
			{/each}
			<div class="border-t border-sjcu-border pt-4">
				<p class="text-sjcu-text-muted text-sm mb-2">Message</p>
				<p class="text-sjcu-text-secondary text-sm leading-relaxed">{viewEnquiry.message}</p>
			</div>
		</div>
	{/if}
</Modal>
