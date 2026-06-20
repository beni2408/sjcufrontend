<script lang="ts">
	import { onMount } from 'svelte';

	let progress = $state(0);
	let visible  = $state(false);

	const TITLE = "St. John's Carol Union";
	const CIRC  = 376.99; // 2π × r60

	onMount(() => {
		requestAnimationFrame(() => { visible = true; });
		const iv = setInterval(() => {
			progress += Math.random() * 18;
			if (progress >= 100) { progress = 100; clearInterval(iv); }
		}, 100);
	});
</script>

<div class="loader-root">

	<!-- Subtle grid texture -->
	<div class="loader-grid" aria-hidden="true"></div>

	<!-- Floating ambient orbs -->
	<div class="orb orb-a" aria-hidden="true"></div>
	<div class="orb orb-b" aria-hidden="true"></div>
	<div class="orb orb-c" aria-hidden="true"></div>

	<!-- Giant ghost "SJCU" watermark -->
	<div class="ghost-mark" aria-hidden="true">SJCU</div>

	<!-- Floating music notes -->
	{#each [
		{ ch: '♪', l: '6%',  dur: '8s',   del: '0s'    },
		{ ch: '♫', l: '17%', dur: '10.5s', del: '-2.5s' },
		{ ch: '♩', l: '51%', dur: '7.5s',  del: '-1s'   },
		{ ch: '♪', l: '70%', dur: '9.5s',  del: '-4.2s' },
		{ ch: '♫', l: '87%', dur: '8.5s',  del: '-0.7s' },
		{ ch: '♩', l: '34%', dur: '11s',   del: '-3.1s' },
	] as n}
		<span class="fnote" style="left:{n.l}; animation-duration:{n.dur}; animation-delay:{n.del}" aria-hidden="true">
			{n.ch}
		</span>
	{/each}

	<!-- Main centered content -->
	<div class="loader-body" class:in={visible}>

		<!-- Circular SVG progress ring wrapping the logo -->
		<div class="ring-shell">
			<svg class="circ-svg" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
				<defs>
					<linearGradient id="pgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%"   stop-color="#7c3aed"/>
						<stop offset="100%" stop-color="#c084fc"/>
					</linearGradient>
				</defs>
				<!-- Track -->
				<circle class="c-track" cx="70" cy="70" r="60"/>
				<!-- Animated fill -->
				<circle
					class="c-fill"
					cx="70" cy="70" r="60"
					style="stroke-dasharray:{CIRC}; stroke-dashoffset:{CIRC - (CIRC * Math.min(progress,100)) / 100}"
				/>
			</svg>
			<!-- Expanding sound rings -->
			<span class="sring sra" aria-hidden="true"></span>
			<span class="sring srb" aria-hidden="true"></span>
			<!-- Logo disc -->
			<div class="logo-disc">
				<img src="/logo.png" alt="SJCU Logo" loading="eager" decoding="sync" />
			</div>
		</div>

		<!-- Large percentage counter -->
		<p class="pct-num">
			{Math.floor(Math.min(progress, 100))}<span class="pct-sym">%</span>
		</p>

		<!-- Title: staggered letter slide-up -->
		<h1 class="loader-title">
			{#each TITLE.split('') as ch, i}
				<span class="lch" style="animation-delay:{0.1 + i * 0.022}s">
					{ch === ' ' ? ' ' : ch}
				</span>
			{/each}
		</h1>

		<!-- Wide equalizer bars -->
		<div class="eq" aria-hidden="true">
			{#each [
				{ mx: 34, spd: '0.60s', del: '0s'    },
				{ mx: 54, spd: '0.82s', del: '0.06s' },
				{ mx: 26, spd: '0.66s', del: '0.13s' },
				{ mx: 60, spd: '0.92s', del: '0.19s' },
				{ mx: 40, spd: '0.74s', del: '0.25s' },
				{ mx: 64, spd: '1.02s', del: '0.04s' },
				{ mx: 46, spd: '0.78s', del: '0.10s' },
				{ mx: 58, spd: '0.88s', del: '0.16s' },
				{ mx: 30, spd: '0.68s', del: '0.22s' },
				{ mx: 52, spd: '0.84s', del: '0.03s' },
				{ mx: 42, spd: '0.72s', del: '0.28s' },
				{ mx: 56, spd: '0.96s', del: '0.07s' },
				{ mx: 32, spd: '0.62s', del: '0.14s' },
				{ mx: 48, spd: '0.76s', del: '0.20s' },
				{ mx: 26, spd: '0.58s', del: '0.26s' },
			] as b}
				<span class="eqb" style="--mx:{b.mx}px; animation-duration:{b.spd}; animation-delay:{b.del}"></span>
			{/each}
		</div>

		<!-- Subtitle with bouncing dots -->
		<p class="loader-sub">
			LOADING EXPERIENCE<span class="dot d1">.</span><span class="dot d2">.</span><span class="dot d3">.</span>
		</p>

	</div>
