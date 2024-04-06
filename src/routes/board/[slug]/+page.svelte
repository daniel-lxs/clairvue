<script lang="ts">
  import { getArticlesByBoardId } from '@/api/article';
  import ArticleCard from '@/components/article/article-card.svelte';
  import * as Page from '@/components/page';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import type { Article } from '@/server/data/schema';
  import ArticleCardSkeleton from '@/components/article/article-card-skeleton.svelte';
  import NewArticlesButton from '@/components/board/new-articles-button.svelte';

  export let data: PageData;

  let isLoading = true;
  let hasNewArticles = false;
  const perPage = 10;
  let isLoadingMore = false;
  let currentPage = 2; // Since we load 20 articles at first, we are starting at page 2
  let articles: Article[] = [];

  const getArticles = async () => {
    try {
      articles = (await data.streamed.articles)?.items || [];
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      isLoading = false;
    }
  };

  const fetchArticles = async (limit: number, afterPublishedAt: Date | string = new Date()) => {
    const { items: fetchedArticles } = await getArticlesByBoardId(
      data.board.id,
      afterPublishedAt,
      limit
    );

    return fetchedArticles || [];
  };

  // Separate function for loading more articles
  const loadMoreArticles = async () => {
    if (isLoadingMore) return;

    isLoadingMore = true;

    const newArticles = await fetchArticles(perPage, articles[articles.length - 1].publishedAt);
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
    scrollTo(0, 0);

    const initialArticleLimit = 20;
    const newArticles = await fetchArticles(initialArticleLimit);
    if (newArticles.length) {
      articles = newArticles;
    }

    isLoading = false;
  };

  const checkNewArticles = async () => {
    const newArticlesLimit = 5;
    const newArticles = await fetchArticles(newArticlesLimit);
    if (newArticles.some((newArticle, index) => newArticle.id !== articles[index].id)) {
      hasNewArticles = true;
    }
  };

  onMount(() => {
    getArticles();

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
  <div class="fixed top-0 z-10">
    {#if hasNewArticles}
      <NewArticlesButton on:click={showNewArticles} />
    {/if}
  </div>

  <Page.Header
    title={data.board?.name || 'Unnamed'}
    subtitle={data.board.feeds
      ? `Showing articles from ${data.board.feeds.length} feeds`
      : undefined}
  />

  <div class="space-y-4 sm:space-y-6 sm:px-0">
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
