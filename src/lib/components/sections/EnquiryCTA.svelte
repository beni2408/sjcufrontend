<script lang="ts">
	import { ArrowRight, Mail, MessageCircle, HelpCircle, Users } from 'lucide-svelte';
	import Reveal from '$lib/components/ui/Reveal.svelte';
	import FloatingNotes from '$lib/components/ui/FloatingNotes.svelte';
</script>

<section id="enquiry-cta" class="py-24 md:py-32 bg-sjcu-dark relative overflow-hidden">
	<FloatingNotes opacity={0.25} size="lg" speed="fast" />
	<div class="absolute inset-0 pointer-events-none">
		<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-sjcu-purple/10 rounded-full blur-[100px]"></div>
	</div>

	<div class="max-w-5xl mx-auto px-6 relative z-10">
		<div class="glass-card p-10 md:p-16 text-center">
			<div class="w-20 h-20 mx-auto mb-8 rounded-full border-2 border-sjcu-purple/40 overflow-hidden">
				<img src="/logo.png" alt="SJCU" class="w-full h-full object-contain" />
			</div>

			<Reveal>
				<span class="section-tag justify-center mb-4">Stay Connected</span>
				<h2 class="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-sjcu-text-primary mb-6 leading-tight">
					Have Something to Say?<br /><span class="purple-gradient-text">We're Listening.</span>
				</h2>
				<p class="text-sjcu-text-secondary text-lg max-w-xl mx-auto mb-10">
					Whether you have a question, a suggestion, or just want to connect with our team — we'd love to hear from you. Reach out and we'll get back to you as soon as possible.
				</p>
			</Reveal>

			<div class="flex flex-wrap items-center justify-center gap-4 mb-12">
				{#each [
					{ icon: HelpCircle, label: 'Questions & Queries' },
					{ icon: MessageCircle, label: 'Feedback & Suggestions' },
					{ icon: Users, label: 'Collaborations' },
					{ icon: Mail, label: 'General Enquiries' },
				] as item}
					<div class="flex items-center gap-2 px-4 py-2 rounded-full border border-sjcu-border bg-sjcu-card text-sjcu-text-secondary text-sm">
						<item.icon class="w-4 h-4 text-sjcu-accent" />
						{item.label}
					</div>
				{/each}
			</div>

			<div class="flex flex-col sm:flex-row items-center justify-center gap-4">
				<a href="/production-enquiry" class="btn-primary text-base px-8 py-4">
					Contact Us
					<ArrowRight class="w-5 h-5" />
				</a>
				<a href="#about" onclick={(e) => { e.preventDefault(); document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }); }} class="btn-outline text-base px-8 py-4">
					Learn More About Us
				</a>
			</div>
		</div>
	</div>
</section>
