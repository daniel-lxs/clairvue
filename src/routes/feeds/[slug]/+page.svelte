<script lang="ts">
  import FeedListItem from '@/components/feed/feed-list-item.svelte';
  import CreateFeedDialog from '@/components/feed/create-feed-dialog.svelte';
  import type { PageData } from './$types';
  import { Label } from '@/components/ui/label';
  import collectionApi from '@/api/collection';
  import feedApi from '@/api/feed';
  import showToast from '@/utils';
  import type { NewFeed } from '@/types/NewFeed';
  import type { Collection, Feed } from '@/server/data/schema';
  import * as Breadcrumb from '@/components/ui/breadcrumb';
  import * as Select from '@/components/ui/select';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import { goto, invalidate } from '$app/navigation';
  import CollectionsSidebar from '@/components/collection/collections-sidebar.svelte';
  import CollectionDialog from '@/components/collection/collection-dialog.svelte';
  import type { Selected } from 'bits-ui';
  import { FolderPlus, MoreHorizontal, Plus, Pencil } from 'lucide-svelte';

  interface Props {
    data: PageData;
  }
  let { data }: Props = $props();

  let isDefaultSelected = $derived(data.collection.id === data.defaultCollection.id);
  let selectedCollection = $derived(data.collection);
  let pageTitle = $derived(isDefaultSelected ? 'All Feeds' : data.collection.name || 'All Feeds');

  let openFeedDialog = $state(false);
  let openCollectionDialog = $state(false);
  let openEditCollectionDialog = $state(false);

  async function handleRemoveFeed(feed: Feed) {
    if (data.collection) {
      await collectionApi.removeFeedFromCollection(data.collection.id, feed.id);
      await invalidate('feeds');
      showToast('Feed deleted', `Feed "${feed.name}" has been deleted.`);
    }
  }

  async function handleSaveFeed(newFeed: NewFeed) {
    if (!data.collection) return;

    const createFeedResult = (
      await feedApi.createFeeds([
        {
          ...newFeed,
          collectionId: data.collection.id,
          description: newFeed.description || undefined
        }
      ])
    )[0];

    if (createFeedResult.result === 'success') {
      await invalidate('feeds');
      showToast('Feed created', `Feed "${newFeed.name}" has been created.`);
    } else {
      showToast('Error', createFeedResult.reason || 'Failed to create feed.', 'error');
    }
  }

  async function handleSaveCollection(collection: Collection) {
    await invalidate('feeds');
    showToast('Collection updated', `Collection "${collection.name}" has been updated.`);
  }

  function handleCollectionChange(selected: Selected<unknown> | undefined) {
    if (!selected) return;
    const value = selected.value;
    if (typeof value !== 'string') return;
    goto(`/feeds/${value}`);
  }
</script>

<main class="flex min-h-screen flex-col items-center justify-center">
  <CreateFeedDialog onSave={handleSaveFeed} bind:open={openFeedDialog} showButton={false} />
  <CollectionDialog
    feeds={data.defaultCollection.feeds}
    collection={selectedCollection}
    onSave={handleSaveCollection}
    bind:open={openEditCollectionDialog}
    showButton={false}
  />
  <div class="flex min-h-screen w-full pt-20">
    <!-- Sidebar -->
    <CollectionsSidebar
      collections={data.collections}
      {selectedCollection}
      feeds={data.defaultCollection.feeds ?? []}
      bind:openCollectionDialog
    />

    <!-- Main Content -->
    <div class="flex-1 px-8">
      <div class="mb-4 mt-1">
        <Breadcrumb.Root>
          <Breadcrumb.List>
            <Breadcrumb.Link href="/feeds">Feeds</Breadcrumb.Link>
            <Breadcrumb.Separator />
            <Breadcrumb.Page>{pageTitle}</Breadcrumb.Page>
          </Breadcrumb.List>
        </Breadcrumb.Root>
      </div>

      <div class="space-y-4 sm:space-y-6">
        <div class="flex justify-between sm:items-center">
          <div class="space-y-1">
            <Label class="text-lg sm:text-xl" href="/feeds/{selectedCollection.slug}"
              >{pageTitle}</Label
            >
            <p class="text-sm text-muted-foreground">
              {#if isDefaultSelected}
                View and manage all your RSS feeds
              {:else}
                Feeds in {data.collection?.name}
              {/if}
            </p>
          </div>

          <div>
            <DropdownMenu.Root disableFocusFirstItem={true}>
              <DropdownMenu.Trigger>
                <MoreHorizontal class="h-6 w-6" />
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                <DropdownMenu.Group>
                  <DropdownMenu.Item on:click={() => (openCollectionDialog = true)}>
                    <FolderPlus class="mr-2 h-4 w-4" />
                    New collection
                  </DropdownMenu.Item>
                  {#if !isDefaultSelected}
                    <DropdownMenu.Item on:click={() => (openEditCollectionDialog = true)}>
                      <Pencil class="mr-2 h-4 w-4" />
                      Edit collection
                    </DropdownMenu.Item>
                  {/if}
                  <DropdownMenu.Item on:click={() => (openFeedDialog = true)}>
                    <Plus class="mr-2 h-4 w-4" />
                    Add Feed
                  </DropdownMenu.Item>
                </DropdownMenu.Group>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </div>
        </div>

        <div class="block w-full sm:hidden">
          <Select.Root onSelectedChange={(value) => handleCollectionChange(value)}>
            <Select.Trigger class="w-full">
              <Select.Value placeholder={selectedCollection.name} />
            </Select.Trigger>
            <Select.Content>
              {#each data.collections as collection}
                <Select.Item value={collection.slug}>{collection.name}</Select.Item>
              {/each}
            </Select.Content>
            <Select.Input name="collection" />
          </Select.Root>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {#if data.collection.feeds.length}
            {#each data.collection.feeds as feed}
              <FeedListItem
                {feed}
                onRemove={handleRemoveFeed}
                allowRemove={!feed.link.startsWith('default-') && !isDefaultSelected}
              />
            {/each}
          {:else}
            <div
              class="flex flex-col items-center justify-center space-y-4 rounded-lg border p-8 text-center"
            >
              <h3 class="text-lg font-medium">No feeds yet</h3>
              <p class="text-muted-foreground">Add your first feed to start reading articles.</p>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</main>