</div>

<style>
	/* ── Root ──────────────────────────────────────────────────────────── */
	.loader-root {
		position: fixed;
		inset: 0;
		z-index: 9998;
		background: rgb(var(--sjcu-dark));
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	/* ── Grid texture overlay ───────────────────────────────────────────── */
	.loader-grid {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background-image:
			linear-gradient(rgba(124,58,237,0.05) 1px, transparent 1px),
			linear-gradient(90deg, rgba(124,58,237,0.05) 1px, transparent 1px);
		background-size: 64px 64px;
		mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 75%);
		-webkit-mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 75%);
	}
	:global([data-theme="light"]) .loader-grid {
		background-image:
			linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px),
			linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px);
	}

	/* ── Ambient orbs ───────────────────────────────────────────────────── */
	.orb {
		position: absolute;
		border-radius: 50%;
		filter: blur(90px);
		pointer-events: none;
	}
	.orb-a {
		width: 700px; height: 700px;
		background: radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 70%);
		top: -25%; left: -20%;
		animation: orbA 13s ease-in-out infinite alternate;
	}
	.orb-b {
		width: 550px; height: 550px;
		background: radial-gradient(circle, rgba(168,85,247,0.16) 0%, transparent 70%);
		bottom: -22%; right: -18%;
		animation: orbB 10s ease-in-out infinite alternate;
	}
	.orb-c {
		width: 360px; height: 360px;
		background: radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%);
		top: 45%; left: 52%;
		animation: orbC 15s ease-in-out infinite alternate;
	}
	@keyframes orbA { from { transform: translate(0,0); }         to { transform: translate(90px, 70px); }  }
	@keyframes orbB { from { transform: translate(0,0); }         to { transform: translate(-70px,-90px); } }
	@keyframes orbC { from { transform: translate(-50%,-50%) scale(1); } to { transform: translate(-50%,-50%) scale(1.35); } }

	/* ── Ghost "SJCU" watermark ─────────────────────────────────────────── */
	.ghost-mark {
		position: absolute;
		font-family: 'Syne', sans-serif;
		font-size: clamp(200px, 28vw, 380px);
		font-weight: 900;
		letter-spacing: -0.05em;
		color: transparent;
		-webkit-text-stroke: 1.5px rgba(124,58,237,0.12);
		user-select: none;
		pointer-events: none;
		white-space: nowrap;
		animation: ghostPulse 5s ease-in-out infinite alternate;
	}
	:global([data-theme="light"]) .ghost-mark {
		-webkit-text-stroke-color: rgba(109,40,217,0.09);
	}
	@keyframes ghostPulse {
		from { opacity: 0.55; transform: scale(1);    }
		to   { opacity: 1;    transform: scale(1.03); }
	}

	/* ── Floating notes ─────────────────────────────────────────────────── */
	.fnote {
		position: absolute;
		bottom: -2.5rem;
		font-size: 1.7rem;
		color: rgba(167,139,250,0.2);
		animation: floatUp linear infinite;
		user-select: none;
		pointer-events: none;
	}
	:global([data-theme="light"]) .fnote {
		color: rgba(109,40,217,0.14);
	}
	@keyframes floatUp {
		0%   { transform: translateY(0) rotate(-8deg);   opacity: 0; }
		6%   { opacity: 1; }
		88%  { opacity: 0.5; }
		100% { transform: translateY(-108vh) rotate(16deg); opacity: 0; }
	}

	/* ── Body entrance ──────────────────────────────────────────────────── */
	.loader-body {
		position: relative;
		z-index: 2;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.6rem;
		opacity: 0;
		transform: translateY(22px);
		transition: opacity 0.6s ease, transform 0.6s ease;
	}
	.loader-body.in { opacity: 1; transform: translateY(0); }

	/* ── Circular progress ring + logo ──────────────────────────────────── */
	.ring-shell {
		position: relative;
		width: 110px;
		height: 110px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.circ-svg {
		position: absolute;
		top: -15px; left: -15px;
		width: 140px; height: 140px;
		transform: rotate(-90deg);
		pointer-events: none;
		overflow: visible;
	}
	.c-track {
		fill: none;
		stroke: rgba(124,58,237,0.18);
		stroke-width: 2.5;
	}
	:global([data-theme="light"]) .c-track {
		stroke: rgba(124,58,237,0.13);
	}
	.c-fill {
		fill: none;
		stroke: url(#pgGrad);
		stroke-width: 2.5;
		stroke-linecap: round;
		transition: stroke-dashoffset 0.28s ease;
		filter: drop-shadow(0 0 7px rgba(167,139,250,0.75));
	}
	:global([data-theme="light"]) .c-fill {
		filter: drop-shadow(0 0 6px rgba(109,40,217,0.55));
	}

	/* Sound rings */
	.sring {
		position: absolute;
		inset: -6px;
		border-radius: 50%;
		border: 1px solid rgba(124,58,237,0.4);
		animation: sExpand 2.8s ease-out infinite;
		pointer-events: none;
	}
	.srb { animation-delay: 1.4s; }
	@keyframes sExpand {
		0%   { transform: scale(1);   opacity: 0.7; }
		100% { transform: scale(2.6); opacity: 0;   }
	}

	/* Logo disc */
	.logo-disc {
		position: relative;
		z-index: 2;
		width: 110px;
		height: 110px;
		border-radius: 50%;
		overflow: hidden;
		background: rgba(255,255,255,0.05);
		border: 2px solid rgba(124,58,237,0.3);
		box-shadow:
			0 0 45px rgba(124,58,237,0.22),
			inset 0 0 18px rgba(124,58,237,0.07);
	}
	:global([data-theme="light"]) .logo-disc {
		background: rgba(124,58,237,0.07);
		border-color: rgba(124,58,237,0.22);
		box-shadow: 0 0 35px rgba(124,58,237,0.14);
	}
	.logo-disc img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	/* ── Large percentage counter ────────────────────────────────────────── */
	.pct-num {
		font-family: 'Syne', sans-serif;
		font-size: 4.5rem;
		font-weight: 900;
		line-height: 1;
		letter-spacing: -0.04em;
		color: rgba(124,58,237,0.32);
		font-variant-numeric: tabular-nums;
		margin-top: -0.4rem;
		transition: color 0.3s ease;
	}
	:global([data-theme="light"]) .pct-num {
		color: rgba(109,40,217,0.25);
	}
	.pct-sym {
		font-size: 2.4rem;
		font-weight: 800;
		vertical-align: super;
		margin-left: 2px;
	}

	/* ── Title: letter spring-bounce ─────────────────────────────────────── */
	.loader-title {
		font-family: 'Syne', sans-serif;
		font-size: clamp(1.5rem, 4.8vw, 2.5rem);
		font-weight: 700;
		color: rgb(var(--sjcu-text-primary));
		letter-spacing: -0.025em;
		line-height: 1;
		text-align: center;
		margin-top: -0.4rem;
	}
	.lch {
		display: inline-block;
		opacity: 0;
		transform: translateY(16px);
		animation: lReveal 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
		animation-fill-mode: backwards;
	}
	@keyframes lReveal {
		to { opacity: 1; transform: translateY(0); }
	}

	/* ── Wide equalizer ──────────────────────────────────────────────────── */
	.eq {
		display: flex;
		align-items: flex-end;
		gap: 5px;
		height: 68px;
	}
	.eqb {
		display: block;
		width: 7px;
		border-radius: 4px 4px 2px 2px;
		background: linear-gradient(to top, rgb(var(--sjcu-purple)), rgb(var(--sjcu-accent)));
		height: 6px;
		animation: eqB ease-in-out infinite alternate;
	}
	@keyframes eqB {
		0%   { height: 6px;             opacity: 0.5; }
		100% { height: var(--mx, 36px);  opacity: 1;   }
	}

	/* ── Subtitle + bouncing dots ────────────────────────────────────────── */
	.loader-sub {
		font-size: 0.63rem;
		font-weight: 700;
		letter-spacing: 0.26em;
		text-transform: uppercase;
		color: rgb(var(--sjcu-accent));
		margin-top: -0.3rem;
	}
	.dot { animation: dotBounce 1.4s ease-in-out infinite; opacity: 0; display: inline-block; }
	.d1 { animation-delay: 0s;    }
	.d2 { animation-delay: 0.22s; }
	.d3 { animation-delay: 0.44s; }
	@keyframes dotBounce {
		0%, 55% { opacity: 0; transform: translateY(0);    }
		28%     { opacity: 1; transform: translateY(-3px); }
	}
</style>
