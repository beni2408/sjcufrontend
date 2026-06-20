<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { MessageCircle, X, Send, ChevronDown, Sparkles } from 'lucide-svelte';
	import { chatApi } from '$lib/services/api.js';

	type Message = { role: 'user' | 'assistant'; content: string; time: Date };

	let open      = $state(false);
	let input     = $state('');
	let messages  = $state<Message[]>([]);
	let typing    = $state(false);
	let scrollEl: HTMLDivElement;
	let inputEl: HTMLInputElement;
	let unread    = $state(0);
	let error     = $state('');
	let showHint  = $state(false);

	const QUICK_REPLIES = [
		'What events are coming up?',
		'Tell me about productions',
		'How do I join the choir?',
		'Who is in the team?',
		'How do I contact SJCU?',
	];

	async function scrollToBottom() {
		await tick();
		if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight;
	}

	async function sendMessage(text?: string) {
		const msg = (text ?? input).trim();
		if (!msg || typing) return;
		input = '';
		error = '';

		const userMsg: Message = { role: 'user', content: msg, time: new Date() };
		messages = [...messages, userMsg];
		await scrollToBottom();

		typing = true;
		await scrollToBottom();

		try {
			// Build history for the API (role + content only, last 10 turns)
			const history = messages.map(m => ({ role: m.role, content: m.content }));

			const res = await chatApi.send(history);
			const reply = res.data.reply;

			messages = [...messages, { role: 'assistant', content: reply, time: new Date() }];
			if (!open) unread++;
		} catch (err: any) {
			error = err.response?.data?.message || 'Something went wrong. Please try again.';
		} finally {
			typing = false;
			await scrollToBottom();
		}
	}

	async function toggleOpen() {
		open = !open;
		if (open) {
			unread = 0;
			await tick();
			inputEl?.focus();
			await scrollToBottom();
		}
	}

	function handleKey(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
	}

	function formatTime(d: Date) {
		return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	onMount(() => {
		setTimeout(() => {
			messages = [{
				role: 'assistant',
				content: "Hi there! 👋 I'm SJCU's AI assistant, powered by real data from our website. Ask me about upcoming events, our music productions, how to join the choir, meet our team, or anything else about St. John's Carol Union!",
				time: new Date(),
			}];
			if (!open) {
				unread = 1;
				showHint = true;
				// auto-hide the hint bubble after 3 seconds
				setTimeout(() => { showHint = false; }, 3000);
			}
		}, 2000);
	});
</script>

<!-- Floating button -->
<div class="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

	{#if !open && showHint}
		<button
			onclick={toggleOpen}
			class="chat-hint-bubble animate-fadeUp px-4 py-2.5 rounded-2xl text-sm shadow-lg max-w-[220px] text-left leading-snug"
		>
			👋 Hi! Ask me anything about SJCU
		</button>
	{/if}

	<button
		onclick={toggleOpen}
		class="relative w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 {open ? '' : 'hover:scale-110'}"
		style="background: linear-gradient(135deg, #7c3aed, #9d4edd); box-shadow: 0 8px 32px rgba(124,58,237,0.5);"
		aria-label="Chat with us"
	>
		{#if open}
			<ChevronDown class="w-6 h-6 text-white" />
		{:else}
			<MessageCircle class="w-6 h-6 text-white" />
			{#if unread > 0}
				<span class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-sjcu-dark animate-bounce">
					{unread}
				</span>
			{/if}
		{/if}
	</button>
</div>

<!-- Chat window -->
{#if open}
	<div class="chat-window fixed bottom-24 right-6 z-50 w-[340px] sm:w-[380px] flex flex-col rounded-3xl overflow-hidden shadow-2xl animate-fadeUp" style="height: 530px; max-height: calc(100vh - 120px);">

		<!-- Header -->
		<div class="chat-header flex items-center gap-3 px-5 py-4 flex-shrink-0">
			<div class="relative">
				<div class="w-10 h-10 rounded-full flex items-center justify-center" style="background: linear-gradient(135deg, #7c3aed, #9d4edd);">
					🎶
				</div>
				<span class="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-sjcu-dark"></span>
			</div>
			<div class="flex-1 min-w-0">
				<div class="flex items-center gap-1.5">
					<p class="text-sjcu-text-primary text-sm font-semibold leading-tight">SJCU Assistant</p>
					<span class="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide" style="background: rgba(124,58,237,0.2); color: #a78bfa; border: 1px solid rgba(124,58,237,0.3);">
						<Sparkles class="w-2.5 h-2.5" /> AI
					</span>
				</div>
				<p class="text-green-500 text-xs">Powered by Claude AI · Live data</p>
			</div>
			<button onclick={toggleOpen} class="w-8 h-8 rounded-full hover:bg-sjcu-purple/10 flex items-center justify-center text-sjcu-text-muted hover:text-sjcu-text-primary transition-colors">
				<X class="w-4 h-4" />
			</button>
		</div>

		<!-- Messages -->
		<div bind:this={scrollEl} class="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3 chat-scroll chat-messages-bg" style="overscroll-behavior: contain;" data-lenis-prevent>
			{#each messages as msg}
				<div class="flex {msg.role === 'user' ? 'justify-end' : 'justify-start'}">
					{#if msg.role === 'assistant'}
						<div class="flex items-end gap-2 max-w-[88%]">
							<div class="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs mb-0.5" style="background: linear-gradient(135deg,#7c3aed,#9d4edd);">🎶</div>
							<div class="chat-bot-bubble px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm text-sjcu-text-primary leading-relaxed">
								{msg.content}
								<div class="text-[10px] text-sjcu-text-muted/50 mt-1 text-right">{formatTime(msg.time)}</div>
							</div>
						</div>
					{:else}
						<div class="max-w-[88%]">
							<div class="px-4 py-2.5 rounded-2xl rounded-br-sm text-sm text-white leading-relaxed" style="background: linear-gradient(135deg, rgba(124,58,237,0.7), rgba(157,78,221,0.6)); border: 1px solid rgba(124,58,237,0.4);">
								{msg.content}
							</div>
							<div class="text-[10px] text-sjcu-text-muted/50 mt-0.5 text-right pr-1">{formatTime(msg.time)}</div>
						</div>
					{/if}
				</div>
			{/each}

			<!-- Typing indicator -->
			{#if typing}
				<div class="flex items-end gap-2">
					<div class="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs" style="background: linear-gradient(135deg,#7c3aed,#9d4edd);">🎶</div>
					<div class="chat-bot-bubble px-4 py-3 rounded-2xl rounded-bl-sm">
						<div class="flex items-center gap-1">
							<span class="typing-dot"></span>
							<span class="typing-dot" style="animation-delay:0.18s"></span>
							<span class="typing-dot" style="animation-delay:0.36s"></span>
						</div>
					</div>
				</div>
			{/if}

			<!-- Error -->
			{#if error}
				<div class="text-center text-xs text-red-400 px-4 py-2 rounded-xl" style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2);">
					{error}
				</div>
			{/if}
		</div>

		<!-- Quick replies — only before first user message -->
		{#if messages.length <= 1 && !typing}
			<div class="px-4 pb-2 flex flex-wrap gap-1.5 flex-shrink-0 chat-messages-bg">
				{#each QUICK_REPLIES as q}
					<button
						onclick={() => sendMessage(q)}
						class="chat-quick-reply px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105"
					>{q}</button>
				{/each}
			</div>
		{/if}

		<!-- Input -->
		<div class="px-4 py-3 flex-shrink-0 chat-input-bar">
			<div class="chat-input-wrap flex items-center gap-2 px-4 py-2.5 rounded-2xl">
				<input
					bind:this={inputEl}
					bind:value={input}
					onkeydown={handleKey}
					placeholder="Ask me anything about SJCU..."
					disabled={typing}
					class="flex-1 bg-transparent text-sjcu-text-primary text-sm outline-none placeholder:text-sjcu-text-muted/60 disabled:opacity-50"
				/>
				<button
					onclick={() => sendMessage()}
					disabled={!input.trim() || typing}
					class="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-30 {input.trim() && !typing ? 'hover:scale-110' : ''}"
					style="background: linear-gradient(135deg, #7c3aed, #9d4edd);"
				>
					<Send class="w-3.5 h-3.5 text-white" />
				</button>
			</div>
			<p class="text-center text-[10px] text-sjcu-text-muted/40 mt-2">AI answers based on live SJCU website data</p>
		</div>
	</div>
{/if}

<style>
	.chat-hint-bubble {
		background: rgba(15, 12, 35, 0.95);
		border: 1px solid rgba(124, 58, 237, 0.4);
		backdrop-filter: blur(12px);
		color: #f1f5f9;
	}
	.chat-window {
		background: rgba(10, 8, 28, 0.97);
		border: 1px solid rgba(124, 58, 237, 0.3);
		backdrop-filter: blur(20px);
	}
	.chat-header {
		background: linear-gradient(135deg, rgba(124, 58, 237, 0.25), rgba(157, 78, 221, 0.15));
		border-bottom: 1px solid rgba(124, 58, 237, 0.2);
	}
	.chat-messages-bg { background: transparent; }
	.chat-bot-bubble {
		background: rgba(124, 58, 237, 0.18);
		border: 1px solid rgba(124, 58, 237, 0.25);
	}
	.chat-quick-reply {
		background: rgba(124, 58, 237, 0.12);
		border: 1px solid rgba(124, 58, 237, 0.35);
		color: #c4b5fd;
	}
	.chat-input-bar { border-top: 1px solid rgba(124, 58, 237, 0.2); }
	.chat-input-wrap {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(124, 58, 237, 0.25);
	}

	:global([data-theme="light"]) .chat-hint-bubble {
		background: rgba(248, 244, 255, 0.97);
		border-color: rgba(124, 58, 237, 0.35);
		color: #1e1b4b;
	}
	:global([data-theme="light"]) .chat-window {
		background: rgba(255, 255, 255, 0.97);
		border-color: rgba(124, 58, 237, 0.25);
	}
	:global([data-theme="light"]) .chat-header {
		background: linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(157, 78, 221, 0.07));
		border-bottom-color: rgba(124, 58, 237, 0.15);
	}
	:global([data-theme="light"]) .chat-bot-bubble {
		background: rgba(124, 58, 237, 0.08);
		border-color: rgba(124, 58, 237, 0.2);
	}
	:global([data-theme="light"]) .chat-quick-reply {
		background: rgba(124, 58, 237, 0.08);
		border-color: rgba(124, 58, 237, 0.3);
		color: #6d28d9;
	}
	:global([data-theme="light"]) .chat-input-bar { border-top-color: rgba(124, 58, 237, 0.15); }
	:global([data-theme="light"]) .chat-input-wrap {
		background: rgba(124, 58, 237, 0.05);
		border-color: rgba(124, 58, 237, 0.2);
	}

	.typing-dot {
		display: inline-block;
		width: 6px; height: 6px;
		border-radius: 50%;
		background: #a78bfa;
		animation: typingBounce 0.9s ease-in-out infinite;
	}
	:global([data-theme="light"]) .typing-dot { background: #7c3aed; }
	@keyframes typingBounce {
		0%, 80%, 100% { transform: translateY(0);   opacity: 0.4; }
		40%            { transform: translateY(-6px); opacity: 1;   }
	}
	.chat-scroll { scrollbar-width: thin; scrollbar-color: rgba(124,58,237,0.4) transparent; }
	.chat-scroll::-webkit-scrollbar { width: 4px; }
	.chat-scroll::-webkit-scrollbar-track { background: transparent; }
	.chat-scroll::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.4); border-radius: 4px; }
	.chat-scroll::-webkit-scrollbar-thumb:hover { background: rgba(124,58,237,0.7); }
	:global([data-theme="light"]) .chat-scroll { scrollbar-color: rgba(109,40,217,0.35) transparent; }
	:global([data-theme="light"]) .chat-scroll::-webkit-scrollbar-thumb { background: rgba(109,40,217,0.35); }
</style>
