<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { cn } from '$lib/utils';
  import type { Feed } from '@clairvue/types';
  import { ChevronDown } from 'lucide-svelte';

  let {
    feeds,
    currentFeedId,
    onLoadMore,
    onNavigate
  }: {
    feeds: Feed[];
    currentFeedId?: string;
    onLoadMore: (page: number) => void;
    onNavigate?: (feedId: string) => void;
  } = $props();

  let page = $state(1);
  let itemsPerPage = 5;

  let visibleFeeds = $derived(feeds.slice(0, page * itemsPerPage));
  let hasMore = $derived(feeds.length > page * itemsPerPage);

  function loadMore() {
    page++;
    onLoadMore(page);
  }
</script>

{#if feeds.length === 0}
  <div class="text-muted-foreground text-sm">No feeds found</div>
{:else}
  <div class=" flex flex-col">
    {#each visibleFeeds as feed (feed.id)}
      <a
        href="/f/{feed.id}"
        onclick={() => onNavigate?.(feed.id)}
        class={cn(
          'hover:bg-muted hover:border-muted-foreground flex items-center rounded-md rounded-l-none border-l px-4 py-2 transition-colors',
          currentFeedId === feed.id && 'bg-muted'
        )}
      >
        <div class="flex flex-col">
          <span class="text-sm font-medium">{feed.name}</span>
        </div>
      </a>
    {/each}

    {#if hasMore}
      <Button variant="ghost" class="mt-2 w-full" on:click={loadMore}>
        Show More
        <ChevronDown class="ml-2 h-4 w-4" />
      </Button>
    {/if}
  </div>
{/if}
