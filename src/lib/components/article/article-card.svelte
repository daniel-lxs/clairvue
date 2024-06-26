<script lang="ts">
  import * as Card from '@/components/ui/card';
  import type { Article } from '@/server/data/schema';
  import { calculateAge, truncateDescription } from '@/utils';
  import ArticleCardImage from './article-card-image.svelte';
  import { Skeleton } from '../ui/skeleton';
  import { BookOpen } from 'lucide-svelte';
  import { onMount } from 'svelte';

  export let article: Article;

  $: imageLoaded = false;
  $: imageError = false;
  $: imageType = 'wide';
  $: age = calculateAge(new Date(article.publishedAt));
  $: imageWidth = 0;
  $: imageHeight = 0;
  $: aspectRatio = 0;

  let isMobile = false;

  let descriptionLength: number = 300;

  const loadImage = () => {
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
  };

  $: {
    if (imageError) {
      descriptionLength = 500;
    }
  }

  loadImage();

  setTimeout(() => {
    if (!imageLoaded) {
      imageError = true;
    }
  }, 5000);

  onMount(() => {
    isMobile = window.innerWidth <= 768;
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
                  href="/feed/{article.feedId}"
                  class="text-xs font-bold transition-colors hover:text-primary sm:text-sm"
                  >{article.feed?.name}</a
                >
                <div class="flex flex-col gap-2">
                  <Card.Title
                    tag="h1"
                    class="text-xl font-bold transition-colors hover:text-primary sm:text-2xl"
                  >
                    <a
                      href={article.readable ? `/article/${article.slug}` : article.link}
                      target="_blank">{article.title}</a
                    >
                  </Card.Title>
                  <Card.Description class="sm:text-md text-sm">
                    <div class="flex flex-col items-start sm:flex-row sm:items-center">
                      <a href={article.link} class="mb-1 hover:text-primary sm:mb-0"
                        >({article.siteName})</a
                      >
                      <div class="mt-1 flex items-center sm:ml-1 sm:mt-0">
                        <span class="text-md text-muted-foreground"
                          >{!isMobile ? '•' : ''} {age}</span
                        >
                        {#if article.readable}
                          <div class="ml-2" title="readable">
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
                    <p class="text-md">
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
              <p class="text-md">
                {truncateDescription(article.description, descriptionLength)}
              </p>
            {/if}
          </Card.Content>
        {/if}
      </div>
    </div>
  </Card.Root>
</div>
