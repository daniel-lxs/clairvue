<script lang="ts">
  import type { Feed } from '@/server/data/schema';
  import { calculateAge } from '@/utils';
  import { Button } from '../ui/button';
  import { Trash, MoreVertical } from 'lucide-svelte';
  import * as DropdownMenu from '../ui/dropdown-menu';

  interface Props {
    feed: Feed;
    allowRemove?: boolean;
    deleteFeed: (feed: Feed) => void;
  }

  let { feed, deleteFeed, allowRemove }: Props = $props();
</script>

<div
  class="flex items-center justify-between rounded-lg bg-muted p-4 transition-colors"
  role="button"
  tabindex="0"
>
  <div class="flex flex-col">
    <a
      href="/feed/{feed.id}"
      class="item-title truncate text-sm font-medium text-primary decoration-primary/30 underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
      >{feed.name}</a
    >
    <div class="text-xs text-muted-foreground">
      Created {calculateAge(feed.createdAt, 'long')} • {feed.articleCount || 0} articles
    </div>
  </div>
  {#if allowRemove}
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild let:builder>
        <Button
          builders={[builder]}
          variant="ghost"
          size="sm"
          class="ml-2 h-8 w-8 flex-shrink-0 p-0"
        >
          <MoreVertical class="h-4 w-4" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item on:click={() => deleteFeed(feed)}>
          <Trash class="mr-2 h-4 w-4" />
          <span>Delete</span>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  {/if}
</div>
