<script lang="ts">
  import { Separator } from '@/components/ui/separator';
  import type { PageData } from './$types';
  import { onMount } from 'svelte';
  import { BookOpen } from 'lucide-svelte';
  import { fontSize } from '@/stores/font-size';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let fomattedDate: string = $state('');

  const formatArticleDate = async () => {
    const { readableArticle, articleMetadata } = data;
    if (readableArticle && readableArticle.publishedTime) {
      fomattedDate = new Date(readableArticle.publishedTime).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      });
    } else if (articleMetadata?.publishedAt) {
      fomattedDate = new Date(articleMetadata?.publishedAt).toLocaleDateString('en-US', {
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
  <title>{data.articleMetadata?.title}</title>
</svelte:head>

<main class="flex w-full max-w-full flex-col items-center overflow-x-hidden px-4 py-16 sm:px-0">
  <article
    class="prose dark:prose-invert w-full max-w-full sm:max-w-prose sm:pt-4"
    class:prose-sm={$fontSize === 'sm'}
    class:prose-base={$fontSize === 'base'}
    class:prose-lg={$fontSize === 'lg'}
    class:prose-xl={$fontSize === 'xl'}
  >
    <div class="space-y-6">
      <a href={data.articleMetadata?.link} target="_blank">{data.articleMetadata?.siteName}</a>
      <h2>{data.articleMetadata?.title}</h2>
      {#if data.articleMetadata?.author || data.readableArticle?.byline}
        <p class="text-md text-muted-foreground" id="author">
          {data.articleMetadata?.author || data.readableArticle?.byline}
        </p>
      {/if}
      {#if fomattedDate}
        <p class="text-muted-foreground text-sm">{fomattedDate}</p>
      {/if}
      <p class="text-muted-foreground flex h-4 items-center text-sm">
        <BookOpen class="my-0 mr-1 h-4 w-4" />
        {getReadingTime(data.readableArticle?.content || '')} min. read
      </p>
    </div>

    <Separator class="my-6" />

    {@html data.readableArticle?.content}
  </article>
</main>
