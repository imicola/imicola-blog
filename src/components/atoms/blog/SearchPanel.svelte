<script lang="ts">
import Icon from "@iconify/svelte";

/**
 * M3E 博客原子 — SearchPanel 搜索结果面板。
 * 数据驱动：results 为 { url, title, excerpt }[]（excerpt 可含 <mark> 高亮）；
 * placeholder 传入时渲染面板内胶囊搜索输入（移动端，hideInputOnDesktop 时 lg+ 隐藏）。
 * 开合 / 定位由调用方通过 class 控制（float-panel float-panel-closed + 定位类），
 * 与 DisplaySettings 面板同款约定，Layout 的点击外部关闭可直接复用。
 */
export interface SearchResultItem {
	url: string;
	title: string;
	excerpt: string;
}

let {
	results = [],
	query = $bindable(""),
	placeholder = "",
	hideInputOnDesktop = false,
	id = "",
	class: className = "",
}: {
	results?: SearchResultItem[];
	query?: string;
	placeholder?: string;
	hideInputOnDesktop?: boolean;
	id?: string;
	class?: string;
} = $props();
</script>

<div class="m3-blog-searchpanel {className}" {id}>
	{#if placeholder}
		<div
			class="m3-blog-searchpanel__input"
			class:m3-blog-searchpanel__input--hide-desktop={hideInputOnDesktop}
		>
			<Icon icon="material-symbols:search" />
			<input type="search" bind:value={query} {placeholder} aria-label={placeholder} />
		</div>
	{/if}
	{#each results as item, i (i)}
		<a class="m3-blog-searchpanel__item" href={item.url}>
			<span class="m3-blog-searchpanel__title">
				{item.title}
				<Icon icon="fa6-solid:chevron-right" />
			</span>
			<span class="m3-blog-searchpanel__excerpt">{@html item.excerpt}</span>
		</a>
	{/each}
</div>

<style lang="stylus">
@import "../../../styles/breakpoints.styl"
.m3-blog-searchpanel
	display: flex
	flex-direction: column
	width: max-content
	min-width: 18rem
	max-width: 30rem
	box-sizing: border-box
	padding: 0.5rem
	border-radius: var(--shape-corner-l)
	background: var(--float-panel-bg)
	color: var(--on-surface)
	box-shadow: var(--m3e-elevation-3)
	max-height: calc(100vh - 100px)
	overflow-y: auto

	/* 面板内搜索条（M3 胶囊填充式） */
	&__input
		display: flex
		align-items: center
		gap: 0.5rem
		height: 2.75rem
		margin-bottom: 0.25rem
		padding: 0 0.875rem
		border-radius: var(--shape-corner-full)
		background: var(--surface-container-high)
		> :global(svg)
			width: 1.25rem
			height: 1.25rem
			color: var(--on-surface-variant)
		> input
			flex: 1
			min-width: 0
			height: 100%
			border: none
			background: transparent
			color: var(--on-surface)
			font: var(--m3e-type-body-small)
			outline: none
			caret-color: var(--primary)
			&::placeholder
				color: var(--on-surface-variant)

		&--hide-desktop
			@media (min-width: bp-lg)
				display: none

	/* 结果项：标题（hover primary + 箭头）+ 摘要（<mark> 高亮） */
	&__item
		display: block
		padding: 0.5rem 0.75rem
		border-radius: var(--shape-corner-l)
		text-decoration: none
		transition: background-color var(--m3e-duration-short) var(--m3e-easing-standard)
		&:hover
			background: unquote("color-mix(in oklab, var(--on-surface) 6%, transparent)")
	&__item + &__item
		margin-top: 0.125rem

	&__title
		display: inline-flex
		align-items: center
		gap: 0.375rem
		font: var(--m3e-type-body-large)
		font-weight: 700
		color: var(--on-surface)
		transition: color var(--m3e-duration-short) var(--m3e-easing-standard)
		.m3-blog-searchpanel__item:hover &
			color: var(--primary)
		> :global(svg)
			width: 0.75rem
			height: 0.75rem
			color: var(--primary)
			transform: translateX(0.25rem)

	&__excerpt
		display: block
		margin-top: 0.125rem
		font: var(--m3e-type-body-small)
		color: var(--on-surface-variant)
		:global(mark)
			background: transparent
			color: var(--primary)
</style>
