<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { ArrowLeft, Inbox, Trash2, Eye, Search, Download, UserCircle2 } from 'lucide-svelte';
	import { auditionsApi, auditionApplicationsApi } from '$lib/services/api.js';
	import type { Audition, AuditionApplication } from '$lib/types/index.js';
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { showToast } from '$lib/stores/ui.js';

	const auditionId = $page.params.id as string;

	let audition = $state<Audition | null>(null);
	let applications = $state<AuditionApplication[]>([]);
	let loading = $state(true);
	let filterStatus = $state('All');
	let search = $state('');
	let viewApp = $state<AuditionApplication | null>(null);

	const statuses = ['All', 'Pending', 'Shortlisted', 'Rejected', 'Selected'];
	const statusClass: Record<string, string> = {
		Pending: 'badge-pending', Shortlisted: 'badge-contacted', Rejected: 'bg-red-500/20 text-red-400', Selected: 'badge-completed',
	};

	const filtered = $derived(applications.filter((a) => {
		const matchStatus = filterStatus === 'All' || a.status === filterStatus;
		const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.mobile.includes(search);
		return matchStatus && matchSearch;
	}));

	async function load() {
		loading = true;
		try {
			const [auditionRes, appsRes] = await Promise.all([
				auditionsApi.getOne(auditionId),
				auditionsApi.getApplications(auditionId),
			]);
			audition = auditionRes.data.data.audition;
			applications = appsRes.data.data.applications || [];
		} catch { applications = []; } finally { loading = false; }
	}
	onMount(load);

	async function updateStatus(id: string, status: string) {
		try {
			await auditionApplicationsApi.updateStatus(id, status);
			applications = applications.map((a) => a._id === id ? { ...a, status: status as AuditionApplication['status'] } : a);
			showToast(`Status updated to ${status}`, 'success');
		} catch { showToast('Failed to update', 'error'); }
	}

	async function handleDelete(id: string) {
		if (!confirm('Delete this application?')) return;
		try { await auditionApplicationsApi.delete(id); showToast('Deleted', 'success'); applications = applications.filter((a) => a._id !== id); }
		catch { showToast('Failed to delete', 'error'); }
	}

	function exportCSV() {
		const rows = [
			['Application ID', 'Name', 'Mobile', 'Age', 'DOB', "Father's Name", "Mother's Name", 'Email', 'Status', 'Submitted'],
			...filtered.map((a) => [a.applicationId, a.name, a.mobile, String(a.age), new Date(a.dob).toLocaleDateString(), a.fatherName, a.motherName, a.email, a.status, new Date(a.createdAt).toLocaleDateString()]),
		];
		const csv = rows.map((r) => r.join(',')).join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a'); a.href = url; a.download = 'audition-applications.csv'; a.click();
	}
</script>

<svelte:head><title>Applications — SJCU Admin</title></svelte:head>

