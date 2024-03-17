<script lang="ts">
	import type { Article } from '@/server/data/schema';

	export let article: Article;

	export let imageLoaded = false;
	export let imageError = false;
	export let objectType = 'cover';
</script>

<div
	class="relative w-full overflow-hidden {objectType === 'contain' ? 'rounded-lg' : 'rounded-t-lg'}"
>
	<a href="/article/{article.id}">
		<img
			src={article.image}
			alt={article.title}
			loading="lazy"
			class="h-full w-full bg-muted {objectType === 'cover'
				? 'object-cover'
				: 'max-h-48 min-w-36 object-contain'} opacity-0 transition-opacity {imageLoaded
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
