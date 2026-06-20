<script lang="ts">
	import { toasts } from '$lib/stores/ui.js';
	import { CheckCircle, XCircle, Info, X } from 'lucide-svelte';

	const icons = {
		success: CheckCircle,
		error: XCircle,
		info: Info,
	};

	const colors = {
		success: 'border-green-500/50 bg-green-500/10 text-green-400',
		error: 'border-red-500/50 bg-red-500/10 text-red-400',
		info: 'border-sjcu-purple/50 bg-sjcu-purple/10 text-sjcu-accent',
	};
</script>

<div class="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
	{#each $toasts as toast (toast.id)}
		<div class="glass-card border flex items-start gap-3 p-4 pointer-events-auto animate-fade-up {colors[toast.type]}">
			<svelte:component this={icons[toast.type]} class="w-5 h-5 flex-shrink-0 mt-0.5" />
			<p class="text-sm flex-1">{toast.message}</p>
		</div>
	{/each}
</div>
