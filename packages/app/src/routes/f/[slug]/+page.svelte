<script lang="ts">
  import { countArticles, getArticlesByFeedId } from '@/api/article';
  import ArticleCard from '@/components/article/article-card.svelte';
  import * as Page from '@/components/page';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import type { Article } from '@/server/data/schema';
  import ArticleCardSkeleton from '@/components/article/article-card-skeleton.svelte';
  import NewArticlesButton from '@/components/collection/new-articles-button.svelte';
  import { afterNavigate, beforeNavigate } from '$app/navigation';

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
  let feedDomain = $derived(
    data.feed.link.startsWith('default-') ? '' : new URL(data.feed.link).host
  );

  // Save the current state before navigating away
  beforeNavigate(({ to }) => {
    if (to?.url.pathname.includes('/article/')) {
      savedScrollPosition = window.scrollY;
      sessionStorage.setItem('feed_articles_' + data.feed.id, JSON.stringify(articles));
      sessionStorage.setItem('feed_scroll_' + data.feed.id, savedScrollPosition.toString());
      sessionStorage.setItem('feed_reached_end_' + data.feed.id, hasReachedEnd.toString());
    }
  });

  // Restore the state when navigating back
  afterNavigate(({ type }) => {
    if (type === 'popstate') {
      const savedArticles = sessionStorage.getItem('feed_articles_' + data.feed.id);
      const savedScroll = sessionStorage.getItem('feed_scroll_' + data.feed.id);
      const savedReachedEnd = sessionStorage.getItem('feed_reached_end_' + data.feed.id);

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
      sessionStorage.removeItem('feed_articles_' + data.feed.id);
      sessionStorage.removeItem('feed_scroll_' + data.feed.id);
      sessionStorage.removeItem('feed_reached_end_' + data.feed.id);
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
    const { items: fetchedArticles } = await getArticlesByFeedId(
      data.feed.id,
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
    newArticlesCount = (await countArticles(articles[0].publishedAt, data.feed.id)) || 0;
  };

  onMount(() => {
    const savedArticles = sessionStorage.getItem('feed_articles_' + data.feed.id);
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
  <title>{newArticlesCount > 0 ? `(${newArticlesCount}) ` : ''}{data.feed?.name} - Clairvue</title>
</svelte:head>

<main class="flex h-[calc(100vh-3.5rem)] w-full">
  <div class="flex-1">
    <Page.Container>
      <div class="flex w-full flex-col">
        {#if newArticlesCount > 0}
          <NewArticlesButton on:click={showNewArticles} />
        {/if}
        <Page.Header title={data.feed?.name || 'Unnamed'} subtitle={feedDomain} />
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
      </div>
    </Page.Container>
  </div>
</main>
