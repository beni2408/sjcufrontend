<script lang="ts">
	import { CheckCircle2, ArrowLeft, Mail, Phone, MapPin, MessageCircle } from 'lucide-svelte';
	import Navbar from '$lib/components/layout/Navbar.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import { enquiriesApi } from '$lib/services/api.js';
	import { showToast } from '$lib/stores/ui.js';
	import { z } from 'zod';

	const schema = z.object({
		name: z.string().min(2, 'Name must be at least 2 characters'),
		email: z.string().email('Please enter a valid email address'),
		phone: z.string().min(10, 'Please enter a valid phone number'),
		message: z.string().min(10, 'Please enter a message (minimum 10 characters)'),
	});

	let form = $state({ name: '', email: '', phone: '', message: '' });
	let errors = $state<Record<string, string>>({});
	let loading = $state(false);
	let submitted = $state(false);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		errors = {};

		const result = schema.safeParse(form);
		if (!result.success) {
			result.error.errors.forEach((err) => {
				if (err.path[0]) errors[err.path[0] as string] = err.message;
			});
			return;
		}

		loading = true;
		try {
			await enquiriesApi.create(form);
			submitted = true;
		} catch (err: any) {
			showToast(err.response?.data?.message || 'Failed to send message. Please try again.', 'error');
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Contact Us — St. John's Carol Union</title>
</svelte:head>

<div class="min-h-screen bg-sjcu-dark">
	<Navbar />

	<main class="pt-28 pb-20">
		<div class="max-w-5xl mx-auto px-6">
			<a href="/" class="inline-flex items-center gap-2 text-sjcu-text-muted hover:text-sjcu-accent transition-colors mb-10 text-sm">
				<ArrowLeft class="w-4 h-4" /> Back to Home
			</a>

			{#if submitted}
				<div class="max-w-xl mx-auto text-center py-20">
					<div class="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mx-auto mb-6">
						<CheckCircle2 class="w-10 h-10 text-green-400" />
					</div>
					<h1 class="font-display text-4xl font-bold text-sjcu-text-primary mb-4">Message Sent!</h1>
					<p class="text-sjcu-text-secondary mb-8">
						Thank you for reaching out to St. John's Carol Union. We've received your message and will get back to you shortly.
					</p>
					<a href="/" class="btn-primary">Return to Home</a>
				</div>
			{:else}
				<div class="grid lg:grid-cols-2 gap-12 items-start">
					<!-- Left side info -->
					<div>
						<span class="section-tag">Get in Touch</span>
						<h1 class="font-display text-4xl md:text-5xl font-bold text-sjcu-text-primary mt-3 mb-5 leading-tight">
							Let's Start a<br /><span class="purple-gradient-text">Conversation</span>
						</h1>
						<p class="text-sjcu-text-secondary leading-relaxed mb-10">
							Have a question about our choir, want to share feedback, or just want to say hello? Fill in the form and our team will get back to you shortly.
						</p>

						<div class="space-y-5">
							{#each [
								{ icon: Mail, title: 'General Enquiries', desc: 'Ask us anything — we reply within 24–48 hours' },
								{ icon: MessageCircle, title: 'Feedback & Suggestions', desc: 'Help us improve and grow as a team' },
								{ icon: Phone, title: 'Reach Us Directly', desc: 'Call or WhatsApp us during choir hours' },
								{ icon: MapPin, title: 'Find Us', desc: 'Madathuvilai, Arumuganeri, Tamil Nadu' },
							] as item}
								<div class="flex items-start gap-4">
									<div class="w-10 h-10 rounded-xl bg-sjcu-purple/20 border border-sjcu-purple/30 flex items-center justify-center flex-shrink-0">
										<item.icon class="w-5 h-5 text-sjcu-accent" />
									</div>
									<div>
										<h3 class="text-sjcu-text-primary font-semibold text-sm">{item.title}</h3>
										<p class="text-sjcu-text-muted text-xs mt-0.5">{item.desc}</p>
									</div>
								</div>
							{/each}
						</div>

						<div class="mt-10 flex items-center gap-4 p-5 glass-card">
							<img src="/logo.png" alt="SJCU" class="w-14 h-14 object-contain rounded-full border border-white/20" />
							<div>
								<p class="text-sjcu-text-primary font-semibold text-sm">St. John's Carol Union</p>
								<p class="text-sjcu-text-muted text-xs">Madathuvilai, Arumuganeri, Tamil Nadu · Est. 1985</p>
							</div>
						</div>
					</div>

					<!-- Right side form -->
					<div class="glass-card p-8">
						<h2 class="text-sjcu-text-primary font-semibold text-lg mb-6">Send Us a Message</h2>
						<form onsubmit={handleSubmit} class="space-y-5" novalidate>
							<div>
								<label class="block text-sjcu-text-secondary text-sm mb-1.5" for="name">Full Name *</label>
								<input
									id="name"
									type="text"
									placeholder="Your full name"
									bind:value={form.name}
									class="admin-input {errors.name ? 'border-red-500/50' : ''}"
								/>
								{#if errors.name}<p class="text-red-400 text-xs mt-1">{errors.name}</p>{/if}
							</div>

							<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<label class="block text-sjcu-text-secondary text-sm mb-1.5" for="email">Email Address *</label>
									<input
										id="email"
										type="email"
										placeholder="you@example.com"
										bind:value={form.email}
										class="admin-input {errors.email ? 'border-red-500/50' : ''}"
									/>
									{#if errors.email}<p class="text-red-400 text-xs mt-1">{errors.email}</p>{/if}
								</div>
								<div>
									<label class="block text-sjcu-text-secondary text-sm mb-1.5" for="phone">Phone Number *</label>
									<input
										id="phone"
										type="tel"
										placeholder="+91 00000 00000"
										bind:value={form.phone}
										class="admin-input {errors.phone ? 'border-red-500/50' : ''}"
									/>
									{#if errors.phone}<p class="text-red-400 text-xs mt-1">{errors.phone}</p>{/if}
								</div>
							</div>

							<div>
								<label class="block text-sjcu-text-secondary text-sm mb-1.5" for="message">Message *</label>
								<textarea
									id="message"
									rows={5}
									placeholder="How can we help you?"
									bind:value={form.message}
									class="admin-input resize-none {errors.message ? 'border-red-500/50' : ''}"
								></textarea>
								{#if errors.message}<p class="text-red-400 text-xs mt-1">{errors.message}</p>{/if}
							</div>

							<button type="submit" class="btn-primary w-full justify-center py-4" disabled={loading}>
								{#if loading}
									<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
									Sending...
								{:else}
									Send Message
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
