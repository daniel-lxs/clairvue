<script lang="ts">
	import { onMount } from 'svelte';
	import PageContainer from '@/components/page-container.svelte';
	import ArticleCard from '@/components/article-card.svelte';
	import PageHeader from '@/components/page-header.svelte';
	import * as Pagination from '$lib/components/ui/pagination';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import type { PageData } from './$types';
	import { getArticlesByBoardId } from '@/api/article';
	import { goto } from '$app/navigation';
	import { Skeleton } from '@/components/ui/skeleton';

	export let data: PageData;

	let currentPage = data.page;
	let count = data.articles?.totalCount;
	let articles = data.articles?.items;
	let isLoading = true;

	const perPage = 20;
	const siblingCount = 1;

	async function onPageChange(page = 1) {
		if (!data.board) return;

		isLoading = true;

		// Set page on search params
		const searchParams = new URLSearchParams();
		searchParams.set('p', page.toString());
		const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
		goto(newUrl, { replaceState: true });

		const paginatedArticles = await getArticlesByBoardId(data.board.id, page);
		if (!paginatedArticles) return;

		articles = paginatedArticles.items;
		currentPage = page;
		isLoading = false;
	}

	onMount(() => {
		isLoading = false;
	});
</script>

<PageContainer>
	<PageHeader title={data.board?.name || 'Test'} />
	<div class="space-y-4">
		{#if isLoading}
			{#each { length: perPage } as _}
				<Skeleton class="h-48 w-full" />
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
