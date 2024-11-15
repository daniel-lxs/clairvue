<script lang="ts">
  import { Separator } from '@/components/ui/separator';
  import type { PageData } from './$types';
  import * as Page from '@/components/page';
  import { onMount } from 'svelte';
  import ArticlePageSkeleton from '@/components/article/article-page-skeleton.svelte';

  export let data: PageData;

  let fomattedDate: string;

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

  function getReadingTime(text: string) {
    const textWithoutHtml = text.replace(/<[^>]*>/g, '');
    const wpm = 225;
    const words = textWithoutHtml.trim().split(/\s+/).length;
    const time = Math.ceil(words / wpm);
    return time;
  }

  onMount(() => {
    formatArticleDate();
  });

  //TODO: add a speed reading option in the future
  //TODO: add size control to allow users to resize the whole article
</script>

<svelte:head>
  <title>{data.article?.title}</title>
</svelte:head>

<Page.Container>
  {#await data.streamed.parsedArticle}
    <ArticlePageSkeleton />
  {:then parsedArticle}
    <article class="prose dark:prose-invert sm:pt-4">
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
        <p class="text-sm text-muted-foreground">
          {getReadingTime(parsedArticle?.content || '')} min. read
        </p>
      </div>

      <Separator class="my-6" />

      {@html parsedArticle?.content}
    </article>
  {/await}
</Page.Container>
