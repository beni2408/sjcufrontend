<script lang="ts">
	import { X } from 'lucide-svelte';

	let { open = false, title = '', onClose, children } = $props<{
		open: boolean;
		title: string;
		onClose: () => void;
		children?: any;
	}>();

	$effect(() => {
		if (open) {
			document.body.style.overflow = 'hidden';
			return () => { document.body.style.overflow = ''; };
		}
	});
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		onclick={onClose}
		onkeydown={(e) => e.key === 'Escape' && onClose()}
		role="dialog"
		aria-modal="true"
	>
		<div class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
		<div
			class="relative glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto"
			onclick={(e) => e.stopPropagation()}
			onkeydown={() => {}}
			role="presentation"
		>
			<div class="flex items-center justify-between p-6 border-b border-sjcu-border">
				<h2 class="text-lg font-semibold text-sjcu-text-primary">{title}</h2>
				<button
					onclick={onClose}
					class="p-2 rounded-lg hover:bg-sjcu-purple/20 text-sjcu-text-muted hover:text-white transition-colors"
					aria-label="Close"
				>
					<X class="w-5 h-5" />
				</button>
			</div>
			<div class="p-6">
				{@render children?.()}
			</div>
		</div>
	</div>
{/if}
