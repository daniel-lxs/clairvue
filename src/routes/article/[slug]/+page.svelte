<script lang="ts">
  import { Separator } from '@/components/ui/separator';
  import type { PageData } from './$types';
  import { onMount } from 'svelte';
  import ArticlePageSkeleton from '@/components/article/article-page-skeleton.svelte';
  import { BookOpen } from 'lucide-svelte';
  import { fontSize } from '@/stores/font-size';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let fomattedDate: string = $state('');

  const formatArticleDate = async () => {
    const parsedArticle = await data.streamed.parsedArticle;
    if (parsedArticle?.publishedTime) {
      fomattedDate = new Date(parsedArticle?.publishedTime).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      });
    } else if (data.article?.publishedAt) {
      fomattedDate = new Date(data.article?.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      });
    }
  };

  function getReadingTime(text: string): number {
    const wpm = 225;
    // Remove HTML tags and count words directly
    const words = text.replace(/<[^>]*>/g, '').match(/\S+/g)?.length || 0;
    return Math.ceil(words / wpm);
  }

  onMount(() => {
    formatArticleDate();
  });
</script>

<svelte:head>
  <title>{data.article?.title}</title>
</svelte:head>

<main class="flex w-full max-w-full flex-col items-center overflow-x-hidden px-4 py-16 sm:px-0">
  {#await data.streamed.parsedArticle}
    <ArticlePageSkeleton />
  {:then parsedArticle}
    <article
      class="prose w-full max-w-full dark:prose-invert sm:max-w-prose sm:pt-4"
      class:prose-sm={$fontSize === 'sm'}
      class:prose-base={$fontSize === 'base'}
      class:prose-lg={$fontSize === 'lg'}
      class:prose-xl={$fontSize === 'xl'}
    >
      <div class="space-y-6">
        <a href={data.article?.link} target="_blank">{data.article?.siteName}</a>
        <h2>{data.article?.title}</h2>
        {#if data.article?.author || parsedArticle?.byline}
          <p class="text-md text-muted-foreground" id="author">
            {data.article?.author || parsedArticle?.byline}
          </p>
        {/if}
        {#if fomattedDate}
          <p class="text-sm text-muted-foreground">{fomattedDate}</p>
        {/if}
        <p class="flex h-4 items-center text-sm text-muted-foreground">
          <BookOpen class="my-0 mr-1 h-4 w-4" />
          {getReadingTime(parsedArticle?.content || '')} min. read
        </p>
      </div>

      <Separator class="my-6" />

      {@html parsedArticle?.content}
    </article>
  {/await}
</main>
