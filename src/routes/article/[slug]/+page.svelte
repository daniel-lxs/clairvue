<script lang="ts">
	import { Separator } from '@/components/ui/separator';
	import type { PageData } from './$types';
	import * as Page from '@/components/page';
	import { Skeleton } from '@/components/ui/skeleton';
	import { onMount } from 'svelte';

	export let data: PageData;

	let fomattedDate: string;

	const formatArticleDate = async () => {
		const parsedArticle = await data.streamed.parsedArticle;
		if (parsedArticle?.publishedTime) {
			fomattedDate = new Date(parsedArticle?.publishedTime).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
				hour: 'numeric',
				minute: 'numeric'
			});
		} else if (data.article?.publishedAt) {
			fomattedDate = new Date(data.article?.publishedAt).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
				hour: 'numeric',
				minute: 'numeric'
			});
		}
	};

	onMount(() => {
		formatArticleDate();
	});

	//TODO: add a speed reading option in the future
</script>

<svelte:head>
	<title>{data.article?.title}</title>
</svelte:head>

<Page.Container>
	<div class="space-y-8 sm:px-0 sm:pt-10">
		{#await data.streamed.parsedArticle}
			<div class="space-y-6">
				<Skeleton class="h-6 w-48 rounded-md" />
				<Skeleton class="h-12 w-full rounded-md" />
				<Skeleton class="h-4 w-48 rounded-md" />
				<Skeleton class="h-4 w-32 rounded-md" />
			</div>

			<Separator class="my-6" />

			<div class="parsed-content">
				<div class="space-y-4">
					<Skeleton class="h-4 w-full rounded-md" />
					<Skeleton class="h-4 w-full rounded-md" />
					<Skeleton class="h-4 w-3/4 rounded-md" />
				</div>
			</div>
		{:then parsedArticle}
			<div class="space-y-6">
				<a
					class="font-bold text-primary hover:text-foreground hover:underline"
					href={data.article?.link}
					target="_blank">{data.article?.siteName}</a
				>
				<h1 class="text-3xl font-bold">{data.article?.title}</h1>
				{#if data.article?.author || parsedArticle?.byline}
					<p class="text-md text-muted-foreground" id="author">
						{data.article?.author || parsedArticle?.byline}
					</p>
				{/if}
				{#if fomattedDate}
					<p class="text-sm text-muted-foreground">{fomattedDate}</p>
				{/if}
				<!-- TODO: add read time based on length -->
			</div>

			<Separator class="my-6" />

			<div class="parsed-content">
				<article class="text-lg">
					{@html parsedArticle?.content}
				</article>
			</div>
		{/await}
	</div>
</Page.Container>

<style lang="postcss">
	/* Global Styles */
	.parsed-content :global(div) {
		@apply w-full text-base md:text-lg;
	}

	.parsed-content :global(h2),
	.parsed-content :global(h3) {
		@apply mb-4 text-xl md:text-2xl;
	}

	.parsed-content :global(h4) {
		@apply mb-4 text-lg md:text-xl;
	}

	.parsed-content :global(h5) {
		@apply mb-4;
	}

	.parsed-content :global(a) {
		@apply text-base text-primary hover:text-foreground hover:underline md:text-lg;
	}

	.parsed-content :global(p) {
		@apply mb-6 text-base md:text-lg;
	}

	/* List Styles */
	.parsed-content :global(ul) {
		@apply mb-4 list-disc pl-4 text-base md:text-lg;
	}

	.parsed-content :global(ul) :global(ul) {
		@apply mt-4 pl-4;
	}

	.parsed-content :global(ol) {
		@apply mb-2 list-decimal pl-4 text-base md:text-lg;
	}

	.parsed-content :global(li) {
		@apply mb-2 text-base md:text-lg;
	}

	/* Blockquote Styles */
	.parsed-content :global(blockquote) {
		@apply mb-4 rounded-md border-l-4 border-muted-foreground p-2 text-base md:text-lg;
	}

	.parsed-content :global(blockquote) :global(p) {
		@apply mb-0 p-2 text-base md:text-lg;
	}

	/* Horizontal Rule */
	.parsed-content :global(hr) {
		@apply my-4 border-t border-muted;
	}

	/* Table Styles */
	.parsed-content :global(table) {
		@apply mb-4 w-full table-auto;
	}

	.parsed-content :global(table) :global(tr) {
		@apply border border-muted;
	}

	.parsed-content :global(table) :global(td) {
		@apply border border-muted p-2;
	}

	.parsed-content :global(table) :global(th) {
		@apply p-2;
	}

	/* Figure and Image Styles */
	.parsed-content :global(figure) {
		@apply mb-6;
	}

	.parsed-content :global(figcaption) {
		@apply text-base md:text-lg;
	}

	.parsed-content :global(img) {
		@apply mb-4 bg-muted object-contain;
	}

	/* Code Styles */
	.parsed-content :global(pre) {
		@apply mb-4 overflow-x-auto rounded-lg bg-muted px-4 py-2 text-base md:text-lg;
	}

	/* Center Alignment */
	.parsed-content :global(center) {
		@apply mb-6;
	}

	/* SVG Styles */
	.parsed-content :global(svg) {
		@apply max-h-20 max-w-20;
	}

	/* Strong and Emphasis Styles */
	.parsed-content :global(strong) {
		@apply font-bold;
	}

	.parsed-content :global(em) {
		@apply italic;
	}

	/* Code Inline Styles */
	.parsed-content :global(code) {
		@apply rounded bg-muted px-1 py-0.5 font-mono;
	}

	/* Keyboard Styles */
	.parsed-content :global(kbd) {
		@apply rounded bg-muted px-1 py-0.5 font-mono;
	}

	/* Superscript and Subscript Styles */
	.parsed-content :global(sup) {
		@apply text-sm;
	}

	.parsed-content :global(sub) {
		@apply text-sm;
	}

	/* Definition List Styles */
	.parsed-content :global(dl) {
		@apply mb-4;
	}

	.parsed-content :global(dt) {
		@apply font-bold;
	}

	.parsed-content :global(dd) {
		@apply mb-2 ml-4;
	}

	/* Address Styles */
	.parsed-content :global(address) {
		@apply italic;
	}

	/* Mark Styles */
	.parsed-content :global(mark) {
		@apply bg-yellow-200 px-1;
	}

	/* Small Styles */
	.parsed-content :global(small) {
		@apply text-sm;
	}

	/* Outline Styles */
	.parsed-content :global(ins) {
		@apply underline;
	}

	.parsed-content :global(del) {
		@apply line-through;
	}

	/* Responsive Image Styles */
	.parsed-content :global(img) {
		@apply h-auto max-w-full;
	}
</style>
