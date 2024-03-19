<script lang="ts">
	import { Separator } from '@/components/ui/separator';
	import type { PageData } from './$types';
	import * as Page from '@/components/page';

	export let data: PageData;

	let fomattedDate: string;

	if (data.parsedArticle?.publishedTime) {
		fomattedDate = new Date(data.parsedArticle?.publishedTime).toLocaleDateString('en-US', {
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

	//TODO: add a speed reading option in the future
</script>

<svelte:head>
	<title>{data.article?.title}</title>
</svelte:head>

<Page.Container>
	<div class="space-y-8 sm:pt-10">
		//TODO: fix
		<div class="space-y-6">
			<a
				class="font-bold text-primary hover:text-foreground hover:underline"
				href={data.article?.link}
				target="_blank">{data.article?.siteName}</a
			>
			<h1 class="text-3xl font-bold">{data.article?.title}</h1>

			{#if data.article?.author || data.parsedArticle?.byline}
				<p class="text-md text-muted-foreground" id="author">
					{data.article.author || data.parsedArticle.byline}
				</p>
			{/if}

			{#if fomattedDate}
				<p class="text-sm text-muted-foreground">{fomattedDate}</p>
			{/if}
			<!--TODO: add read time based on length-->
		</div>
		<Separator class="my-6" />
		<div class="parsed-content">
			<article class="text-lg">
				{@html data.parsedArticle?.content}
			</article>
		</div>
	</div>
</Page.Container>

<style lang="postcss">
	.parsed-content :global(div) {
		@apply w-full;
	}

	.parsed-content :global(h2) {
		@apply mb-4 text-2xl font-bold;
	}

	.parsed-content :global(h3) {
		@apply mb-4 text-2xl font-bold;
	}

	.parsed-content :global(h4) {
		@apply mb-4 text-xl font-bold;
	}

	.parsed-content :global(h5) {
		@apply mb-4 font-bold;
	}

	.parsed-content :global(ul) {
		@apply mb-4 list-disc pl-4;
	}

	.parsed-content :global(ul) :global(ul) {
		@apply mt-4 pl-4;
	}

	.parsed-content :global(ol) {
		@apply mb-2 list-decimal pl-4;
	}

	.parsed-content :global(li) {
		@apply mb-2;
	}

	.parsed-content :global(p) {
		@apply mb-6;
	}

	@media screen and (max-width: 640px) {
		.parsed-content :global(p) {
			@apply text-base;
		}
	}

	.parsed-content :global(a) {
		@apply text-primary hover:text-foreground hover:underline;
	}

	.parsed-content :global(blockquote) {
		@apply mb-4 rounded-md border-l-4 border-muted-foreground p-2;
	}

	.parsed-content :global(blockquote) :global(p) {
		@apply mb-0 p-2;
	}

	.parsed-content :global(hr) {
		@apply my-4 border-t border-muted;
	}

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

	.parsed-content :global(figure) {
		@apply mb-6;
	}

	.parsed-content :global(figcaption) {
		@apply text-lg;
	}

	.parsed-content :global(img) {
		@apply mb-4 bg-muted object-contain;
	}

	.parsed-content :global(pre) {
		@apply mb-4 overflow-x-auto rounded-lg bg-muted px-4 py-2;
	}

	.parsed-content :global(center) {
		@apply mb-6;
	}

	.parsed-content :global(svg) {
		@apply max-h-20 max-w-20;
	}
</style>
