<script lang="ts">
  import { Button } from '../ui/button';
  import { Bookmark } from 'lucide-svelte';
  import type { ArticleWithInteraction } from '@clairvue/types';
  import { removeArticleFromSavedArticles, addArticleToSavedArticles } from '$lib/api/article';
  import { showToast } from '../../utils';

  interface Props {
    article: ArticleWithInteraction;
    imageLoaded?: boolean;
    imageError?: boolean;
    type?: string;
  }

  function handleBookmark() {
    if (saved) {
      removeArticleFromSavedArticles(article.id);
      saved = false;
      showToast('Article removed', 'Article removed from saved articles feed', 'success');
    } else {
      addArticleToSavedArticles(article.id);
      saved = true;
      showToast('Article saved', 'Article saved to your saved articles feed', 'success');
    }
  }

  let {
    article,
    imageLoaded = $bindable(false),
    imageError = $bindable(false),
    type = 'wide'
  }: Props = $props();

  let saved = $derived(article.saved);
</script>

<div class="relative w-full overflow-hidden {type === 'square' ? 'rounded-lg' : 'rounded-t-lg'}">
  <a href={article.readable ? `/article/${article.slug}` : article.link} target="_blank">
    <img
      src={article.image}
      alt={article.title}
      loading="lazy"
      class="bg-muted h-full w-full object-contain {type === 'square'
        ? 'max-h-36 min-h-24 min-w-24 max-w-52'
        : ''}"
      onload={() => {
        imageLoaded = true;
      }}
      onerror={() => {
        imageError = true;
      }}
    />
  </a>
  <div class="absolute right-2 top-2">
    <Button
      variant="secondary"
      size="icon"
      class="bg-background/80 supports-[backdrop-filter]:bg-background/40 p-0 backdrop-blur"
      title="Save article"
      on:click={handleBookmark}
    >
      {#if saved}
        <Bookmark fill="white" class="text-foreground h-4 w-4" />
      {:else}
        <Bookmark class="text-foreground h-4 w-4" />
      {/if}
    </Button>
  </div>
</div>
