<script lang="ts">
	import type { Article } from '@/server/data/schema';
	import { Skeleton } from './ui/skeleton';

	export let article: Article;

	export let imageLoaded = false;
	export let imageError = false;
</script>

<div class="relative h-48 w-full overflow-hidden rounded-lg">
	{#if !imageLoaded}
		<Skeleton class="h-full w-full object-cover" />
	{/if}
	<a href="/article/{article.id}">
		<img
			src={article.image}
			alt={article.title}
			loading="lazy"
			class="h-full w-full object-cover opacity-0 blur-md transition-opacity {imageLoaded
				? 'opacity-100'
				: ''}"
			style="height: 100%; width: 100%;"
			on:load={() => {
				imageLoaded = true;
			}}
			on:error={() => {
				imageError = true;
			}}
		/>
	</a>

	<a href="/article/{article.id}">
		<img
			src={article.image}
			alt={article.title}
			loading="lazy"
			class="absolute inset-0 h-full w-full object-contain opacity-0 transition-opacity {imageLoaded
				? 'opacity-100'
				: ''}"
			on:load={() => {
				imageLoaded = true;
			}}
			on:error={() => {
				imageError = true;
			}}
		/>
	</a>
</div>
