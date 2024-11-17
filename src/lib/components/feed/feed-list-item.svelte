<script lang="ts">
  import type { Feed } from '@/server/data/schema';
  import { calculateAge } from '@/utils';
  import { Button } from '../ui/button';
  import { Trash, MoreVertical } from 'lucide-svelte';
  import * as DropdownMenu from '../ui/dropdown-menu';

  interface Props {
    feed: Feed;
    deleteFeed: (feed: Feed) => void;
  }

  let { feed, deleteFeed }: Props = $props();
</script>

<div
  class="flex items-center justify-between rounded-lg bg-muted p-4 transition-colors"
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
    <DropdownMenu.Trigger asChild let:builder>
      <Button builders={[builder]} variant="ghost" size="sm" class="ml-2 h-8 w-8 flex-shrink-0 p-0">
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
</div>
