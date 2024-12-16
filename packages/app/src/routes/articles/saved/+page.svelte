<script lang="ts">
  import { getSavedArticles } from '$lib/api/article';
  import ArticleCard from '@/components/article/article-card.svelte';
  import * as Page from '@/components/page';
  import { onMount } from 'svelte';
  import ArticleCardSkeleton from '@/components/article/article-card-skeleton.svelte';
  import { showToast, normalizeError } from '$lib/utils';
  import { type ArticleWithInteraction } from '@clairvue/types';
  import { collectionsStore } from '@/stores/collections';
  import { feedsStore } from '@/stores/feeds';
  import NavigationSidebar from '@/components/navigation/navigation-sidebar.svelte';
  import PageSkeleton from '@/components/page-skeleton.svelte';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let collections = $state($collectionsStore);
  let feeds = $state($feedsStore);
  let isLoading = $state(true);
  let articles: ArticleWithInteraction[] = $state([]);

  const perPage = 10;
  let skip = 0;
  let hasReachedEnd = false;
  let isLoadingMore = $state(false);

  const getArticles = async () => {
    try {
      const result = await getSavedArticles(perPage, skip);
      result.match({
        ok: (a) => {
          if (a && a.length > 0) {
            articles = [...articles, ...a];
          } else {
            hasReachedEnd = true;
          }
        },
        err: (error) => {
          showToast('There was an error', error.message, 'error');
        }
      });
    } catch (e) {
      const error = normalizeError(e);
      console.error('Error occurred while getting saved articles:', error);
      showToast('There was an error', error.message, 'error');
    } finally {
      isLoading = false;
    }
  };

  const loadMoreArticles = async () => {
    if (isLoadingMore || hasReachedEnd) return;

    isLoadingMore = true;
    skip += perPage;

    await getArticles();

    isLoadingMore = false;
  };

  // Scroll event handler
  const handleScroll = () => {
    if (hasReachedEnd || isLoadingMore) return;

    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = document.documentElement.scrollTop;
    const clientHeight = document.documentElement.clientHeight;
    if (scrollTop + clientHeight >= scrollHeight * 0.8) {
      loadMoreArticles();
    }
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
    getArticles();
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  });
</script>

<svelte:head>
  <title>Saved Articles - Clairvue</title>
</svelte:head>

{#snippet sidebar()}
  <NavigationSidebar class="mt-2.5" {collections} {feeds} />
{/snippet}

{#snippet content()}
  <div class="flex w-full flex-col sm:pt-2.5">
    <Page.Header title="Saved Articles" />
    <div class="w-full space-y-4 sm:space-y-6 sm:px-0">
      {#if isLoading}
        {#each { length: 10 } as _}
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
        <p>No saved articles found</p>
      {/if}
    </div>
  </div>
{/snippet}

<PageSkeleton {sidebar} {content} />
