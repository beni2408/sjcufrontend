<script lang="ts">
	import { onMount } from 'svelte';
	import { Play, ChevronDown } from 'lucide-svelte';
	import { gsap } from 'gsap';
	import { magnetic } from '$lib/actions/magnetic.js';

	let heroRef: HTMLElement;
	let canvasRef: HTMLCanvasElement;
	let spotlightRef: HTMLDivElement;
	let notesRef: HTMLDivElement = null!;
	let animationId: number;

	function getParticleColor(alpha: number): string {
		const isLight = document.documentElement.getAttribute('data-theme') === 'light';
		return isLight
			? `rgba(109, 40, 217, ${alpha * 0.65})`
			: `rgba(139, 92, 246, ${alpha})`;
	}

	function getSpotlightGradient(): string {
		const isLight = document.documentElement.getAttribute('data-theme') === 'light';
		return isLight
			? 'radial-gradient(circle, rgba(109,40,217,0.2) 0%, rgba(76,29,149,0.1) 35%, transparent 70%)'
			: 'radial-gradient(circle, rgba(167,139,250,0.3) 0%, rgba(124,58,237,0.15) 35%, transparent 70%)';
	}

	onMount(() => {
		// ── Particle canvas ──────────────────────────────────────────
		const ctx = canvasRef?.getContext('2d');
		if (!ctx) return;

		const particles: Array<{ x: number; y: number; vx: number; vy: number; r: number; a: number }> = [];
		const count = 80;

		const resize = () => {
			canvasRef.width = window.innerWidth;
			canvasRef.height = window.innerHeight;
		};
		resize();
		window.addEventListener('resize', resize);

		for (let i = 0; i < count; i++) {
			particles.push({
				x: Math.random() * window.innerWidth,
				y: Math.random() * window.innerHeight,
				vx: (Math.random() - 0.5) * 0.4,
				vy: (Math.random() - 0.5) * 0.4,
				r: Math.random() * 2 + 0.5,
				a: Math.random() * 0.5 + 0.1,
			});
		}

		const draw = () => {
			ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);
			for (const p of particles) {
				p.x += p.vx;
				p.y += p.vy;
				if (p.x < 0) p.x = canvasRef.width;
				if (p.x > canvasRef.width) p.x = 0;
				if (p.y < 0) p.y = canvasRef.height;
				if (p.y > canvasRef.height) p.y = 0;
				ctx.beginPath();
				ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
				ctx.fillStyle = getParticleColor(p.a);
				ctx.fill();
			}
			animationId = requestAnimationFrame(draw);
		};
		draw();

		// ── Mouse spotlight — direct DOM, no Svelte reactivity ───────
		let mouseX = 0;
		let mouseY = 0;
		let currentX = 0;
		let currentY = 0;
		let visible = false;

		// Set initial gradient based on theme
		spotlightRef.style.background = getSpotlightGradient();

		const onMove = (e: MouseEvent) => {
			const rect = heroRef.getBoundingClientRect();
			mouseX = e.clientX - rect.left;
			mouseY = e.clientY - rect.top;
			if (!visible) {
				visible = true;
				spotlightRef.style.opacity = '1';
			}
		};

		const onLeave = () => {
			visible = false;
			spotlightRef.style.opacity = '0';
		};

		const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

		const animateSpotlight = () => {
			currentX = lerp(currentX, mouseX, 0.1);
			currentY = lerp(currentY, mouseY, 0.1);
			spotlightRef.style.transform = `translate(${currentX}px, ${currentY}px) translate(-50%, -50%)`;
			requestAnimationFrame(animateSpotlight);
		};
		animateSpotlight();

		heroRef.addEventListener('mousemove', onMove);
		heroRef.addEventListener('mouseleave', onLeave);

		// Update spotlight gradient when theme changes
		const observer = new MutationObserver(() => {
			spotlightRef.style.background = getSpotlightGradient();
		});
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

		// ── Floating musical notes ────────────────────────────────────
		const symbols = ['♩','♪','♫','♬','♭','♮','♯','𝄞'];

		function getNoteColor(opacity: number): string {
			const isLight = document.documentElement.getAttribute('data-theme') === 'light';
			const r = isLight ? 109 : 167;
			const g = isLight ? 40 : 139;
			const b = isLight ? 217 : 250;
			return `rgba(${r},${g},${b},${opacity})`;
		}

		function spawnNote() {
			if (!notesRef) return;
			const el = document.createElement('span');
			el.textContent = symbols[Math.floor(Math.random() * symbols.length)];

			const size   = 20 + Math.random() * 44;
			const startX = Math.random() * 100;
			const drift  = (Math.random() - 0.5) * 200;
			const dur    = 5000 + Math.random() * 7000;
			const delay  = Math.random() * 2000;
			const startRot = (Math.random() - 0.5) * 60;
			const endRot   = startRot + (Math.random() - 0.5) * 120;
			const opacity  = 0.35 + Math.random() * 0.45;

			Object.assign(el.style, {
				position:   'absolute',
				left:       `${startX}%`,
				bottom:     '-60px',
				fontSize:   `${size}px`,
				color:      getNoteColor(opacity),
				pointerEvents: 'none',
				userSelect: 'none',
				willChange: 'transform, opacity',
			});

			notesRef.appendChild(el);

			const anim = el.animate([
				{ transform: `translateX(0px) translateY(0px) rotate(${startRot}deg)`, opacity: 0 },
				{ transform: `translateX(${drift * 0.3}px) translateY(-30vh) rotate(${startRot + (endRot - startRot) * 0.3}deg)`, opacity: opacity, offset: 0.15 },
				{ transform: `translateX(${drift}px) translateY(-105vh) rotate(${endRot}deg)`, opacity: 0 },
			], { duration: dur, delay, easing: 'ease-in-out', fill: 'forwards' });

			anim.onfinish = () => el.remove();
		}

		// Seed initial burst
		for (let i = 0; i < 12; i++) setTimeout(spawnNote, Math.random() * 3000);
		// Keep spawning continuously
		const noteInterval = setInterval(() => { if (notesRef) spawnNote(); }, 600);

		// ── GSAP entrance animations ──────────────────────────────────
		gsap.fromTo('.hero-tag',      { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, delay: 0.3 });
		gsap.fromTo('.hero-title',    { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1,   delay: 0.5 });
		gsap.fromTo('.hero-subtitle', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, delay: 0.8 });
		gsap.fromTo('.hero-ctas',     { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, delay: 1   });
		gsap.fromTo('.hero-stats',    { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, delay: 1.2, stagger: 0.1 });

		return () => {
			cancelAnimationFrame(animationId);
			clearInterval(noteInterval);
			window.removeEventListener('resize', resize);
			heroRef.removeEventListener('mousemove', onMove);
			heroRef.removeEventListener('mouseleave', onLeave);
			observer.disconnect();
		};
	});

	function scrollToAbout() {
		document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
	}
