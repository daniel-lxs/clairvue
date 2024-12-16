<script lang="ts">
  import type { Collection, Feed } from '@clairvue/types';
  import ChevronUp from 'lucide-svelte/icons/chevron-up';
  import * as Collapsible from '$lib/components/ui/collapsible';
  import { NavigationCollections, NavigationFeeds } from '.';
  import { Button } from '../ui/button';
  import { cn } from '$lib/utils';
  import { Separator } from '../ui/separator';

  let {
    class: className = undefined,
    collections,
    feeds,
    currentFeedId,
    onNavigate
  }: {
    class?: string;
    collections: Collection[];
    feeds: Feed[];
    currentFeedId?: string;
    onNavigate?: (slug: string) => void;
  } = $props();

  let openCollections = $state(true);
  let openFeeds = $state(true);
  let openSaved = $state(true);
</script>

<div class={cn('flex flex-col', className)}>
  <Collapsible.Root bind:open={openCollections}>
    <Collapsible.Trigger asChild let:builder>
      <Button
        builders={[builder]}
        variant="ghost"
        class="text-muted-foreground w-full justify-between"
        >Collections
        <ChevronUp class="ml-2 h-5 w-5" />
      </Button>
    </Collapsible.Trigger>
    <Collapsible.Content class="pl-6">
      <NavigationCollections {collections} {onNavigate} />
    </Collapsible.Content>
  </Collapsible.Root>
  <Collapsible.Root bind:open={openFeeds}>
    <Collapsible.Trigger asChild let:builder class="w-full">
      <Button
        builders={[builder]}
        variant="ghost"
        class="text-muted-foreground w-full  justify-between rounded-md p-4 font-semibold"
      >
        Feeds
        <ChevronUp class="ml-2 h-5 w-5" />
      </Button>
    </Collapsible.Trigger>
    <Collapsible.Content class="pl-6">
      <NavigationFeeds {feeds} {currentFeedId} {onNavigate} />
    </Collapsible.Content>
  </Collapsible.Root>
  <Collapsible.Root bind:open={openSaved}>
    <Collapsible.Trigger asChild let:builder class="w-full">
      <Button
        builders={[builder]}
        variant="ghost"
        class="text-muted-foreground w-full  justify-between rounded-md p-4 font-semibold"
      >
        Articles
        <ChevronUp class="ml-2 h-5 w-5" />
      </Button>
    </Collapsible.Trigger>
    <Collapsible.Content class="pl-6">
      <a
        href="/articles/saved"
        class={cn(
          'hover:bg-muted hover:border-muted-foreground flex items-center rounded-md rounded-l-none border-l px-4 py-3 transition-colors'
        )}
      >
        <div class="flex flex-col">
          <span class="text-sm font-medium">Saved</span>
        </div>
      </a>
    </Collapsible.Content>
  </Collapsible.Root>
</div>
