<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { CheckCircle2, ArrowLeft, CalendarDays, MapPin, Users2, Clock, UserCircle2, Upload } from 'lucide-svelte';
	import Navbar from '$lib/components/layout/Navbar.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
	import { auditionsApi } from '$lib/services/api.js';
	import { showToast } from '$lib/stores/ui.js';
	import type { Audition } from '$lib/types/index.js';
	import { z } from 'zod';

	const auditionId = $page.params.id as string;

	let audition = $state<Audition | null>(null);
	let loading = $state(true);
	let notFound = $state(false);

	let form = $state({ name: '', mobile: '', age: '', dob: '', fatherName: '', motherName: '', email: '' });
	let photoFile = $state<File | null>(null);
	let photoPreview = $state('');
	let termsAccepted = $state(false);
	let errors = $state<Record<string, string>>({});
	let submitting = $state(false);
	let submitted = $state(false);

	const schema = z.object({
		name: z.string().min(2, 'Name must be at least 2 characters'),
		mobile: z.string().min(10, 'Please enter a valid mobile number'),
		age: z.string().min(1, 'Age is required').regex(/^\d+$/, 'Please enter a valid age'),
		dob: z.string().min(1, 'Date of birth is required'),
		fatherName: z.string().min(2, "Father's name is required"),
		motherName: z.string().min(2, "Mother's name is required"),
		email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
	});

	onMount(() => {
		auditionsApi.getOne(auditionId)
			.then(res => { audition = res.data.data.audition; })
			.catch(() => { notFound = true; })
			.finally(() => { loading = false; });
	});

	function formatDate(d: string) {
		return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
	}

	function handlePhotoChange(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (file) { photoFile = file; photoPreview = URL.createObjectURL(file); }
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		errors = {};

		const result = schema.safeParse(form);
		if (!result.success) {
			result.error.errors.forEach((err) => { if (err.path[0]) errors[err.path[0] as string] = err.message; });
		}
		if (!photoFile) errors.photo = 'A passport size photo is required';
		if (!termsAccepted) errors.terms = 'You must accept the Terms & Conditions to apply';
		if (Object.keys(errors).length > 0) return;

		const ageNum = Number(form.age);
		if (audition && (ageNum < audition.minAge || ageNum > audition.maxAge)) {
			errors.age = `Age must be between ${audition.minAge} and ${audition.maxAge} for this audition`;
			return;
		}

		submitting = true;
		try {
			const fd = new FormData();
			Object.entries(form).forEach(([k, v]) => fd.append(k, v));
			fd.append('termsAccepted', 'true');
			if (photoFile) fd.append('photo', photoFile);

			await auditionsApi.apply(auditionId, fd);
			submitted = true;
		} catch (err: any) {
			showToast(err.response?.data?.message || 'Failed to submit application. Please try again.', 'error');
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>{audition ? `Apply — ${audition.title}` : 'Audition'} — St. John's Carol Union</title>
</svelte:head>

<div class="min-h-screen bg-sjcu-dark">
	<Navbar />

	<main class="pt-28 pb-20">
		<div class="max-w-5xl mx-auto px-6">
			<a href="/#auditions" class="inline-flex items-center gap-2 text-sjcu-text-muted hover:text-sjcu-accent transition-colors mb-10 text-sm">
				<ArrowLeft class="w-4 h-4" /> Back to Auditions
			</a>

			{#if loading}
				<LoadingSpinner size="lg" class="py-20" />
			{:else if notFound || !audition}
				<div class="text-center py-20 text-sjcu-text-muted">
					<p>This audition could not be found.</p>
				</div>
			{:else if submitted}
				<div class="max-w-xl mx-auto text-center py-20">
					<div class="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mx-auto mb-6">
						<CheckCircle2 class="w-10 h-10 text-green-400" />
					</div>
					<h1 class="font-display text-4xl font-bold text-sjcu-text-primary mb-4">Application Submitted!</h1>
					<p class="text-sjcu-text-secondary mb-8">
						Thank you for applying to {audition.title}. Our team has received your details and will reach out to you regarding next steps.
					</p>
					<a href="/" class="btn-primary">Return to Home</a>
				</div>
			{:else if !audition.isOpen}
				<div class="max-w-xl mx-auto text-center py-20">
					<h1 class="font-display text-3xl font-bold text-sjcu-text-primary mb-4">Applications Closed</h1>
					<p class="text-sjcu-text-secondary">Applications for {audition.title} are not currently open.</p>
				</div>
			{:else}
				<div class="grid lg:grid-cols-2 gap-12 items-start">
					<div>
						<span class="section-tag">{audition.auditionId}</span>
						<h1 class="font-display text-4xl md:text-5xl font-bold text-sjcu-text-primary mt-3 mb-5 leading-tight">
							{audition.title}
						</h1>
						{#if audition.description}
							<p class="text-sjcu-text-secondary leading-relaxed mb-8 whitespace-pre-line">{audition.description}</p>
						{/if}

						<div class="space-y-4">
							<div class="flex items-center gap-3">
								<div class="w-10 h-10 rounded-xl bg-sjcu-purple/20 border border-sjcu-purple/30 flex items-center justify-center flex-shrink-0">
									<CalendarDays class="w-5 h-5 text-sjcu-accent" />
								</div>
								<div><p class="text-sjcu-text-primary font-semibold text-sm">Audition Date</p><p class="text-sjcu-text-muted text-xs">{formatDate(audition.date)}</p></div>
							</div>
							<div class="flex items-center gap-3">
								<div class="w-10 h-10 rounded-xl bg-sjcu-purple/20 border border-sjcu-purple/30 flex items-center justify-center flex-shrink-0">
									<MapPin class="w-5 h-5 text-sjcu-accent" />
								</div>
								<div><p class="text-sjcu-text-primary font-semibold text-sm">Venue</p><p class="text-sjcu-text-muted text-xs">{audition.venue}</p></div>
							</div>
							<div class="flex items-center gap-3">
								<div class="w-10 h-10 rounded-xl bg-sjcu-purple/20 border border-sjcu-purple/30 flex items-center justify-center flex-shrink-0">
									<Users2 class="w-5 h-5 text-sjcu-accent" />
								</div>
								<div><p class="text-sjcu-text-primary font-semibold text-sm">Age Eligibility</p><p class="text-sjcu-text-muted text-xs">{audition.minAge}–{audition.maxAge} years</p></div>
							</div>
							<div class="flex items-center gap-3">
								<div class="w-10 h-10 rounded-xl bg-sjcu-purple/20 border border-sjcu-purple/30 flex items-center justify-center flex-shrink-0">
									<Clock class="w-5 h-5 text-sjcu-accent" />
								</div>
								<div><p class="text-sjcu-text-primary font-semibold text-sm">Apply Before</p><p class="text-sjcu-text-muted text-xs">{formatDate(audition.applicationEnd)}</p></div>
							</div>
						</div>
					</div>

					<div class="glass-card p-8">
						<h2 class="text-sjcu-text-primary font-semibold text-lg mb-6">Audition Application Form</h2>
						<form onsubmit={handleSubmit} class="space-y-5" novalidate>
							<div class="flex items-center gap-4">
								<div class="w-20 h-20 rounded-xl overflow-hidden border-2 border-sjcu-border flex items-center justify-center bg-sjcu-navy-2/50 flex-shrink-0">
									{#if photoPreview}
										<img src={photoPreview} alt="Preview" class="w-full h-full object-cover" />
									{:else}
										<UserCircle2 class="w-10 h-10 text-sjcu-text-muted" />
									{/if}
								</div>
								<div class="flex-1">
									<label class="block text-sjcu-text-secondary text-sm mb-1.5" for="photo">Passport Size Photo *</label>
									<label class="btn-outline text-xs cursor-pointer inline-flex items-center gap-2">
										<Upload class="w-3.5 h-3.5" /> Choose Photo
										<input id="photo" type="file" accept="image/*" onchange={handlePhotoChange} class="hidden" />
									</label>
									{#if errors.photo}<p class="text-red-400 text-xs mt-1">{errors.photo}</p>{/if}
								</div>
							</div>

							<div>
								<label class="block text-sjcu-text-secondary text-sm mb-1.5" for="name">Full Name *</label>
								<input id="name" type="text" placeholder="Your full name" bind:value={form.name} class="admin-input {errors.name ? 'border-red-500/50' : ''}" />
								{#if errors.name}<p class="text-red-400 text-xs mt-1">{errors.name}</p>{/if}
							</div>

							<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<label class="block text-sjcu-text-secondary text-sm mb-1.5" for="mobile">Mobile Number *</label>
									<input id="mobile" type="tel" placeholder="+91 98765 43210" bind:value={form.mobile} class="admin-input {errors.mobile ? 'border-red-500/50' : ''}" />
									{#if errors.mobile}<p class="text-red-400 text-xs mt-1">{errors.mobile}</p>{/if}
								</div>
								<div>
									<label class="block text-sjcu-text-secondary text-sm mb-1.5" for="age">Age *</label>
									<input id="age" type="text" inputmode="numeric" pattern="[0-9]*" placeholder="e.g. 21" bind:value={form.age} class="admin-input {errors.age ? 'border-red-500/50' : ''}" />
									{#if errors.age}<p class="text-red-400 text-xs mt-1">{errors.age}</p>{/if}
								</div>
							</div>

							<div>
								<label class="block text-sjcu-text-secondary text-sm mb-1.5" for="dob">Date of Birth *</label>
								<input id="dob" type="date" bind:value={form.dob} class="admin-input {errors.dob ? 'border-red-500/50' : ''}" />
								{#if errors.dob}<p class="text-red-400 text-xs mt-1">{errors.dob}</p>{/if}
							</div>

							<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<label class="block text-sjcu-text-secondary text-sm mb-1.5" for="fatherName">Father's Name *</label>
									<input id="fatherName" type="text" bind:value={form.fatherName} class="admin-input {errors.fatherName ? 'border-red-500/50' : ''}" />
									{#if errors.fatherName}<p class="text-red-400 text-xs mt-1">{errors.fatherName}</p>{/if}
								</div>
								<div>
									<label class="block text-sjcu-text-secondary text-sm mb-1.5" for="motherName">Mother's Name *</label>
									<input id="motherName" type="text" bind:value={form.motherName} class="admin-input {errors.motherName ? 'border-red-500/50' : ''}" />
									{#if errors.motherName}<p class="text-red-400 text-xs mt-1">{errors.motherName}</p>{/if}
								</div>
							</div>

							<div>
								<label class="block text-sjcu-text-secondary text-sm mb-1.5" for="email">Email Address (optional)</label>
								<input id="email" type="email" placeholder="you@email.com" bind:value={form.email} class="admin-input {errors.email ? 'border-red-500/50' : ''}" />
								{#if errors.email}<p class="text-red-400 text-xs mt-1">{errors.email}</p>{/if}
							</div>

							<div class="flex items-start gap-2.5 pt-1">
								<input id="terms" type="checkbox" bind:checked={termsAccepted} class="mt-0.5" />
								<label for="terms" class="text-sjcu-text-secondary text-xs leading-relaxed">
									I have read and agree to the
									<a href="/terms-and-conditions" target="_blank" rel="noopener" class="text-sjcu-accent underline hover:no-underline">Terms &amp; Conditions</a>
									of St. John's Carol Union.
								</label>
							</div>
							{#if errors.terms}<p class="text-red-400 text-xs">{errors.terms}</p>{/if}

							<button type="submit" class="btn-primary w-full justify-center py-4" disabled={submitting}>
								{#if submitting}
									<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
									Submitting...
								{:else}
									Submit Application
								{/if}
							</button>
						</form>
					</div>
				</div>
			{/if}
		</div>
	</main>

	<Footer />
</div>
