<script lang="ts">
  import type { Feed } from '@/server/data/schema';
  import { calculateAge } from '@/utils';
  import { Button } from '../ui/button';
  import { Trash, MoreVertical } from 'lucide-svelte';
  import { createEventDispatcher } from 'svelte';
  import * as DropdownMenu from '../ui/dropdown-menu';

  interface Props {
    feed: Feed;
  }

  let { feed }: Props = $props();

  const dispatch = createEventDispatcher();

  function deleteFeed() {
    dispatch('delete', {
      feed
    });
  }
</script>

<div
  class="flex items-center justify-between rounded-lg p-4 transition-colors bg-muted"
  role="button"
  tabindex="0"
>
  <div class="flex flex-col">
    <div class="text-sm font-semibold">{feed.name}</div>
    <div class="text-xs text-muted-foreground">
      Created {calculateAge(feed.createdAt, 'long')} • {feed.articleCount || 0} articles
    </div>
  </div>

  <DropdownMenu.Root>
    <DropdownMenu.Trigger asChild >
      {#snippet children({ builder })}
            <Button
          builders={[builder]}
          variant="ghost"
          size="sm"
          class="ml-2 flex-shrink-0 h-8 w-8 p-0"
        >
          <MoreVertical class="h-4 w-4" />
        </Button>
                {/snippet}
        </DropdownMenu.Trigger>
    <DropdownMenu.Content>
      <DropdownMenu.Item on:click={deleteFeed}>
        <Trash class="mr-2 h-4 w-4" />
        <span>Delete</span>
      </DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</div>