</script>

<section
	bind:this={heroRef}
	class="relative min-h-screen flex items-center overflow-hidden bg-sjcu-dark"
	id="hero"
>
	<canvas bind:this={canvasRef} class="absolute inset-0 pointer-events-none" style="opacity: 0.6;" aria-hidden="true"></canvas>

	<!-- Floating musical notes container -->
	<div bind:this={notesRef} class="absolute inset-0 overflow-hidden pointer-events-none" style="z-index: 2;" aria-hidden="true"></div>

	<div class="absolute inset-0 bg-hero-gradient pointer-events-none" style="z-index: 1;"></div>
	<div class="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-sjcu-purple/8 blur-[120px] pointer-events-none" style="z-index: 1;"></div>
	<div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-sjcu-dark to-transparent pointer-events-none hero-vignette-bottom" style="z-index: 1;"></div>

	<!-- Mouse spotlight — above gradients, below content -->
	<div
		bind:this={spotlightRef}
		class="absolute top-0 left-0 pointer-events-none w-[300px] h-[300px] rounded-full"
		style="
			opacity: 0;
			transition: opacity 0.4s ease;
			will-change: transform;
			z-index: 2;
			filter: blur(6px);
			mix-blend-mode: screen;
		"
		aria-hidden="true"
	></div>

	<!-- ── Right side hero visuals ──────────────────────────────────── -->
	<div class="absolute right-0 top-0 bottom-0 w-1/2 hidden lg:flex items-center justify-center pointer-events-none" style="z-index: 3;">

		<!-- Sound wave rings -->
		<div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
			<div class="sound-ring" style="--delay:0s"></div>
			<div class="sound-ring" style="--delay:0.8s"></div>
			<div class="sound-ring" style="--delay:1.6s"></div>
			<div class="sound-ring" style="--delay:2.4s"></div>
		</div>

		<!-- Purple glow blob behind mic -->
		<div class="absolute w-72 h-72 rounded-full blur-[80px] opacity-30" style="background: radial-gradient(circle, #9d4edd, #7c3aed);"></div>

		<!-- Floating mic -->
		<img
			src="/images/mic.png"
			alt="Microphone"
			class="hero-mic relative drop-shadow-2xl select-none"
			style="width: 220px; filter: drop-shadow(0 0 40px rgba(124,58,237,0.6));"
			draggable="false"
		/>

		<!-- Floating headphones — top right -->
		<img
			src="/images/headphones.png"
			alt="Headphones"
			class="hero-headphones absolute drop-shadow-xl select-none"
			style="width: 110px; top: 22%; right: 12%; filter: drop-shadow(0 0 20px rgba(157,78,221,0.5));"
			draggable="false"
		/>

		<!-- Equalizer bars at bottom -->
		<div class="absolute bottom-[18%] flex items-end gap-1.5">
			{#each Array.from({ length: 14 }) as _, i}
				<div class="eq-bar rounded-full" style="--delay: {i * 0.07}s; --max: {20 + Math.random() * 30}px;"></div>
			{/each}
		</div>

		<!-- Frequency dots grid (subtle background texture) -->
		<div class="absolute inset-0 opacity-20" style="background-image: radial-gradient(circle, rgba(167,139,250,0.4) 1px, transparent 1px); background-size: 28px 28px;"></div>
	</div>

	<div class="relative max-w-7xl mx-auto px-6 pt-28 pb-16 w-full" style="z-index: 3;">
		<div class="max-w-3xl">
			<div class="hero-tag opacity-0">
				<span class="section-tag">
					Est. Since 2018 — Madathuvilai, Arumuganeri, Tuticorin dt, Tamil Nadu
				</span>
			</div>

			<h1 class="hero-title opacity-0 font-display text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-sjcu-text-primary leading-[1.05] tracking-tight mb-6 mt-3">
				Sing unto<br />
				<span class="purple-gradient-text">The Lord</span><br />
				a new song.
			</h1>

			<p class="hero-subtitle opacity-0 text-sjcu-text-secondary text-lg md:text-xl leading-relaxed max-w-xl mb-10">
				We are St. John's Carol Union — a choir and music production collective dedicated to creating transcendent musical experiences that touch the soul.
			</p>

			<div class="hero-ctas opacity-0 flex flex-wrap items-center gap-4">
				<a use:magnetic={{ strength: 0.3 }} href="#productions" onclick={(e) => { e.preventDefault(); document.getElementById('productions')?.scrollIntoView({ behavior: 'smooth' }); }} class="btn-primary">
					<Play class="w-4 h-4" />
					View Productions
				</a>
				<a use:magnetic={{ strength: 0.25 }} href="/production-enquiry" class="btn-outline">
					Book a Performance
				</a>
			</div>

			<div class="hero-stats opacity-0 flex flex-wrap items-center gap-6 mt-14">
				{#each [{ num: '8+', label: 'Years of Music' }, { num: '15', label: 'Productions' }, { num: '30+', label: 'Choir Members' }] as stat}
					<div class="flex flex-col">
						<span class="font-display text-2xl font-bold purple-gradient-text">{stat.num}</span>
						<span class="text-sjcu-text-muted text-xs uppercase tracking-widest">{stat.label}</span>
					</div>
					{#if stat !== [{ num: '40+', label: 'Years of Music' }, { num: '200+', label: 'Productions' }, { num: '500+', label: 'Performances' }, { num: '50+', label: 'Choir Members' }][3]}
						<div class="h-8 w-px bg-sjcu-border"></div>
					{/if}
				{/each}
			</div>
		</div>
	</div>

	<button
		onclick={scrollToAbout}
		class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-sjcu-text-muted hover:text-sjcu-accent transition-colors group"
		style="z-index: 3;"
		aria-label="Scroll down"
	>
		<span class="text-xs tracking-widest uppercase">Scroll</span>
		<ChevronDown class="w-5 h-5 animate-float" />
	</button>
</section>

<style>
	/* ── Sound wave rings ──────────────────────────────────────── */
	.sound-ring {
		position: absolute;
		width: 260px;
		height: 260px;
		border-radius: 50%;
		border: 1.5px solid rgba(167, 139, 250, 0.35);
		animation: soundWave 3.2s ease-out infinite;
		animation-delay: var(--delay, 0s);
		transform: translate(-50%, -50%) scale(0.5);
		opacity: 0;
	}
	:global([data-theme="light"]) .sound-ring {
		border-color: rgba(109, 40, 217, 0.3);
	}

	:global([data-theme="light"]) .hero-vignette-bottom {
		background: linear-gradient(to top, rgb(var(--sjcu-dark)) 0%, transparent 100%);
	}

	@keyframes soundWave {
		0%   { transform: translate(-50%, -50%) scale(0.5); opacity: 0.7; }
		100% { transform: translate(-50%, -50%) scale(2.8); opacity: 0; }
	}

	/* ── Floating mic ──────────────────────────────────────────── */
	.hero-mic {
		animation: floatMic 5s ease-in-out infinite;
	}

	@keyframes floatMic {
		0%   { transform: translateY(0px) rotate(-3deg); }
		50%  { transform: translateY(-22px) rotate(3deg); }
		100% { transform: translateY(0px) rotate(-3deg); }
	}

	/* ── Floating headphones ───────────────────────────────────── */
	.hero-headphones {
		animation: floatHeadphones 6.5s ease-in-out infinite;
	}

	@keyframes floatHeadphones {
		0%   { transform: translateY(0px) rotate(8deg); }
		50%  { transform: translateY(-14px) rotate(-4deg); }
		100% { transform: translateY(0px) rotate(8deg); }
	}

	/* ── Equalizer bars ────────────────────────────────────────── */
	.eq-bar {
		width: 5px;
		height: 8px;
		background: linear-gradient(to top, #7c3aed, #c4b5fd);
		animation: eqBounce 0.9s ease-in-out infinite alternate;
		animation-delay: var(--delay, 0s);
		max-height: var(--max, 30px);
	}

	@keyframes eqBounce {
		0%   { height: 6px; opacity: 0.4; }
		100% { height: var(--max, 30px); opacity: 1; }
	}
</style>
