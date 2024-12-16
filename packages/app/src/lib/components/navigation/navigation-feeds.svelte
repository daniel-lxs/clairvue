<script lang="ts">
  import { cn } from '$lib/utils';
  import type { Feed } from '@clairvue/types';

  let {
    feeds,
    currentFeedId,
    onNavigate
  }: {
    feeds: Feed[];
    currentFeedId?: string;
    onNavigate?: (feedId: string) => void;
  } = $props();
</script>

{#if feeds.length === 0}
  <div class="text-muted-foreground text-sm">No feeds found</div>
{:else}
  <div class=" flex flex-col">
    {#each feeds as feed (feed.id)}
      <a
        href="/f/{feed.id}"
        onclick={() => onNavigate?.(feed.id)}
        class={cn(
          'hover:bg-muted hover:border-muted-foreground flex items-center rounded-md rounded-l-none border-l px-4 py-3 transition-colors',
          currentFeedId === feed.id && 'bg-muted'
        )}
      >
        <div class="flex flex-col">
          <span class="text-sm font-medium">{feed.name}</span>
        </div>
      </a>
    {/each}
  </div>
{/if}
