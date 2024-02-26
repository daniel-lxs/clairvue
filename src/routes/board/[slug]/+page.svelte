<script lang="ts">
	import PageContainer from '@/components/page-container.svelte';
	import ArticleCard from '@/components/article-card.svelte';
	import PageHeader from '@/components/page-header.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<PageContainer>
	<PageHeader title={data.board?.name || 'Test'} />
	<div class="space-y-2">
		{#if data.articles && data.articles.length > 0}
			{#each data.articles as article}
				<ArticleCard {article} rssFeedName="Test" />
			{/each}
		{:else}
			<p>No articles found</p>
		{/if}
	</div></PageContainer
>
