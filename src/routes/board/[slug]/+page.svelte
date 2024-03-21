<script lang="ts">
	import { getArticlesByBoardId } from '@/api/article';
	import ArticleCard from '@/components/article/article-card.svelte';
	import * as Page from '@/components/page';
	import Button from '@/components/ui/button/button.svelte';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { writable } from 'svelte/store';
	import type { Article } from '@/server/data/schema';
	import ArticleCardSkeleton from '@/components/article/article-card-skeleton.svelte';

	export let data: PageData;

	let isLoading = true;
	let hasNewArticles = false;
	const perPage = 10;
	let isLoadingMore = false;
	let currentPage = 2; // Since we load 20 articles at first, we are starting at page 2
	let articles: Article[] = [];

	const fetchArticles = async (page: number, limit: number) => {
		const { items: fetchedArticles } = await getArticlesByBoardId(
			data.board.id,
			page * limit,
			limit
		);

		return fetchedArticles || [];
	};

	// Separate function for loading more articles
	const loadMoreArticles = async () => {
		if (isLoadingMore) return;

		isLoadingMore = true;

		const newArticles = await fetchArticles(currentPage, perPage);
		articles = [...articles, ...newArticles];
		currentPage += 1;

		isLoadingMore = false;
	};

	// Scroll event handler
	const handleScroll = () => {
		const scrollHeight = document.documentElement.scrollHeight;
		const scrollTop = document.documentElement.scrollTop;
		const clientHeight = document.documentElement.clientHeight;

		if (scrollTop + clientHeight >= scrollHeight * 0.8 && !isLoadingMore) {
			loadMoreArticles();
		}
	};

	const showNewArticles = async () => {
		hasNewArticles = false;
		isLoading = true;

		const newArticles = await fetchArticles(0, 20);
		if (newArticles.length) {
			articles = newArticles;
		}

		isLoading = false;
	};

	const checkNewArticles = async () => {
		const newArticles = await fetchArticles(0, 5);
		if (articles.some((article, index) => article.id !== newArticles[index].id)) {
			hasNewArticles = true;
		}
	};

	onMount(() => {
		articles = data.articles?.items || [];
		isLoading = false;

		// Check for new articles every minute
		const intervalId = setInterval(checkNewArticles, 60 * 1000);

		// Set up scroll event listener
		window.addEventListener('scroll', handleScroll);

		// Clean up event listeners on component unmount
		return () => {
			clearInterval(intervalId);
			window.removeEventListener('scroll', handleScroll);
		};
	});
</script>

<svelte:head>
	<title>{data.board.name} - Clairvue</title>
</svelte:head>

<Page.Container>
	<Page.Header
		title={data.board?.name || 'Unnamed'}
		subtitle={data.board.rssFeeds
			? `Showing articles from ${data.board.rssFeeds.length} feeds`
			: undefined}
	/>
	<div class="space-y-4 sm:space-y-6 sm:px-0">
		{#if hasNewArticles}
			<div class="relative w-full" id="new-articles">
				<div class="flex justify-center">
					<Button
						class="text-md absolute inset-x-0 z-10 mx-auto rounded-full px-4 py-2 shadow-xl"
						on:click={showNewArticles}
					>
						Show new articles
					</Button>
				</div>
			</div>
		{/if}

		{#if isLoading}
			{#each { length: perPage } as _}
				<ArticleCardSkeleton />
			{/each}
		{:else if articles && articles.length > 0}
			{#each articles as article}
				<ArticleCard {article} />
			{/each}

			{#if isLoadingMore}
				<ArticleCardSkeleton />
			{/if}
		{:else}
			<p>No articles found</p>
		{/if}
	</div>
</Page.Container>
