<script lang="ts">
  import * as Page from '@/components/page';
  import FeedListItem from '@/components/feed/feed-list-item.svelte';
  import CreateFeedDialog from '@/components/feed/create-feed-dialog.svelte';
  import type { PageData } from './$types';
  import { Button } from '@/components/ui/button';
  import { Label } from '@/components/ui/label';
  import { Folder } from 'lucide-svelte';
  import { createFeeds, deleteFeedFromBoard } from '@/api';
  import showToast from '@/utils/showToast';
  import type { NewFeed } from '@/types/NewFeed';
  import type { Feed } from '@/server/data/schema';

  interface Props {
    data: PageData;
  }
  let { data }: Props = $props();

  let selectedBoard = $state(data.defaultBoard);
  let currentFeeds = $state<Feed[]>(data.defaultBoard?.feeds || []);
  let pageTitle = $state('All Feeds');

  $effect(() => {
    currentFeeds = selectedBoard?.feeds || [];
    pageTitle = selectedBoard?.id.startsWith('default-')
      ? 'All Feeds'
      : selectedBoard?.name || 'All Feeds';
  });

  async function handleDeleteFeed(feed: Feed) {
    if (selectedBoard) {
      await deleteFeedFromBoard(selectedBoard.id, feed.id);
      // Refresh the page to update the feed list
      currentFeeds = currentFeeds.filter((f) => f.id !== feed.id);
      showToast('Feed deleted', `Feed "${feed.name}" has been deleted.`);
    }
  }

  async function saveFeed(newFeed: NewFeed) {
    if (!selectedBoard) return;

    const createFeedResult = (
      await createFeeds([{ ...newFeed, description: newFeed.description || undefined }])
    )[0];

    if (!createFeedResult || createFeedResult.result === 'error') {
      showToast('Failed to create new feed', 'Please try again later', 'error');
      throw new Error('Failed to create new feed');
    }

    showToast('Feed created', `Feed "${newFeed.name}" has been created.`);
    currentFeeds = [...currentFeeds, createFeedResult.data];
  }
</script>

<Page.Container>
  <div class="flex h-[calc(100vh-4rem)]">
    <!-- Sidebar -->
    <div class="w-64 space-y-4 border-r p-4">
      <Button
        variant="ghost"
        class="w-full justify-start gap-2"
        on:click={() => (selectedBoard = data.defaultBoard)}
      >
        <Folder class="h-4 w-4" />
        <span>All Feeds</span>
      </Button>

      {#if data.boards.length > 0}
        <div class="space-y-1">
          <Label class="px-2 text-sm font-medium">Collections</Label>
          {#each data.boards as board}
            <Button
              variant="ghost"
              class="w-full justify-start gap-2"
              on:click={() => (selectedBoard = board)}
            >
              <Folder class="h-4 w-4" />
              <span>{board.name}</span>
            </Button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Main Content -->
    <div class="flex-1 p-6">
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <Label class="text-lg font-medium">{pageTitle}</Label>
            <p class="text-sm text-muted-foreground">
              {#if selectedBoard?.id.startsWith('default-')}
                View and manage all your RSS feeds
              {:else}
                Feeds in {selectedBoard?.name}
              {/if}
            </p>
          </div>
          <CreateFeedDialog create={saveFeed} />
        </div>

        {#if currentFeeds.length > 0}
          <div class="grid grid-cols-1 gap-4">
            {#each currentFeeds as feed}
              <FeedListItem {feed} deleteFeed={handleDeleteFeed} />
            {/each}
          </div>
        {:else}
          <div
            class="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed"
          >
            <div class="space-y-2 text-center">
              <p class="font-medium text-muted-foreground">No feeds yet</p>
              <p class="text-sm text-muted-foreground">
                {#if selectedBoard?.id.startsWith('default-')}
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
</Page.Container>
