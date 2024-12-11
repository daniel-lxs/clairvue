<script lang="ts">
  import * as Card from '@/components/ui/card';
  import type { ArticleWithFeed } from '@clairvue/types';
  import { calculateAge, truncateDescription } from '$lib/utils';
  import ArticleCardImage from './article-card-image.svelte';
  import { Skeleton } from '../ui/skeleton';
  import { BookOpen } from 'lucide-svelte';

  interface Props {
    article: ArticleWithFeed;
  }

  let { article }: Props = $props();

  let imageLoaded = $state(false);

  let imageError = $state(false);

  let imageType = $state('wide');

  let age = $derived(calculateAge(new Date(article.publishedAt)));

  let imageWidth = $state(0);

  let imageHeight = $state(0);

  let aspectRatio = $state(0);

  let isMobile = $state(false);

  let descriptionLength: number = $state(300);

  $effect(() => {
    isMobile = window.innerWidth <= 768;
    if (!article.image || imageError) {
      descriptionLength = 500;
      return;
    }
    const img = new Image();
    img.src = article.image as string;
    img.onload = () => {
      imageWidth = img.naturalWidth;
      imageHeight = img.naturalHeight;
      aspectRatio = imageWidth / imageHeight;

      if (aspectRatio <= 1.3 || imageWidth < 300) {
        imageType = 'square';
        descriptionLength = 200;
      }

      imageLoaded = true;
    };
    img.onerror = () => {
      imageError = true;
    };
  });
</script>

<div id={article.slug}>
  <Card.Root class="flex shadow-lg">
    <div class="flex w-full flex-col">
      {#if article.image && !imageError && imageType === 'wide'}
        {#if imageLoaded}
          <div class="w-full">
            <ArticleCardImage {article} bind:imageLoaded bind:imageError type={imageType} />
          </div>
        {:else}
          <Skeleton class="h-48 object-cover" />
        {/if}
      {/if}
      <div class="space-y-2 p-4">
        <div class="flex w-full justify-between">
          <div class="flex w-full flex-col justify-between">
            <div class="space-y-2">
              <Card.Header class="p-0">
                <a
                  href="/f/{article.feedId}"
                  class="hover:text-primary text-xs font-bold transition-colors sm:text-sm"
                  >{article.feed?.name}</a
                >
                <div class="flex flex-col gap-2">
                  <Card.Title
                    tag="h1"
                    class="hover:text-primary text-xl font-bold transition-colors"
                  >
                    {#if article.readable}
                      <a href={`/article/${article.slug}`}>{article.title}</a>
                    {:else}
                      <a href={article.link} target="_blank">{article.title}</a>
                    {/if}
                  </Card.Title>
                  <Card.Description class="sm:text-md text-sm">
                    <div class="flex flex-col items-start sm:flex-row sm:items-center">
                      <a href={article.link} class="hover:text-primary mb-1 sm:mb-0"
                        >({article.siteName})</a
                      >
                      <div class="mt-1 flex items-center sm:ml-1 sm:mt-0">
                        <span class="text-md text-muted-foreground"
                          >{!isMobile ? '•' : ''} {age}</span
                        >
                        {#if article.readable}
                          <div class="ml-2" title="Readable">
                            <BookOpen class="h-4 w-4" />
                          </div>
                        {/if}
                      </div>
                    </div>
                  </Card.Description>
                </div>
              </Card.Header>
              {#if !isMobile || imageType === 'wide'}
                <Card.Content class="p-0">
                  {#if article.description}
                    <p class="text-md break-all">
                      {truncateDescription(article.description, descriptionLength)}
                    </p>
                  {/if}
                </Card.Content>
              {/if}
            </div>
          </div>
          {#if article.image && !imageError && imageType === 'square'}
            {#if imageLoaded}
              <div class="ml-2 pl-2 sm:ml-4">
                <ArticleCardImage {article} bind:imageLoaded bind:imageError type={imageType} />
              </div>
            {:else}
              <Skeleton class="h-48 object-cover" />
            {/if}
          {/if}
        </div>
        {#if isMobile && imageType === 'square'}
          <Card.Content class="p-0">
            {#if article.description}
              <p class="text-md break-all">
                {truncateDescription(article.description, descriptionLength)}
              </p>
            {/if}
          </Card.Content>
        {/if}
      </div>
    </div>
  </Card.Root>
</div>
