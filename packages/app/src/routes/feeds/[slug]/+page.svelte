<script lang="ts">
  import FeedListItem from '@/components/feed/feed-list-item.svelte';
  import CreateFeedDialog from '@/components/feed/create-feed-dialog.svelte';
  import type { PageData } from './$types';
  import { Label } from '@/components/ui/label';
  import collectionApi from '@/api/collection';
  import feedApi from '@/api/feed';
  import { showToast } from '$lib/utils';
  import type { Feed, NewFeed, Collection } from '@clairvue/types';

  import * as Breadcrumb from '@/components/ui/breadcrumb';
  import * as Select from '@/components/ui/select';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import { goto, invalidate } from '$app/navigation';
  import CollectionsSidebar from '@/components/collection/collections-sidebar.svelte';
  import CollectionDialog from '@/components/collection/collection-dialog.svelte';
  import type { Selected } from 'bits-ui';
  import { FolderPlus, MoreHorizontal, Plus, Pencil } from 'lucide-svelte';
  import Button from '@/components/ui/button/button.svelte';
  import PageSkeleton from '@/components/page-skeleton.svelte';

  interface Props {
    data: PageData;
  }
  let { data }: Props = $props();

  let isDefaultSelected = $derived(data.collection.id === data.defaultCollection.id);
  let selectedCollection = $derived(data.collection);
  let pageTitle = $derived(isDefaultSelected ? 'All Feeds' : data.collection.name || 'All Feeds');

  let openFeedDialog = $state(false);
  let openCollectionDialog = $state(false);
  let editCollection = $state(false);

  async function handleRemoveFeed(feed: Feed) {
    if (!data.collection.id.includes('default-')) {
      const result = await collectionApi.removeFeedFromCollection(data.collection.id, feed.id);

      result.match({
        ok: async () => {
          await invalidate('feeds');
          showToast(
            'Feed deleted',
            `Feed "${feed.name}" has been removed from "${data.collection.name}".`
          );
        },
        err: (error) => {
          showToast('Error', error.message || 'Failed to remove feed.', 'error');
        }
      });
    } else {
      const result = await feedApi.deleteFeed(feed.id);
      result.match({
        ok: async () => {
          await invalidate('feeds');
          showToast('Feed deleted', `Feed "${feed.name}" has been deleted.`);
        },
        err: (error) => {
          showToast('Error', error.message || 'Failed to remove feed.', 'error');
        }
      });
    }
  }

  async function handleSaveFeed(newFeed: NewFeed) {
    if (!data.collection) return;

    const createFeedResult = await feedApi.createFeeds([
      {
        ...newFeed,
        collectionId: data.collection.id,
        description: newFeed.description || undefined
      }
    ]);

    createFeedResult.match({
      err: (error) => {
        showToast('Error', error.message || 'Failed to create feed.', 'error');
      },
      ok: async (feeds) => {
        await invalidate('feeds');
        showToast('Feed created', `Feed "${feeds[0].name}" has been created.`);
      }
    });
  }

  async function handleSaveCollection(collection: Collection) {
    await invalidate('feeds');
    showToast('Collection updated', `Collection "${collection.name}" has been updated.`);
  }

  async function handleEditCollection(collection: Collection) {
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

<CreateFeedDialog onSave={handleSaveFeed} bind:open={openFeedDialog} showButton={false} />
<CollectionDialog
  feeds={data.defaultCollection.feeds}
  collection={selectedCollection}
  edit={editCollection}
  onSave={handleSaveCollection}
  onEdit={handleEditCollection}
  bind:open={openCollectionDialog}
  showButton={false}
/>

{#snippet sidebar()}
  <CollectionsSidebar
    collections={data.collections}
    {selectedCollection}
    feeds={data.defaultCollection.feeds ?? []}
    onCreateNewCollection={() => {
      openCollectionDialog = true;
    }}
  />
{/snippet}

{#snippet content()}
  <div class="mb-4 mt-2">
    <Breadcrumb.Root>
      <Breadcrumb.List>
        <Breadcrumb.Link href="/feeds/all-feeds">Feeds</Breadcrumb.Link>
        {#if !isDefaultSelected}
          <Breadcrumb.Separator />
          <Breadcrumb.Page>{pageTitle}</Breadcrumb.Page>
        {/if}
      </Breadcrumb.List>
    </Breadcrumb.Root>
  </div>

  <div class="space-y-4 sm:space-y-6">
    <div class="flex justify-between sm:items-center">
      <div class="space-y-1">
        <Label class="text-lg sm:text-xl" href="/feeds/{selectedCollection.slug}">{pageTitle}</Label
        >
        <p class="text-muted-foreground text-sm">
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
            <Button variant="ghost" size="icon">
              <MoreHorizontal class="h-6 w-6" />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Group>
              <DropdownMenu.Item
                on:click={() => {
                  editCollection = false;
                  openCollectionDialog = true;
                }}
              >
                <FolderPlus class="mr-2 h-4 w-4" />
                New collection
              </DropdownMenu.Item>
              {#if !isDefaultSelected}
                <DropdownMenu.Item
                  on:click={() => {
                    editCollection = true;
                    openCollectionDialog = true;
                  }}
                >
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

    <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {#if data.collection.feeds.length}
        {#each data.collection.feeds as feed}
          <FeedListItem
            {feed}
            onRemove={handleRemoveFeed}
            disableActions={feed.link.startsWith('default-') && isDefaultSelected}
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
{/snippet}

<PageSkeleton {sidebar} {content} />
