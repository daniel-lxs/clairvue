<script lang="ts">
  import type { Collection, CollectionWithFeeds } from '@clairvue/types';

  let {
    collections,
    onNavigate
  }: {
    collections: Collection[] | CollectionWithFeeds[];
    onNavigate?: (slug: string) => void;
  } = $props();

  function collectionHasFeeds(collection: Collection | CollectionWithFeeds) {
    return 'feeds' in collection;
  }
</script>

{#if collections.length === 0}
  <div class="text-muted-foreground text-sm">No collections found</div>
{:else}
  <div class="flex flex-col">
    {#each collections as collection (collection.id)}
      <a
        href="/c/{collection.slug}"
        onclick={() => onNavigate?.(collection.slug)}
        class="hover:bg-muted hover:border-muted-foreground flex items-center rounded-md rounded-l-none border-l px-4 py-3 transition-colors"
      >
        <div class="flex flex-col">
          <span class="text-sm font-medium">{collection.name}</span>
          {#if collectionHasFeeds(collection)}
            <span class="text-muted-foreground text-xs">
              {collection.feeds.length} feeds
            </span>
          {/if}
        </div>
      </a>
    {/each}
  </div>
{/if}
