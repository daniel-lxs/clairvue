<script lang="ts">
  import { countArticles, getArticlesByBoardId } from '@/api/article';
  import ArticleCard from '@/components/article/article-card.svelte';
  import * as Page from '@/components/page';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import type { Article } from '@/server/data/schema';
  import ArticleCardSkeleton from '@/components/article/article-card-skeleton.svelte';
  import NewArticlesButton from '@/components/board/new-articles-button.svelte';
  import { beforeNavigate, afterNavigate } from '$app/navigation';
  import Button from '@/components/ui/button/button.svelte';
  import MoreHorizontal from 'lucide-svelte/icons/more-horizontal';
  import * as Tooltip from '@/components/ui/tooltip';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let isLoading = $state(true);
  let newArticlesCount = $state(0);
  const perPage = 10;
  let isLoadingMore = $state(false);
  let currentPage = 2; // Since we load 20 articles at first, we are starting at page 2
  let articles: Article[] = $state([]);
  let savedScrollPosition = 0;
  let hasReachedEnd = false;

  // Save the current state before navigating away
  beforeNavigate(({ to }) => {
    if (to?.url.pathname.includes('/article/')) {
      savedScrollPosition = window.scrollY;
      sessionStorage.setItem('board_articles_' + data.board.id, JSON.stringify(articles));
      sessionStorage.setItem('board_scroll_' + data.board.id, savedScrollPosition.toString());
      sessionStorage.setItem('board_reached_end_' + data.board.id, hasReachedEnd.toString());
    }
  });

  // Restore the state when navigating back
  afterNavigate(({ type }) => {
    if (type === 'popstate') {
      const savedArticles = sessionStorage.getItem('board_articles_' + data.board.id);
      const savedScroll = sessionStorage.getItem('board_scroll_' + data.board.id);
      const savedReachedEnd = sessionStorage.getItem('board_reached_end_' + data.board.id);

      if (savedArticles) {
        articles = JSON.parse(savedArticles);
        isLoading = false;
      }

      if (savedReachedEnd) {
        hasReachedEnd = savedReachedEnd === 'true';
      }

      if (savedScroll) {
        setTimeout(() => {
          window.scrollTo(0, parseInt(savedScroll));
        }, 0);
      }
    } else if (type === 'enter') {
      getArticles();
      sessionStorage.removeItem('board_articles_' + data.board.id);
      sessionStorage.removeItem('board_scroll_' + data.board.id);
      sessionStorage.removeItem('board_reached_end_' + data.board.id);
    }
  });

  const getArticles = async () => {
    try {
      articles = (await data.streamed.articles)?.items || [];
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      isLoading = false;
    }
  };

  const fetchArticles = async (limit: number, beforePublishedAt: Date | string = new Date()) => {
    const { items: fetchedArticles } = await getArticlesByBoardId(
      data.board.id,
      beforePublishedAt,
      limit
    );

    return fetchedArticles || [];
  };

  // Separate function for loading more articles
  const loadMoreArticles = async () => {
    if (isLoadingMore || hasReachedEnd) return;

    isLoadingMore = true;

    const newArticles = await fetchArticles(perPage, articles[articles.length - 1].publishedAt);
    if (newArticles.length === 0) {
      hasReachedEnd = true;
    } else {
      articles = [...articles, ...newArticles];
      currentPage += 1;
    }

    isLoadingMore = false;
  };

  // Scroll event handler
  const handleScroll = () => {
    if (hasReachedEnd) return;

    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = document.documentElement.scrollTop;
    const clientHeight = document.documentElement.clientHeight;

    if (scrollTop + clientHeight >= scrollHeight * 0.8 && !isLoadingMore) {
      loadMoreArticles();
    }
  };

  const showNewArticles = async () => {
    newArticlesCount = 0;
    isLoading = true;
    scrollTo(0, 0);

    const initialArticleLimit = 20;
    const newArticles = await fetchArticles(initialArticleLimit);
    if (newArticles.length) {
      articles = newArticles;
    }

    isLoading = false;
  };

  const checkNewArticles = async () => {
    newArticlesCount =
      (await countArticles(articles[0].publishedAt, undefined, data.board.id)) ?? 0;
  };

  onMount(() => {
    const savedArticles = sessionStorage.getItem('board_articles_' + data.board.id);
    if (savedArticles) {
      articles = JSON.parse(savedArticles);
      isLoading = false;
      checkNewArticles();
    } else {
      getArticles();
    }

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
  <title>{newArticlesCount > 0 ? `(${newArticlesCount}) ` : ''}{data.board?.name} - Clairvue</title>
</svelte:head>

{#snippet title()}
  <div class="flex w-full justify-between">
    <h1 class="text-xl font-bold sm:text-3xl">{data.board?.name}</h1>
    <Tooltip.Root>
      <Button
        title="Edit feed collection"
        href="/boards/edit/{data.board.slug}"
        variant="ghost"
        size="icon"
      >
        <MoreHorizontal class="h-6 w-6" />
      </Button>
      <Tooltip.Content>
        <p class="text-xs leading-4">Edit feed collection</p>
      </Tooltip.Content>
    </Tooltip.Root>
  </div>
{/snippet}

<Page.Container>
  {#if newArticlesCount > 0}
    <NewArticlesButton on:click={showNewArticles} />
  {/if}
  <Page.Header
    {title}
    subtitle={data.board.feeds
      ? `Showing articles from ${data.board.feeds.length} feeds`
      : undefined}
  />
  <div class="w-full space-y-4 sm:space-y-6 sm:px-0">
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
