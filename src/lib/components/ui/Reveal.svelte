<script lang="ts">
	import { onMount } from 'svelte';

	let {
		children,
		delay   = 0,
		y       = 28,
		blur    = true,
		once    = true,
		class:  cls = '',
		threshold = 0.12,
	}: {
		children:   import('svelte').Snippet;
		delay?:     number;  // seconds
		y?:         number;  // initial translateY px
		blur?:      boolean; // blur-to-sharp entrance
		once?:      boolean; // unobserve after first reveal
		class?:     string;
		threshold?: number;
	} = $props();

	let el: HTMLElement;
	let visible = $state(false);

	onMount(() => {
		const obs = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					visible = true;
					if (once) obs.disconnect();
				} else if (!once) {
					visible = false;
				}
			},
			{ threshold }
		);
		obs.observe(el);
		return () => obs.disconnect();
	});
</script>

<div
	bind:this={el}
	class="reveal-host {cls}"
	class:is-visible={visible}
	style="
		--delay: {delay}s;
		--init-y: {y}px;
		--blur: {blur ? '6px' : '0px'};
	"
>
	{@render children()}
</div>

<style>
	.reveal-host {
		opacity: 0;
		transform: translateY(var(--init-y, 28px));
		filter: blur(var(--blur, 6px));
		transition:
			opacity   0.65s ease         var(--delay, 0s),
			transform 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) var(--delay, 0s),
			filter    0.65s ease         var(--delay, 0s);
		will-change: opacity, transform, filter;
	}
	.reveal-host.is-visible {
		opacity:   1;
		transform: translateY(0);
		filter:    blur(0px);
	}
</style>
