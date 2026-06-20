<script lang="ts">
	let x = $state(-500);
	let y = $state(-500);

	function onMove(e: MouseEvent) {
		x = e.clientX;
		y = e.clientY;
	}
</script>

<svelte:window onmousemove={onMove} />

<!-- Only render on devices that have a fine pointer (mouse) -->
<div
	class="cursor-spotlight"
	aria-hidden="true"
	style="transform: translate(calc({x}px - 50%), calc({y}px - 50%))"
></div>

<style>
	.cursor-spotlight {
		position: fixed;
		top: 0; left: 0;
		width: 500px;
		height: 500px;
		border-radius: 50%;
		pointer-events: none;
		z-index: 1;
		background: radial-gradient(
			circle,
			rgba(124, 58, 237, 0.07) 0%,
			rgba(124, 58, 237, 0.03) 35%,
			transparent 65%
		);
		transition: transform 0.15s ease-out;
		will-change: transform;
	}

	/* Slightly stronger in dark mode */
	:global([data-theme="light"]) .cursor-spotlight {
		background: radial-gradient(
			circle,
			rgba(109, 40, 217, 0.05) 0%,
			rgba(109, 40, 217, 0.02) 35%,
			transparent 65%
		);
	}

	/* Disable on touch/coarse pointer devices */
	@media (pointer: coarse) {
		.cursor-spotlight { display: none; }
	}
</style>
