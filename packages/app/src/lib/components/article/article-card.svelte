<script lang="ts">
  import * as Card from '@/components/ui/card';
  import type { ArticleWithInteraction, Feed } from '@clairvue/types';
  import { calculateAge, showToast, truncateDescription } from '$lib/utils';
  import ArticleCardImage from './article-card-image.svelte';
  import { Skeleton } from '../ui/skeleton';
  import { BookmarkPlus, BookOpen, BookmarkMinus } from 'lucide-svelte';
  import { updateInteractions } from '../../api/article';

  interface Props {
    feed?: Feed;
    article: ArticleWithInteraction;
  }

  let { article, feed }: Props = $props();

  let isSaved = $state(article.saved);

  let imageLoaded = $state(false);

  let imageError = $state(false);

  let imageType = $state('wide');

  let age = $derived(calculateAge(new Date(article.publishedAt)));

  let imageWidth = $state(0);

  let imageHeight = $state(0);

  let aspectRatio = $state(0);

  let isMobile = $state(false);

  let descriptionLength: number = $state(300);

  let startX = $state(0);
  let currentX = $state(0);
  let isDragging = $state(false);
  const maxSwipeDistance = 100; // Maximum distance the card can be swiped

  let startY = $state(0);
  let isScrolling = $state(false);

  function handleTouchStart(e: TouchEvent) {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    isDragging = true;
  }

  function handleTouchMove(e: TouchEvent) {
    if (!isDragging) return;

    const deltaX = startX - e.touches[0].clientX;
    const deltaY = startY - e.touches[0].clientY;

    // If vertical movement is greater than horizontal, consider it scrolling
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      currentX = 0;
      isDragging = false;
      isScrolling = true;
      return;
    }

    // Only allow swipe if not scrolling
    if (!isScrolling) {
      currentX = Math.max(-maxSwipeDistance, Math.min(0, -deltaX));
    }
  }

  function handleTouchEnd() {
    if (!isScrolling && currentX <= -maxSwipeDistance * 0.8) {
      handleSave();
    }
    currentX = 0;
    isDragging = false;
    isScrolling = false;
  }

  async function handleSave() {
    const result = await updateInteractions(article.id, article.read, !isSaved);

    result.match({
      ok: () => {
        showToast(
          isSaved ? 'Article removed' : 'Article saved',
          isSaved
            ? 'Article removed from saved articles feed'
            : 'Article saved to your saved articles feed',
          'success'
        );
        currentX = 0;
        isSaved = !isSaved;
      },
      err: (error) => {
        showToast('Failed to save article', error.message, 'error');
        currentX = 0;
      }
    });
  }

  $effect(() => {
    const card = document.getElementById(article.slug);
    if (card) {
      card.addEventListener('touchstart', handleTouchStart);
      card.addEventListener('touchmove', handleTouchMove);
      card.addEventListener('touchend', handleTouchEnd);
      return () => {
        card.removeEventListener('touchstart', handleTouchStart);
        card.removeEventListener('touchmove', handleTouchMove);
        card.removeEventListener('touchend', handleTouchEnd);
      };
    }
  });

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

<div id={article.slug} class="relative overflow-hidden">
  {#if isDragging}
    <div
      class="absolute inset-y-0 right-0 z-0 flex w-28 items-center justify-center rounded-r-lg"
      style={`opacity: ${Math.abs(currentX) / maxSwipeDistance}; background-color: rgba(${isSaved ? '239, 68, 68' : '34, 197, 94'}, ${Math.abs(currentX) / maxSwipeDistance})`}
    >
      {#if isSaved}
        <BookmarkMinus class="h-6 w-6 text-white" />
      {:else}
        <BookmarkPlus class="h-6 w-6 text-white" />
      {/if}
    </div>
  {/if}
  <div
    class="relative z-10 transition-transform duration-150 ease-out"
    style={`transform: translateX(${currentX}px)`}
  >
    <Card.Root class="flex rounded-lg shadow-lg">
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
                    href="/f/{feed?.id}"
                    class="hover:text-primary text-xs font-bold transition-colors sm:text-sm"
                    >{feed?.name}</a
                  >
                  <div class="flex flex-col gap-2">
                    <Card.Title
                      tag="h1"
                      class="hover:text-primary text-lg font-bold transition-colors"
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
                      <p class="whitespace-normal break-words text-sm">
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
                <p class="whitespace-normal break-words text-sm">
                  {truncateDescription(article.description, descriptionLength)}
                </p>
              {/if}
            </Card.Content>
          {/if}
        </div>
      </div>
    </Card.Root>
  </div>
</div>
