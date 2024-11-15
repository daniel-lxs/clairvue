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

  onMount(() => {
    formatArticleDate();
  });

  //TODO: add a speed reading option in the future
</script>

<svelte:head>
  <title>{data.article?.title}</title>
</svelte:head>

<Page.Container>
  <div class="space-y-8 sm:px-0 sm:pt-4">
    {#await data.streamed.parsedArticle}
      <ArticlePageSkeleton />
    {:then parsedArticle}
      <div class="space-y-6">
        <a
          class="font-bold text-primary hover:text-foreground hover:underline"
          href={data.article?.link}
          target="_blank">{data.article?.siteName}</a
        >
        <h1 class="text-3xl font-bold">{data.article?.title}</h1>
        {#if data.article?.author || parsedArticle?.byline}
          <p class="text-md text-muted-foreground" id="author">
            {data.article?.author || parsedArticle?.byline}
          </p>
        {/if}
        {#if fomattedDate}
          <p class="text-sm text-muted-foreground">{fomattedDate}</p>
        {/if}
        <!-- TODO: add read time based on length -->
      </div>

      <Separator class="my-6" />

      <div class="parsed-content">
        <article class="prose dark:prose-invert">
          {@html parsedArticle?.content}
        </article>
      </div>
    {/await}
  </div>
</Page.Container>
