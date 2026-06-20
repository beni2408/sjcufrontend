<script lang="ts">
	type Size = 'sm' | 'md' | 'lg';
	let { size = 'md' as Size, class: className = '' } = $props<{ size?: Size; class?: string }>();

	const sizes: Record<Size, string> = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
	const sizeClass = $derived(sizes[size as Size] ?? sizes.md);
</script>

<div class="flex items-center justify-center {className}">
	<div class="relative {sizeClass}">
		<div class="absolute inset-0 rounded-full border-2 border-sjcu-border"></div>
		<div class="absolute inset-0 rounded-full border-2 border-transparent border-t-sjcu-purple animate-spin"></div>
	</div>
</div>
