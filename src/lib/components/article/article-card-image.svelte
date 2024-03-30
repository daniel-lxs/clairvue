<script lang="ts">
	import type { Article } from '@/server/data/schema';
	import missingImagePlaceholder from '@/assets/missing-img-placeholder.png?enhanced';
	import { Skeleton } from '../ui/skeleton';

	export let article: Article;
	export let imageLoaded = false;
	export let imageError = false;
	export let type = 'wide';
</script>

<div class="relative w-full overflow-hidden {type === 'square' ? 'rounded-lg' : 'rounded-t-lg'}">
	<a href="/article/{article.slug}" target="_blank">
		{#if imageLoaded || imageError}
			<enhanced:img
				src={!imageError && article.image ? article.image : missingImagePlaceholder}
				alt={article.title}
				loading="lazy"
				class="{imageError ? 'h-80' : 'h-full'} w-full bg-muted object-cover {type === 'square'
					? ' max-w-52'
					: ''}"
				on:load={() => {
					imageLoaded = true;
				}}
				on:error={() => {
					imageError = true;
				}}
			/>
		{:else}
			<Skeleton class="h-48 object-cover" />
		{/if}
	</a>
</div>
