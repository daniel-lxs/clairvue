<script lang="ts">
  import type { Collection, CollectionWithFeeds } from '@clairvue/types';
  import { cn } from '$lib/utils';
  import ChevronUp from 'lucide-svelte/icons/chevron-up';
  import Button from '../ui/button/button.svelte';
  import { goto } from '$app/navigation';
  import { buttonVariants } from '../ui/button';

  let {
    collections,
    onNavigate
  }: {
    collections: Collection[] | CollectionWithFeeds[];
    onNavigate?: (slug: string) => void;
  } = $props();

  function sortCollections(collections: (Collection | CollectionWithFeeds)[]) {
    return [...collections].sort((a, b) => {
      if (a.id.startsWith('default-')) return 1;
      if (b.id.startsWith('default-')) return -1;
      return 0;
    });
  }

  function collectionHasFeeds(collection: Collection | CollectionWithFeeds) {
    return 'feeds' in collection;
  }

  let openCollections = $state<Record<string, boolean>>(
    Object.fromEntries(collections.map((c) => [c.id, !c.id.startsWith('default-')]))
  );

  function toggleCollection(collectionId: string) {
    openCollections[collectionId] = !openCollections[collectionId];
    openCollections = openCollections;
  }

  function handleClick(route: string, event: MouseEvent) {
    event.preventDefault();
    onNavigate?.(route);
    goto(route);
  }
</script>

{#if collections.length === 0}
  <div class="text-muted-foreground text-sm">No collections found</div>
{:else}
  <div class="flex flex-col">
    {#each sortCollections(collections) as collection (collection.id)}
      <div class="flex flex-col">
        <div class="flex">
          <div class="flex flex-1">
            {#if collectionHasFeeds(collection) && collection.feeds.length > 0}
              <button
                class={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), '-ml-1')}
                onclick={(e: MouseEvent) => {
                  e.stopPropagation();
                  toggleCollection(collection.id);
                }}
              >
                <ChevronUp
                  class={cn(
                    'h-5 w-5 touch-none transition-transform',
                    !openCollections[collection.id] && 'rotate-180'
                  )}
                />
              </button>
            {/if}
            <div class="flex-1">
              <Button
                variant="ghost"
                class="w-full justify-between"
                onclick={(e: MouseEvent) => handleClick(`/c/${collection.slug}`, e)}
              >
                {collection.name}
                {#if collectionHasFeeds(collection)}
                  <span class="text-muted-foreground text-xs">
                    {collection.feeds.length}
                  </span>
                {/if}
              </Button>
              {#if collectionHasFeeds(collection) && collection.feeds.length > 0}
                <div
                  class={cn(
                    'flex flex-col overflow-hidden transition-all',
                    openCollections[collection.id] ? 'max-h-[500px]' : 'max-h-0'
                  )}
                >
                  {#each collection.feeds as feed (feed.id)}
                    <Button
                      variant="ghost"
                      class="w-full justify-start"
                      onclick={(e: MouseEvent) => handleClick(`/f/${feed.id}`, e)}
                    >
                      {feed.name}
                    </Button>
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>
    {/each}
  </div>
{/if}
