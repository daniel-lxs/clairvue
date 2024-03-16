<script lang="ts">
	import { getArticlesByBoardId } from '@/api/article';
	import ArticleCard from '@/components/article/article-card.svelte';
	import PageContainer from '@/components/page/page-container.svelte';
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
	const newestArticleId = writable<string>();
	const perPage = 10;
	let isLoadingMore = false;
	let currentPage = 2; //Since I load 20 articles at first, we are starting at page 2
	let articles: Article[] = [];

	async function loadMoreArticles() {
		if (isLoadingMore || !data.board) return;

		isLoadingMore = true;

		const paginatedArticles = await getArticlesByBoardId(
			data.board.id,
			currentPage * perPage,
			perPage
		);
		if (!paginatedArticles) return;

		console.log(currentPage, isLoadingMore);

		articles = [...articles, ...paginatedArticles.items];
		currentPage += 1;
		isLoadingMore = false;
	}

	function handleScroll() {
		const scrollHeight = document.documentElement.scrollHeight;
		const scrollTop = document.documentElement.scrollTop;
		const clientHeight = document.documentElement.clientHeight;

		if (scrollTop + clientHeight >= scrollHeight * 0.8 && !isLoadingMore) {
			loadMoreArticles();
		}
	}

	function showNewArticles() {
		isLoading = true;
		const fetchNewArticles = async () => {
			if (!data.board) return;
			const newArticles = await getArticlesByBoardId(data.board.id, 0, 20);
			if (newArticles) {
				articles = newArticles.items;
				newestArticleId.set(newArticles.items[0].id);
			}
			isLoading = false;
			hasNewArticles = false;
		};
		fetchNewArticles();
	}

	async function checkNewArticles() {
		if (!data.board) return;
		const newArticles = await getArticlesByBoardId(data.board.id, 0, 5);
		if (newArticles?.items[0].id !== $newestArticleId) {
			hasNewArticles = true;
		}
	}

	onMount(() => {
		articles = data.articles?.items || [];
		isLoading = false;
		if (currentPage === 2) {
			newestArticleId.set(articles?.[0].id || '');
		}

		// Loop to check for new articles every minute
		setInterval(() => {
			checkNewArticles();
		}, 60 * 1000);

		window.addEventListener('scroll', handleScroll);
		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	});
</script>

<svelte:head>
	<title>Clairvue {data.board?.name ? `- ${data.board?.name}` : ''}</title>
</svelte:head>

<Page.Container>
	<Page.Header title={data.board?.name || 'Unnamed'} />
	<div class="space-y-4">
		{#if hasNewArticles}
			<div class="relative w-full" id="new-articles">
				<div class="flex justify-center">
					<Button
						class="text-md absolute inset-x-0 mx-auto rounded-full px-4 py-2 shadow-xl"
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
