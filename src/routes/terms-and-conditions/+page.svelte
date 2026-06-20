<script lang="ts">
	import { onMount } from 'svelte';
	import { ArrowLeft, ShieldAlert, Mail } from 'lucide-svelte';
	import Navbar from '$lib/components/layout/Navbar.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';

	onMount(() => window.scrollTo(0, 0));

	const sections = [
		{
			title: '1. Confidentiality of Unreleased Productions',
			body: `Members and applicants may be given access to information, recordings, footage, or plans relating to upcoming productions and projects before they are officially released or announced. Such information is strictly confidential. You must not share, discuss, post, or disclose any details about an unreleased project — in any form, on any platform — until St. John's Carol Union has made an official public announcement or release. Breach of this confidentiality may result in immediate removal from the team and, where applicable, further action.`,
		},
		{
			title: '2. Commitment to Practice & Recording Sessions',
			body: `Recording sessions are preceded by multiple practice sessions, which are a mandatory part of preparation. By applying and being accepted, you commit to making yourself reasonably available to attend these practice sessions as scheduled. You are also responsible for keeping yourself updated with any schedule changes, announcements, or instructions shared by the choir organizers through official channels.`,
		},
		{
			title: '3. Future Programs & Updates',
			body: `St. John's Carol Union may, in the future, introduce new programs or initiatives for its members — including the possibility of a monthly subscription model. By accepting these terms, you acknowledge that such changes may be introduced from time to time, and that continued participation in the choir is subject to acceptance of those future updates as and when they are announced.`,
		},
		{
			title: '4. Standards of Conduct & Right to Removal',
			body: `St. John's Carol Union maintains high standards of discipline, commitment, and harmony within the team. Neglect of practice sessions, repeated unavailability without valid reason, or any conduct that disrupts the harmony, discipline, or reputation of the choir will not be tolerated. The leadership reserves the full right, at its sole discretion, to remove any member or applicant from the team for such reasons, without prior notice.`,
		},
		{
			title: '5. Feedback During Recording Sessions',
			body: `During recording sessions, choir organizers and individual section heads may point out faults, errors, or areas needing correction in real time, in the interest of production quality. By participating, you agree to accept such feedback professionally and constructively, and to take note of and correct the faults addressed at that time.`,
		},
		{
			title: '6. Reporting Discomfort or Grievances',
			body: `St. John's Carol Union is committed to maintaining a respectful and safe environment for all members. If you experience any discomfort, concern, or issue relating to your interactions within the team or during any choir activity, you are encouraged to report it. You may email your concern to johnscarol2018@gmail.com, or you may directly contact a member of the leadership team. All such concerns will be treated with discretion.`,
		},
		{
			title: '7. Acceptance',
			body: `By checking "I have read and agree to the Terms & Conditions" and submitting your audition application, you confirm that you have read, understood, and agree to be bound by all the terms set out above, for the duration of your association with St. John's Carol Union.`,
		},
	];
</script>

<svelte:head>
	<title>Terms & Conditions — St. John's Carol Union</title>
</svelte:head>

<div class="min-h-screen bg-sjcu-dark">
	<Navbar />

	<main class="pt-28 pb-20">
		<div class="max-w-3xl mx-auto px-6">
			<button type="button" onclick={() => history.back()} class="inline-flex items-center gap-2 text-sjcu-text-muted hover:text-sjcu-accent transition-colors mb-10 text-sm">
				<ArrowLeft class="w-4 h-4" /> Back
			</button>

			<span class="section-tag">Please Read Carefully</span>
			<h1 class="font-display text-4xl md:text-5xl font-bold text-sjcu-text-primary mt-3 mb-4 leading-tight">
				Terms &amp; <span class="purple-gradient-text">Conditions</span>
			</h1>
			<p class="text-sjcu-text-secondary leading-relaxed mb-12">
				These terms apply to every individual who applies for or participates in an audition, recording session, or any choir activity organized by St. John's Carol Union. Please read them in full before submitting your application.
			</p>

			<div class="space-y-8">
				{#each sections as s}
					<div class="glass-card p-6">
						<h2 class="text-sjcu-text-primary font-semibold text-lg mb-2.5">{s.title}</h2>
						<p class="text-sjcu-text-secondary text-sm leading-relaxed">{s.body}</p>
					</div>
				{/each}
			</div>

			<div class="mt-10 p-6 rounded-2xl flex items-start gap-4" style="background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25);">
				<ShieldAlert class="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
				<p class="text-sjcu-text-secondary text-sm leading-relaxed">
					Acceptance of these terms is mandatory to submit an audition application. Non-compliance with any of the above, at any point during your association with the choir, may result in removal from the team at the sole discretion of the leadership.
				</p>
			</div>

			<div class="mt-6 p-6 rounded-2xl flex items-start gap-4 glass-card">
				<Mail class="w-6 h-6 text-sjcu-accent flex-shrink-0 mt-0.5" />
				<div>
					<p class="text-sjcu-text-primary font-semibold text-sm mb-1">Questions or Concerns?</p>
					<p class="text-sjcu-text-secondary text-sm leading-relaxed">
						Reach out to us at <a href="mailto:johnscarol2018@gmail.com" class="text-sjcu-accent underline hover:no-underline">johnscarol2018@gmail.com</a> or contact a member of the leadership team directly.
					</p>
				</div>
			</div>
		</div>
	</main>

	<Footer />
</div>