<div class="space-y-6">
	<a href="/admin/auditions" class="inline-flex items-center gap-2 text-sjcu-text-muted hover:text-sjcu-accent transition-colors text-sm">
		<ArrowLeft class="w-4 h-4" /> Back to Auditions
	</a>

	<div class="flex items-center justify-between">
		<div>
			<h2 class="font-display text-2xl font-bold text-white">{audition ? audition.title : 'Applications'}</h2>
			<p class="text-sjcu-text-muted text-sm">{audition?.auditionId} &middot; {applications.length} applications</p>
		</div>
		<button onclick={exportCSV} class="btn-outline text-sm"><Download class="w-4 h-4" /> Export CSV</button>
	</div>

	<div class="flex flex-col sm:flex-row gap-3">
		<div class="relative flex-1"><Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sjcu-text-muted pointer-events-none" /><input bind:value={search} placeholder="Search by name or mobile..." class="admin-input pl-9" /></div>
		<select bind:value={filterStatus} class="admin-select sm:w-40">{#each statuses as s}<option value={s}>{s}</option>{/each}</select>
	</div>

	{#if loading}
		<LoadingSpinner size="lg" class="py-20" />
	{:else if filtered.length === 0}
		<div class="text-center py-16 text-sjcu-text-muted"><Inbox class="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No applications found.</p></div>
	{:else}
		<div class="admin-card overflow-hidden p-0">
			<div class="overflow-x-auto">
				<table class="w-full min-w-[700px]">
					<thead>
						<tr class="border-b border-sjcu-border">
							{#each ['Applicant', 'Mobile', 'Age', 'Status', 'Submitted', 'Actions'] as h}
								<th class="text-left text-sjcu-text-muted text-xs uppercase tracking-wide font-medium px-4 py-3.5 {h === 'Actions' ? 'text-right' : ''}">{h}</th>
							{/each}
						</tr>
					</thead>
					<tbody class="divide-y divide-sjcu-border">
						{#each filtered as app}
							<tr class="hover:bg-sjcu-navy-2/50 transition-colors group">
								<td class="px-4 py-3.5">
									<div class="flex items-center gap-3">
										{#if app.photo}
											<img src={app.photo} alt={app.name} class="w-9 h-9 rounded-full object-cover border border-sjcu-border" />
										{:else}
											<UserCircle2 class="w-9 h-9 text-sjcu-text-muted" />
										{/if}
										<div>
											<p class="text-white text-sm font-medium">{app.name}</p>
											<p class="text-sjcu-text-muted text-xs">{app.applicationId}</p>
										</div>
									</div>
								</td>
								<td class="px-4 py-3.5 text-sjcu-text-secondary text-sm">{app.mobile}</td>
								<td class="px-4 py-3.5 text-sjcu-text-muted text-xs">{app.age}</td>
								<td class="px-4 py-3.5">
									<select
										value={app.status}
										onchange={(e) => updateStatus(app._id, (e.target as HTMLSelectElement).value)}
										class="text-xs rounded-full px-2 py-1 border-0 outline-none cursor-pointer {statusClass[app.status]} bg-transparent"
									>
										{#each ['Pending', 'Shortlisted', 'Rejected', 'Selected'] as s}<option value={s}>{s}</option>{/each}
									</select>
								</td>
								<td class="px-4 py-3.5 text-sjcu-text-muted text-xs">{new Date(app.createdAt).toLocaleDateString()}</td>
								<td class="px-4 py-3.5">
									<div class="flex items-center justify-end gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
										<button onclick={() => (viewApp = app)} class="p-1.5 rounded hover:bg-sjcu-purple/20 text-sjcu-text-muted hover:text-sjcu-accent"><Eye class="w-3.5 h-3.5" /></button>
										<button onclick={() => handleDelete(app._id)} class="p-1.5 rounded hover:bg-red-500/20 text-sjcu-text-muted hover:text-red-400"><Trash2 class="w-3.5 h-3.5" /></button>
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

<Modal open={!!viewApp} title="Application Details" onClose={() => (viewApp = null)}>
	{#if viewApp}
		<div class="space-y-4">
			<div class="flex justify-center">
				{#if viewApp.photo}
					<img src={viewApp.photo} alt={viewApp.name} class="w-28 h-28 rounded-xl object-cover border-2 border-sjcu-border" />
				{:else}
					<UserCircle2 class="w-28 h-28 text-sjcu-text-muted" />
				{/if}
			</div>
			{#each [
				['Application ID', viewApp.applicationId],
				['Full Name', viewApp.name],
				['Mobile Number', viewApp.mobile],
				['Age', String(viewApp.age)],
				['Date of Birth', new Date(viewApp.dob).toLocaleDateString()],
				["Father's Name", viewApp.fatherName],
				["Mother's Name", viewApp.motherName],
				['Email', viewApp.email || '—'],
				['Status', viewApp.status],
				['Submitted', new Date(viewApp.createdAt).toLocaleString()],
			] as [label, value]}
				<div class="flex flex-col sm:flex-row sm:items-center gap-1">
					<span class="text-sjcu-text-muted text-sm w-32 flex-shrink-0">{label}</span>
					<span class="text-white text-sm">{value}</span>
				</div>
			{/each}
		</div>
	{/if}
</Modal>
