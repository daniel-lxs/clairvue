<script lang="ts">
	import { goto } from '$app/navigation';
	import { getArticlesByBoardId } from '@/api/article';
	import ArticleCard from '@/components/article-card.svelte';
	import PageContainer from '@/components/page-container.svelte';
	import PageHeader from '@/components/page-header.svelte';
	import Button from '@/components/ui/button/button.svelte';
	import * as Pagination from '@/components/ui/pagination';
	import { Skeleton } from '@/components/ui/skeleton';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { writable } from 'svelte/store';

	export let data: PageData;
	let count = data.articles?.totalCount;
	let isLoading = true;
	let hasNewArticles = false;

	const newestArticleId = writable<string>();

	const perPage = 20;
	const siblingCount = 1;

	$: currentPage = data.page;
	$: articles = data.articles?.items;

	async function onPageChange(page = 1) {
		if (!data.board) return;

		isLoading = true;

		// Set page on search params
		const searchParams = new URLSearchParams();
		searchParams.set('p', page.toString());
		const newUrl = `${window.location.pathname}?${searchParams.toString()}`;

		const paginatedArticles = await getArticlesByBoardId(data.board.id, page);
		if (!paginatedArticles) return;

		// Dont show the search param if the page is 1
		if (page !== 1) {
			goto(newUrl, { replaceState: true });
		} else {
			goto(window.location.pathname, { replaceState: true });
			newestArticleId.set(paginatedArticles.items[0].id);
		}

		articles = paginatedArticles.items;
		currentPage = page;
		isLoading = false;
	}

	function showNewArticles() {
		onPageChange(1);
		currentPage = 1;
		hasNewArticles = false;
	}

	async function checkNewArticles() {
		if (!data.board) return;
		const newArticles = await getArticlesByBoardId(data.board.id, 1);

		if (newArticles?.items[0].id !== $newestArticleId) {
			hasNewArticles = true;
		}
	}

	onMount(() => {
		isLoading = false;

		if (currentPage === 1) {
			newestArticleId.set(articles?.[0].id || '');
		}

		// Loop to check for new articles every minute
		setInterval(() => {
			checkNewArticles();
		}, 60 * 1000);
	});
	//TODO: create skeleton card components
</script>

<PageContainer>
	<PageHeader title={data.board?.name || 'Test'} />
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
				<Skeleton class="h-96 w-full" />
			{/each}
		{:else if articles && count && articles.length > 0}
			{#each articles as article}
				<ArticleCard {article} />
			{/each}

			<Pagination.Root
				{count}
				{perPage}
				{siblingCount}
				let:pages
				page={currentPage}
				let:currentPage
			>
				<Pagination.Content>
					<Pagination.Item>
						<Pagination.PrevButton
							on:click={() => onPageChange(currentPage ? currentPage - 1 : undefined)}
						>
							<ChevronLeft class="h-4 w-4" />
							<span class="hidden sm:block">Previous</span>
						</Pagination.PrevButton>
					</Pagination.Item>
					{#each pages as page (page.key)}
						{#if page.type === 'ellipsis'}
							<Pagination.Item>
								<Pagination.Ellipsis />
							</Pagination.Item>
						{:else}
							<Pagination.Item>
								<Pagination.Link
									{page}
									isActive={currentPage == page.value}
									on:click={() => onPageChange(page.value)}
								>
									{page.value}
								</Pagination.Link>
							</Pagination.Item>
						{/if}
					{/each}
					<Pagination.Item>
						<Pagination.NextButton
							on:click={() => onPageChange(currentPage ? currentPage + 1 : undefined)}
						>
							<span class="hidden sm:block">Next</span>
							<ChevronRight class="h-4 w-4" />
						</Pagination.NextButton>
					</Pagination.Item>
				</Pagination.Content>
			</Pagination.Root>
		{:else}
			<p>No articles found</p>
		{/if}
	</div>
</PageContainer>
