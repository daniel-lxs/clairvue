<script lang="ts">
	import type { Article } from '@/server/data/schema';

	export let article: Article;
	export let imageLoaded = false;
	export let imageError = false;
	export let type = 'wide';
</script>

<div class="relative w-full overflow-hidden {type === 'square' ? 'rounded-lg' : 'rounded-t-lg'}">
	<a href="/article/{article.slug}" target="_blank">
		<img
			src={article.image}
			alt={article.title}
			loading="lazy"
			class="h-full w-full bg-muted object-contain {type === 'square' ? 'max-h-48 max-w-52' : ''}"
			on:load={() => {
				imageLoaded = true;
			}}
			on:error={() => {
				imageError = true;
			}}
		/>
	</a>
</div>
