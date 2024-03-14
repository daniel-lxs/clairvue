<script lang="ts">
	import type { Article } from '@/server/data/schema';
	import { Skeleton } from './ui/skeleton';

	export let article: Article;

	export let imageLoaded = false;
	export let imageError = false;
	export let objectType = 'cover';

	//timeout for images that dont load
	setTimeout(() => {
		if (!imageLoaded) {
			imageError = true;
		}
	}, 10000);
</script>

<div class="relative w-full overflow-hidden rounded-b-lg">
	<a href="/article/{article.id}">
		{#if !imageLoaded}
			<Skeleton class="h-48 object-cover" />
		{:else if !imageError}
			<img
				src={article.image}
				alt={article.title}
				loading="lazy"
				class="h-full w-full bg-muted {objectType === 'cover'
					? 'object-cover'
					: 'max-h-48 min-w-36 object-contain'} opacity-0 transition-opacity {imageLoaded
					? 'opacity-100'
					: ''}"
				on:error={() => {
					imageError = true;
				}}
			/>
		{/if}
	</a>
</div>
