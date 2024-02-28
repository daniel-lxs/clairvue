<script lang="ts">
	import PageContainer from '@/components/page-container.svelte';
	import ArticleCard from '@/components/article-card.svelte';
	import PageHeader from '@/components/page-header.svelte';
	import * as Pagination from '$lib/components/ui/pagination';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import type { PageData } from './$types';
	import { getArticlesByBoardId } from '@/api/article';

	export let data: PageData;

	//const isDesktop = mediaQuery("(min-width: 768px)");

	let count = data.articles?.totalCount;
	$: perPage = 20;
	$: siblingCount = 1;

	$: articles = data.articles?.items;

	async function onPageChange(page: number | undefined = 1) {
		if (!data.board) return;
		const paginatedArticles = await getArticlesByBoardId(data.board.id, page);
		if (!paginatedArticles) return;
		articles = paginatedArticles.items;
	}
</script>

<PageContainer>
	<PageHeader title={data.board?.name || 'Test'} />
	<div class="space-y-4">
		{#if articles && count && articles.length > 0}
			{#each articles as article}
				<ArticleCard {article} />
			{/each}

			<Pagination.Root {count} {perPage} {siblingCount} let:pages let:currentPage>
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
	</div></PageContainer
>
