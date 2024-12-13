<script lang="ts">
  import { countArticlesByFeedId, getArticlesByFeedId } from '$lib/api/article';
  import ArticleCard from '@/components/article/article-card.svelte';
  import * as Page from '@/components/page';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import ArticleCardSkeleton from '@/components/article/article-card-skeleton.svelte';
  import NewArticlesButton from '@/components/collection/new-articles-button.svelte';
  import { afterNavigate, beforeNavigate } from '$app/navigation';
  import { type ArticleWithInteraction } from '@clairvue/types';
  import { showToast, normalizeError } from '$lib/utils';
  import { collectionsStore } from '@/stores/collections';
  import { feedsStore } from '@/stores/feeds';
  import NavigationSidebar from '@/components/navigation/navigation-sidebar.svelte';
  import PageSkeleton from '@/components/page-skeleton.svelte';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let collections = $state($collectionsStore);
  let feeds = $state($feedsStore);

  let isLoading = $state(true);
  let newArticlesCount = $state(0);
  const perPage = 10;
  let isLoadingMore = $state(false);
  let currentPage = 2; // Since we load 20 articles at first, we are starting at page 2
  let articles: ArticleWithInteraction[] = $state([]);
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
      articles = (await data.streamed.articles).items;
    } catch (e) {
      const errror = normalizeError(e);
      console.error('Error occurred while getting articles:', errror);
      showToast('There was an error', errror.message, 'error');
    } finally {
      isLoading = false;
    }
  };

  const fetchArticles = async (limit: number, beforePublishedAt: Date | string = new Date()) => {
    const result = await getArticlesByFeedId(data.feed.id, beforePublishedAt, limit);

    return result.match({
      ok: (a) => a.items,
      err: (error) => {
        showToast('There was an error', error.message, 'error');
        return undefined;
      }
    });
  };

  // Separate function for loading more articles
  const loadMoreArticles = async () => {
    if (isLoadingMore || hasReachedEnd) return;

    isLoadingMore = true;

    const newArticles = await fetchArticles(perPage, articles[articles.length - 1].publishedAt);

    if (newArticles && newArticles.length > 0) {
      articles = [...articles, ...newArticles];
      currentPage += 1;
    } else {
      hasReachedEnd = true;
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
    if (newArticles && newArticles.length > 0) {
      articles = newArticles;
    }

    isLoading = false;
  };

  const checkNewArticles = async () => {
    const countArticlesResult = await countArticlesByFeedId(
      data.feed.id,
      articles[0].publishedAt
    );
    countArticlesResult.match({
      ok: (value) => (newArticlesCount = value.count),
      err: (error) => {
        showToast('There was an error', error.message, 'error');
      }
    });
  };

  $effect(() => {
    collectionsStore.subscribe((value) => {
      collections = value;
    });

    feedsStore.subscribe((value) => {
      feeds = value;
    });
  });

  onMount(() => {
    const savedArticles = sessionStorage.getItem('feed_articles_' + data.feed.id);
    if (savedArticles) {
      articles = JSON.parse(savedArticles);
      checkNewArticles();
      isLoading = false;
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

{#snippet sidebar()}
  <NavigationSidebar class="mt-2.5" {collections} {feeds} />
{/snippet}

{#snippet content()}
  <div class="flex w-full flex-col sm:pt-2.5">
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
          <ArticleCard {article} feed={data.feed} />
        {/each}
        {#if isLoadingMore}
          <ArticleCardSkeleton />
        {/if}
      {:else}
        <p>No articles found</p>
      {/if}
    </div>
  </div>
{/snippet}

<PageSkeleton {sidebar} {content} />
