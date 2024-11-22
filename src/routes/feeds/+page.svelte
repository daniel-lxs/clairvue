<script lang="ts">
  import FeedListItem from '@/components/feed/feed-list-item.svelte';
  import CreateFeedDialog from '@/components/feed/create-feed-dialog.svelte';
  import CreateCollectionDialog from '@/components/collection/create-collection-dialog.svelte';
  import type { PageData } from './$types';
  import { Button, buttonVariants } from '@/components/ui/button';
  import { Label } from '@/components/ui/label';
  import { Folder, FolderPlus } from 'lucide-svelte';
  import { createFeeds, deleteFeedFromCollection } from '@/api';
  import showToast from '@/utils/showToast';
  import type { NewFeed } from '@/types/NewFeed';
  import type { Feed } from '@/server/data/schema';
  import type { Collection } from '@/server/data/schema';
  import * as Dialog from '@/components/ui/dialog';
  import { invalidate } from '$app/navigation';

  interface Props {
    data: PageData;
  }
  let { data }: Props = $props();

  let selectedCollection = $state(data.defaultCollection);
  let currentFeeds = $state<Feed[]>(data.defaultCollection?.feeds || []);
  let isDefaultSelected = $derived(selectedCollection?.id.includes('default'));
  let pageTitle = $state('All Feeds');

  $effect(() => {
    currentFeeds = selectedCollection?.feeds || [];
    pageTitle = selectedCollection?.id.startsWith('default-')
      ? 'All Feeds'
      : selectedCollection?.name || 'All Feeds';
  });

  async function handleDeleteFeed(feed: Feed) {
    if (selectedCollection) {
      await deleteFeedFromCollection(selectedCollection.id, feed.id);
      await invalidate('app:feeds');
      showToast('Feed deleted', `Feed "${feed.name}" has been deleted.`);
    }
  }

  async function saveFeed(newFeed: NewFeed) {
    if (!selectedCollection) return;

    const createFeedResult = (
      await createFeeds([
        {
          ...newFeed,
          collectionId: selectedCollection.id,
          description: newFeed.description || undefined
        }
      ])
    )[0];

    if (!createFeedResult || createFeedResult.result === 'error') {
      showToast('Failed to create new feed', 'Please try again later', 'error');
      throw new Error('Failed to create new feed');
    }

    await invalidate('app:feeds');
    showToast('Feed created', `Feed "${newFeed.name}" has been created.`);
  }

  function handleCollectionCreate(collection: Collection) {
    showToast('Collection created', `Collection "${collection.name}" has been created.`);
  }
</script>

<div class="flex min-h-screen flex-col items-center justify-center">
  <div class="flex min-h-screen w-full pt-8">
    <!-- Sidebar -->
    <div class="w-64 space-y-2 border-r p-4 pt-8 sm:pt-12">
      <div class="mb-4 flex items-center justify-between">
        <Label class="text-sm font-medium">Collections</Label>
        <CreateCollectionDialog
          feeds={data.defaultCollection?.feeds || []}
          onCollectionCreated={handleCollectionCreate}
        >
          <Dialog.Trigger class={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            <FolderPlus class="h-4 w-4" color="hsl(var(--primary))" />
          </Dialog.Trigger>
        </CreateCollectionDialog>
      </div>

      <Button
        variant="ghost"
        class="w-full justify-start gap-2"
        on:click={() => (selectedCollection = data.defaultCollection)}
      >
        <Folder class="h-4 w-4" />
        <span>All Feeds</span>
      </Button>

      {#if data.collections.length > 0}
        <div class="space-y-1">
          {#each data.collections as collection}
            <Button
              variant="ghost"
              class="w-full justify-start gap-2"
              on:click={() => (selectedCollection = collection)}
            >
              <Folder class="h-4 w-4" />
              <span>{collection.name}</span>
            </Button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Main Content -->
    <div class="flex-1 p-6 pt-8 sm:pt-12">
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <Label class="text-lg font-medium">{pageTitle}</Label>
            <p class="text-sm text-muted-foreground">
              {#if isDefaultSelected}
                View and manage all your RSS feeds
              {:else}
                Feeds in {selectedCollection?.name}
              {/if}
            </p>
          </div>
          <CreateFeedDialog create={saveFeed} />
        </div>

        {#if currentFeeds.length > 0}
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {#each currentFeeds as feed}
              <FeedListItem
                {feed}
                deleteFeed={handleDeleteFeed}
                allowRemove={!isDefaultSelected || !feed.link.includes('default')}
              />
            {/each}
          </div>
        {:else}
          <div
            class="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed"
          >
            <div class="space-y-2 text-center">
              <p class="font-medium text-muted-foreground">No feeds yet</p>
              <p class="text-sm text-muted-foreground">
                {#if isDefaultSelected}
                  Add your first RSS feed to start reading
                {:else}
                  Add feeds to this collection to start organizing
                {/if}
              </p>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
