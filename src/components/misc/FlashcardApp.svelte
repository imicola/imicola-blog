<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import katex from "katex";
	import type { Flashcard, ChapterInfo, SectionInfo } from "../../data/flashcards";

	interface Props {
		cards: Flashcard[];
		chapters: ChapterInfo[];
		sections: SectionInfo[];
	}

	let { cards, chapters, sections }: Props = $props();

	let mode = $state<"category" | "random">("category");
	let selectedChapterId = $state<string>("choice");
	let selectedSectionId = $state<string | null>(null);
	let currentIndex = $state(0);
	let isFlipped = $state(false);
	let shuffledDeck = $state<Flashcard[]>([]);

	let chapterSections = $derived(
		sections.filter((s) => s.chapterId === selectedChapterId),
	);

	let categoryDeck = $derived.by(() => {
		let filtered = cards;
		const chapter = chapters.find((c) => c.id === selectedChapterId);
		if (chapter) {
			filtered = filtered.filter((c) => c.chapter === chapter.title);
		}
		if (selectedSectionId) {
			const section = sections.find((s) => s.id === selectedSectionId);
			if (section) {
				filtered = filtered.filter(
					(c) => c.chapter === chapter?.title && c.section === section.title,
				);
			}
		}
		return filtered;
	});

	let currentDeck = $derived(mode === "random" ? shuffledDeck : categoryDeck);
	let currentCard = $derived(currentDeck[currentIndex]);
	let progressCurrent = $derived(Math.min(currentIndex + 1, currentDeck.length));
	let progressTotal = $derived(currentDeck.length);
	let progressPercent = $derived(
		progressTotal > 0 ? (progressCurrent / progressTotal) * 100 : 0,
	);

	function shuffle<T>(arr: T[]): T[] {
		const a = [...arr];
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	}

	function flip() {
		isFlipped = !isFlipped;
	}

	function next() {
		if (currentIndex < currentDeck.length - 1) {
			currentIndex++;
			isFlipped = false;
		}
	}

	function prev() {
		if (currentIndex > 0) {
			currentIndex--;
			isFlipped = false;
		}
	}

	function selectChapter(chapterId: string) {
		selectedChapterId = chapterId;
		selectedSectionId = null;
		currentIndex = 0;
		isFlipped = false;
	}

	function selectSection(sectionId: string | null) {
		selectedSectionId = sectionId;
		currentIndex = 0;
		isFlipped = false;
	}

	function switchMode(newMode: "category" | "random") {
		mode = newMode;
		if (newMode === "random") {
			shuffledDeck = shuffle(cards);
		}
		currentIndex = 0;
		isFlipped = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (
			e.target instanceof HTMLInputElement ||
			e.target instanceof HTMLTextAreaElement
		)
			return;
		switch (e.key) {
			case " ":
				e.preventDefault();
				flip();
				break;
			case "ArrowLeft":
				e.preventDefault();
				prev();
				break;
			case "ArrowRight":
				e.preventDefault();
				next();
				break;
		}
	}

	onMount(() => {
		document.addEventListener("keydown", handleKeydown);
	});

	onDestroy(() => {
		document.removeEventListener("keydown", handleKeydown);
	});

	function escapeAndMarkdown(text: string): string {
		return text
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
			.replace(/\n/g, "<br>");
	}

	function renderContent(text: string): string {
		const blockMathHtml: string[] = [];
		let working = text.replace(
			/\$\$([\s\S]+?)\$\$/g,
			(_: string, math: string) => {
				try {
					const html = katex.renderToString(math.trim(), {
						displayMode: true,
						throwOnError: false,
					});
					blockMathHtml.push(html);
				} catch {
					blockMathHtml.push(math.trim());
				}
				return `\n\n@@BM${blockMathHtml.length - 1}@@\n\n`;
			},
		);

		const codeBlocks: string[] = [];
		working = working.replace(
			/```([\s\S]+?)```/g,
			(_: string, code: string) => {
				const escaped = code
					.trim()
					.replace(/&/g, "&amp;")
					.replace(/</g, "&lt;")
					.replace(/>/g, "&gt;");
				codeBlocks.push(
					`<pre class="code-block"><code>${escaped}</code></pre>`,
				);
				return `\n\n@@CB${codeBlocks.length - 1}@@\n\n`;
			},
		);

		const paragraphs = working
			.split(/\n\n+/)
			.map((p) => p.trim())
			.filter((p) => p);

		const result = paragraphs.map((para) => {
			const bmMatch = para.match(/^@@BM(\d+)@@$/);
			if (bmMatch) {
				return blockMathHtml[parseInt(bmMatch[1])];
			}

			const cbMatch = para.match(/^@@CB(\d+)@@$/);
			if (cbMatch) {
				return codeBlocks[parseInt(cbMatch[1])];
			}

			const segments: string[] = [];
			let lastIdx = 0;
			const inlineMathRegex = /\$([^\n$]+?)\$/g;
			let m: RegExpExecArray | null;
			while ((m = inlineMathRegex.exec(para)) !== null) {
				if (m.index > lastIdx) {
					segments.push(
						escapeAndMarkdown(para.slice(lastIdx, m.index)),
					);
				}
				try {
					segments.push(
						katex.renderToString(m[1], {
							displayMode: false,
							throwOnError: false,
						}),
					);
				} catch {
					segments.push(m[0]);
				}
				lastIdx = m.index + m[0].length;
			}
			if (lastIdx < para.length) {
				segments.push(escapeAndMarkdown(para.slice(lastIdx)));
			}

			return `<p>${segments.join("")}</p>`;
		});

		return result.join("\n") || `<p>${escapeAndMarkdown(text)}</p>`;
	}

	function getTypeColor(type: string): string {
		switch (type) {
			case "choice":
				return "bg-blue-500/15 text-blue-600 dark:text-blue-400";
			case "fill-blank":
				return "bg-green-500/15 text-green-600 dark:text-green-400";
			case "short-answer":
				return "bg-orange-500/15 text-orange-600 dark:text-orange-400";
			case "calculation":
				return "bg-purple-500/15 text-purple-600 dark:text-purple-400";
			default:
				return "bg-gray-500/15 text-gray-600 dark:text-gray-400";
		}
	}

	function getTypeLabel(type: string): string {
		switch (type) {
			case "choice":
				return "选择题";
			case "fill-blank":
				return "填空题";
			case "short-answer":
				return "简答题";
			case "calculation":
				return "计算题";
			default:
				return type;
		}
	}
