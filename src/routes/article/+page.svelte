<script lang="ts">
	import { Separator } from '../../lib/components/ui/separator';
	import type { PageData } from './$types';
	export let data: PageData;

	let fomattedDate: string;

	if (data.post?.publishedTime) {
		fomattedDate = new Date(data.post?.publishedTime).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: 'numeric',
			minute: 'numeric'
		});
	}
</script>

<div class="container mx-auto max-w-screen-lg pt-20">
	<div class="space-y-8">
		<div class="space-y-6">
			<a class="font-bold text-primary" href={data.post?.url} target="_blank">{data.post?.domain}</a
			>
			<h1 class="text-3xl font-bold">{data.post?.title}</h1>

			{#if data.post?.byline}
				<p class="text-md text-muted-foreground">{data.post?.byline}</p>
			{/if}

			{#if data.post?.publishedTime && fomattedDate}
				<p class="text-sm text-muted-foreground">{fomattedDate}</p>
			{/if}
			<!--TODO: add read time based on length-->
		</div>
		<Separator class="my-6" />
		<div class="parsed-content">
			<article>
				{@html data.post?.content}
			</article>
		</div>
	</div>
</div>

<style lang="postcss">
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
		@apply mb-4 text-lg font-bold;
	}

	.parsed-content :global(ul) {
		@apply mb-4 list-inside list-disc;
	}

	.parsed-content :global(ul) :global(ul:first-child) {
		@apply mt-4 pl-4;
	}

	.parsed-content :global(ol) {
		@apply mb-2 list-inside list-decimal;
	}

	.parsed-content :global(li) {
		@apply mb-2;
	}

	.parsed-content :global(p) {
		@apply mb-6 text-lg;
	}

	@media screen and (max-width: 640px) {
		.parsed-content :global(p) {
			@apply text-base;
		}
	}

	.parsed-content :global(a) {
		@apply text-primary underline;
	}

	.parsed-content :global(blockquote) {
		@apply mb-4 rounded-l border-l-4 border-muted-foreground p-2;
	}

	.parsed-content :global(blockquote) :global(p:first-child) {
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
</style>
