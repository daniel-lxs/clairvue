<script lang="ts">
  import type { Feed } from '@/server/data/schema';
  import { calculateAge } from '@/utils';
  import { Button } from '../ui/button';
  import { Trash } from 'lucide-svelte';
  import { createEventDispatcher } from 'svelte';

  export let feed: Feed;

  const dispatch = createEventDispatcher();

  let isHovered = false;

  function deleteFeed() {
    dispatch('delete', {
      feed
    });
  }
</script>

<div
  class="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted"
  on:mouseenter={() => (isHovered = true)}
  on:mouseleave={() => (isHovered = false)}
  role="button"
  tabindex="0"
>
  <div class="flex flex-col">
    <div class="text-sm font-semibold">{feed.name}</div>
    <div class="text-xs text-muted-foreground">
      Created {calculateAge(feed.createdAt, 'long')} • {feed.articleCount || 0} articles
    </div>
  </div>

  {#if isHovered}
    <Button on:click={deleteFeed} variant="destructive" size="sm" class="ml-2 flex-shrink-0">
      <Trash class="h-4 w-4" />
    </Button>
  {/if}
</div>
