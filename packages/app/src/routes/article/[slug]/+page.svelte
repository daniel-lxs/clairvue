<script lang="ts">
  import { Separator } from '@/components/ui/separator';
  import type { PageData } from './$types';
  import { BookOpen } from 'lucide-svelte';
  import { fontSize } from '@/stores/font-size';
  import showToast from '@/utils';
  import type { ReadableArticle } from '@clairvue/types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let readableArticle = $state(data.readableArticle);
  let updatedReadableArticle = $state<ReadableArticle | undefined>(undefined);

  function formatArticleDate(date: string) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  }

  function getReadingTime(text: string): number {
    const wpm = 225;
    // Remove HTML tags and count words directly
    const words = text.replace(/<[^>]*>/g, '').match(/\S+/g)?.length || 0;
    return Math.ceil(words / wpm);
  }

  function handleUpdate() {
    readableArticle = updatedReadableArticle;
    updatedReadableArticle = undefined;
  }

  async function checkUpdatedArticle() {
    const updatedArticle = await data.streamed?.updatedArticle;
    if (updatedArticle && typeof updatedArticle !== 'string') {
      updatedReadableArticle = updatedArticle;
      showToast('Article updated', `This article has a new version.`, 'info', {
        label: 'Refresh',
        onClick: () => {
          handleUpdate();
        }
      });
    }
  }

  $effect(() => {
    checkUpdatedArticle();
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
      {#if data.articleMetadata?.author || readableArticle?.byline}
        <p class="text-md text-muted-foreground" id="author">
          {data.articleMetadata?.author || readableArticle?.byline}
        </p>
      {/if}
      {#if readableArticle?.publishedTime}
        <p class="text-muted-foreground text-sm">
          {formatArticleDate(readableArticle?.publishedTime)}
        </p>
      {/if}
      {#if updatedReadableArticle}
        <button
          title="This article has a new version"
          onclick={handleUpdate}
          class="text-muted-foreground text-sm">Refresh article</button
        >
      {/if}
      <p class="text-muted-foreground flex h-4 items-center text-sm">
        <BookOpen class="my-0 mr-1 h-4 w-4" />
        {getReadingTime(readableArticle?.content || '')} min. read
      </p>
    </div>

    <Separator class="my-6" />

    {@html readableArticle?.content}
  </article>
</main>
