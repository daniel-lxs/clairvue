<script lang="ts">
  import type { Feed } from '@/server/data/schema';
  import { calculateAge } from '$lib/utils';
  import { Button } from '../ui/button';
  import { Trash, MoreVertical } from 'lucide-svelte';
  import * as DropdownMenu from '../ui/dropdown-menu';

  interface Props {
    feed: Feed;
    disableActions?: boolean;
    onRemove: (feed: Feed) => void;
  }

  let { feed, onRemove, disableActions }: Props = $props();
</script>

<div
  class="bg-muted flex items-center justify-between rounded-lg p-4 transition-colors"
  role="button"
  tabindex="0"
>
  <div class="flex flex-col">
    <a
      href="/f/{feed.id}"
      class="item-title text-primary decoration-primary/30 hover:text-primary/80 truncate text-sm font-medium underline-offset-4 transition-colors hover:underline"
      >{feed.name}</a
    >
    <div class="text-muted-foreground text-xs">
      Created {calculateAge(feed.createdAt, 'long')} • {feed.articleCount || 0} articles
    </div>
  </div>
  {#if !disableActions}
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
        <DropdownMenu.Item on:click={() => onRemove(feed)}>
          <Trash class="mr-2 h-4 w-4" />
          <span>Delete</span>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  {/if}
</div>
