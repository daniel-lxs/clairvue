<script lang="ts">
	import { Separator } from '../../lib/components/ui/separator';
	import type { PageData } from './$types';
	export let data: PageData;
</script>

<div class="container mx-auto max-w-screen-lg pt-20">
	<div class="space-y-8">
		<div class="space-y-6">
			<a href={data.post?.url} target="_blank">{data.post?.url}</a>
			<h1 class="text-3xl font-bold">{data.post?.title}</h1>
			<p class="text-md text-muted-foreground">{data.post?.byline}</p>
			{#if data.post?.publishedTime}
				<p class="text-sm text-muted-foreground">{data.post?.publishedTime}</p>
			{/if}
			<!--TODO: add read time based on length-->
		</div>
		<Separator class="my-6" />
		<article>
			{@html data.post?.content}
		</article>
	</div>
</div>