</script>

<div class="flashcard-app">
	<div class="mode-toggle">
		<button
			class="mode-btn"
			class:active={mode === "category"}
			onclick={() => switchMode("category")}
		>
			分类模式
		</button>
		<button
			class="mode-btn"
			class:active={mode === "random"}
			onclick={() => switchMode("random")}
		>
			随机模式
		</button>
	</div>

	{#if mode === "category"}
		<div class="selectors">
			<div class="selector-row">
				<span class="selector-label">章节</span>
				<div class="chip-row">
					{#each chapters as ch}
						<button
							class="chip"
							class:active={selectedChapterId === ch.id}
							onclick={() => selectChapter(ch.id)}
						>
							{ch.title}
						</button>
					{/each}
				</div>
			</div>
			<div class="selector-row">
				<span class="selector-label">小节</span>
				<div class="chip-row">
					<button
						class="chip"
						class:active={selectedSectionId === null}
						onclick={() => selectSection(null)}
					>
						全部
					</button>
					{#each chapterSections as sec}
						<button
							class="chip"
							class:active={selectedSectionId === sec.id}
							onclick={() => selectSection(sec.id)}
						>
							{sec.title}
						</button>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	<div class="progress-section">
		<div class="progress-bar-track">
			<div
				class="progress-bar-fill"
				style="width: {progressPercent}%"
			></div>
		</div>
		<span class="progress-text">
			{progressCurrent} / {progressTotal}
		</span>
	</div>

	{#if currentCard}
		<div class="flip-card-container">
			<div
				class="flip-card"
				role="button"
				tabindex="0"
				onclick={flip}
				onkeydown={(e) =>
					e.key === "Enter" && (e.preventDefault(), flip())}
			>
				<div class="flip-card-inner" class:flipped={isFlipped}>
					<div class="flip-card-face flip-card-front">
						<div class="card-header">
							<span
								class="type-badge {getTypeColor(currentCard.type)}"
							>
								{getTypeLabel(currentCard.type)}
							</span>
							<span class="card-section">{currentCard.section}</span>
						</div>
						<div class="card-body front-body">
							{@html renderContent(currentCard.front)}
						</div>
						<div class="card-footer-hint">
							点击卡片或按 Space 翻转查看答案
						</div>
					</div>
					<div class="flip-card-face flip-card-back">
						<div class="card-header">
							<span
								class="type-badge {getTypeColor(currentCard.type)}"
							>
								{getTypeLabel(currentCard.type)}
							</span>
							<span class="card-section">答案解析</span>
						</div>
						<div class="card-body back-body">
							{@html renderContent(currentCard.back)}
						</div>
						<div class="card-footer-hint">
							点击卡片或按 Space 翻回题目
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="nav-controls">
			<button
				class="nav-btn"
				disabled={currentIndex === 0}
				onclick={prev}
			>
				← 上一题
			</button>
			<button class="nav-btn flip-btn" onclick={flip}>
				{isFlipped ? "翻回题目" : "查看答案"}
			</button>
			<button
				class="nav-btn"
				disabled={currentIndex >= currentDeck.length - 1}
				onclick={next}
			>
				下一题 →
			</button>
		</div>

		<div class="shortcuts-hint">
			<kbd>Space</kbd> 翻转
			<kbd>←</kbd>
			<kbd>→</kbd> 导航
		</div>
	{:else}
		<div class="empty-state">
			<p>该分类下暂无题目</p>
		</div>
	{/if}
</div>

<style>
	.flashcard-app {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.mode-toggle {
		display: flex;
		gap: 0.5rem;
		padding: 0.375rem;
		border-radius: 0.75rem;
		background: var(--btn-plain-bg-hover, rgba(0, 0, 0, 0.05));
		width: fit-content;
	}

	.mode-btn {
		padding: 0.5rem 1.25rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--btn-content, inherit);
		background: transparent;
		border: none;
		cursor: pointer;
		transition: all 0.2s;
	}

	.mode-btn.active {
		background: var(--primary, #400bc6);
		color: white;
	}

	.selectors {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.selector-row {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
	}

	.selector-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--btn-content, inherit);
		opacity: 0.6;
		padding-top: 0.375rem;
		white-space: nowrap;
		min-width: 2.5rem;
	}

	.chip-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.chip {
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
		border: 1px solid var(--line-divider, rgba(0, 0, 0, 0.1));
		background: transparent;
		color: var(--btn-content, inherit);
		cursor: pointer;
		transition: all 0.15s;
	}

	.chip:hover {
		border-color: var(--primary, #400bc6);
	}

	.chip.active {
		background: var(--primary, #400bc6);
		color: white;
		border-color: var(--primary, #400bc6);
	}

	.progress-section {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.progress-bar-track {
		flex: 1;
		height: 0.375rem;
		border-radius: 9999px;
		background: var(--btn-plain-bg-hover, rgba(0, 0, 0, 0.06));
		overflow: hidden;
	}

	.progress-bar-fill {
		height: 100%;
		border-radius: 9999px;
		background: var(--primary, #400bc6);
		transition: width 0.3s ease;
	}

	.progress-text {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--btn-content, inherit);
		opacity: 0.7;
		white-space: nowrap;
		min-width: 3rem;
		text-align: right;
	}

	.flip-card-container {
		perspective: 1500px;
	}

	.flip-card {
		width: 100%;
		min-height: 400px;
		cursor: pointer;
		outline: none;
	}

	.flip-card-inner {
		position: relative;
		width: 100%;
		min-height: 400px;
		transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
		transform-style: preserve-3d;
	}

	.flip-card-inner.flipped {
		transform: rotateY(180deg);
	}

	.flip-card-face {
		position: absolute;
		inset: 0;
		min-height: 400px;
		backface-visibility: hidden;
		-webkit-backface-visibility: hidden;
		border-radius: var(--radius-large, 1rem);
		padding: 1.75rem;
		display: flex;
		flex-direction: column;
		background: var(--card-bg, white);
		border: 1px solid var(--line-divider, rgba(0, 0, 0, 0.08));
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
	}

	.flip-card-back {
		transform: rotateY(180deg);
	}

	.card-header {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		margin-bottom: 1.25rem;
		padding-bottom: 0.875rem;
		border-bottom: 1px solid var(--line-divider, rgba(0, 0, 0, 0.06));
	}

	.type-badge {
		padding: 0.2rem 0.625rem;
		border-radius: 0.375rem;
		font-size: 0.7rem;
		font-weight: 700;
	}

	.card-section {
		font-size: 0.75rem;
		color: var(--btn-content, inherit);
		opacity: 0.5;
	}

	.card-body {
		flex: 1;
		overflow-y: auto;
		line-height: 1.7;
		font-size: 0.95rem;
	}

	.card-body :global(p) {
		margin: 0 0 0.5rem 0;
	}

	.card-body :global(p:last-child) {
		margin-bottom: 0;
	}

	.card-body :global(strong) {
		font-weight: 700;
	}

	.card-body :global(.code-block) {
		background: var(--btn-plain-bg-hover, rgba(0, 0, 0, 0.05));
		border-radius: 0.5rem;
		padding: 0.75rem 1rem;
		margin: 0.5rem 0;
		overflow-x: auto;
		font-family: "Courier New", monospace;
		font-size: 0.8rem;
		line-height: 1.5;
		white-space: pre;
	}

	.card-body :global(.katex-display) {
		margin: 0.75rem 0;
		overflow-x: auto;
		overflow-y: hidden;
	}

	.card-body :global(.katex) {
		font-size: 1em;
	}

	.front-body {
		font-size: 1rem;
	}

	.back-body {
		font-size: 0.925rem;
	}

	.card-footer-hint {
		margin-top: 1rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--line-divider, rgba(0, 0, 0, 0.06));
		font-size: 0.7rem;
		text-align: center;
		opacity: 0.4;
	}

	.nav-controls {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
	}

	.nav-btn {
		padding: 0.625rem 1.25rem;
		border-radius: 0.625rem;
		font-size: 0.825rem;
		font-weight: 600;
		border: 1px solid var(--line-divider, rgba(0, 0, 0, 0.1));
		background: var(--card-bg, white);
		color: var(--btn-content, inherit);
		cursor: pointer;
		transition: all 0.15s;
	}

	.nav-btn:hover:not(:disabled) {
		background: var(--btn-plain-bg-hover, rgba(0, 0, 0, 0.04));
	}

	.nav-btn:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.flip-btn {
		background: var(--primary, #400bc6);
		color: white;
		border-color: var(--primary, #400bc6);
	}

	.flip-btn:hover:not(:disabled) {
		opacity: 0.9;
		background: var(--primary, #400bc6);
	}

	.shortcuts-hint {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.7rem;
		opacity: 0.4;
	}

	.shortcuts-hint kbd {
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		background: var(--btn-plain-bg-hover, rgba(0, 0, 0, 0.06));
		border: 1px solid var(--line-divider, rgba(0, 0, 0, 0.1));
		font-family: monospace;
		font-size: 0.65rem;
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		opacity: 0.5;
	}

	@media (max-width: 640px) {
		.flip-card,
		.flip-card-inner,
		.flip-card-face {
			min-height: 320px;
		}

		.flip-card-face {
			padding: 1.25rem;
		}

		.nav-controls {
			flex-direction: column;
		}

		.nav-btn {
			width: 100%;
			text-align: center;
		}

		.selector-row {
			flex-direction: column;
		}

		.selector-label {
			padding-top: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.flip-card-inner {
			transition: none;
		}
	}
</style>
