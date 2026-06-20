<script lang="ts">
	import { onMount } from 'svelte';

	let { opacity = 0.15, size = 'md', speed = 'normal' } = $props<{
		opacity?: number;
		size?: 'sm' | 'md' | 'lg';
		speed?: 'slow' | 'normal' | 'fast';
	}>();

	let containerRef: HTMLDivElement = null!;

	const symbols = ['♩','♪','♫','♬','♭','♮','♯','𝄞'];

	const sizeRange  = { sm: [12, 24], md: [16, 36], lg: [20, 48] };
	const durRange   = { slow: [10000, 18000], normal: [6000, 12000], fast: [4000, 8000] };
	const spawnDelay = { slow: 1400, normal: 900, fast: 500 };

	function getNoteColor(alpha: number): string {
		const isLight = document.documentElement.getAttribute('data-theme') === 'light';
		const r = isLight ? 109 : 167;
		const g = isLight ? 40 : 139;
		const b = isLight ? 217 : 250;
		return `rgba(${r},${g},${b},${alpha})`;
	}

	onMount(() => {
		const [minSize, maxSize] = sizeRange[size];
		const [minDur, maxDur]   = durRange[speed];

		function spawnNote() {
			if (!containerRef) return;
			const el = document.createElement('span');
			el.textContent = symbols[Math.floor(Math.random() * symbols.length)];

			const fontSize  = minSize + Math.random() * (maxSize - minSize);
			const startX    = Math.random() * 100;
			const drift     = (Math.random() - 0.5) * 160;
			const dur       = minDur + Math.random() * (maxDur - minDur);
			const startRot  = (Math.random() - 0.5) * 50;
			const endRot    = startRot + (Math.random() - 0.5) * 100;
			const alpha     = opacity * (0.5 + Math.random() * 0.5);

			Object.assign(el.style, {
				position:      'absolute',
				left:          `${startX}%`,
				bottom:        '-50px',
				fontSize:      `${fontSize}px`,
				color:         getNoteColor(alpha),
				pointerEvents: 'none',
				userSelect:    'none',
				willChange:    'transform, opacity',
			});

			containerRef.appendChild(el);

			const anim = el.animate([
				{ transform: `translateX(0px) translateY(0px) rotate(${startRot}deg)`, opacity: 0 },
				{ transform: `translateX(${drift * 0.3}px) translateY(-25vh) rotate(${startRot + (endRot - startRot) * 0.3}deg)`, opacity: alpha, offset: 0.12 },
				{ transform: `translateX(${drift}px) translateY(-110vh) rotate(${endRot}deg)`, opacity: 0 },
			], { duration: dur, easing: 'ease-in-out', fill: 'forwards' });

			anim.onfinish = () => el.remove();
		}

		// Seed a few immediately
		for (let i = 0; i < 5; i++) setTimeout(spawnNote, Math.random() * 3000);
		const interval = setInterval(spawnNote, spawnDelay[speed]);

		return () => clearInterval(interval);
	});
</script>

<div bind:this={containerRef} class="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true" style="z-index: 1;"></div>
