<script lang="ts">
  import { goto } from '$app/navigation';
  import { createBoard, createFeeds } from '@/api';
  import CreateFeedDialog from '@/components/feed/create-feed-dialog.svelte';
  import FeedListItem from '@/components/feed/feed-list-item.svelte';
  import * as Page from '@/components/page';
  import AlertDialog from '@/components/shared/alert.dialog.svelte';
  import Button from '@/components/ui/button/button.svelte';
  import { Input } from '@/components/ui/input';
  import Label from '@/components/ui/label/label.svelte';
  import type { Board, Feed } from '@/server/data/schema';
  import type { CreateFeedDto } from '@/server/dto/feedDto';
  import type { NewFeed } from '@/types/NewFeed';
  import { Loader2 } from 'lucide-svelte';
  import { toast } from 'svelte-sonner';
  import { writable } from 'svelte/store';
  import type { PageServerData } from './$types';

  export let data: PageServerData;

  let isLoading = false;
  let board = writable<Board>();

  //Alert dialog
  let open = false;
  let title = '';
  let message = '';

  board.set({
    id: '',
    slug: '',
    name: '',
    userId: data.userId,
    feeds: [],
    createdAt: new Date(),
    updatedAt: new Date()
  });

  async function saveBoard() {
    isLoading = true;
    try {
      if (!$board.name) {
        showErrorDialog('Board name is required', 'Please enter a board name');
        return;
      }

      if (!$board.feeds || $board.feeds.length === 0) {
        showErrorDialog('No Feeds Added Yet', 'Please add at least one feed');
        return;
      }

      const newBoard = await createBoard($board.name);

      if (!newBoard) {
        showToast('Failed to create new board', 'Please try again later', 'error');
        return;
      }

      const newFeeds: CreateFeedDto[] = $board.feeds.map((feed) => ({
        name: feed.name,
        description: feed.description || undefined,
        link: feed.link
      }));

      if (newFeeds.length > 0) {
        const createFeedResults = await createFeeds(newFeeds, newBoard.id);

        if (
          !createFeedResults ||
          createFeedResults.length === 0 ||
          createFeedResults.some((r) => r.result === 'error') ||
          createFeedResults.some((r) => !r.data)
        ) {
          showToast('Failed to create new feed', 'Please try again later', 'error');
          return;
        }

        newBoard.feeds = createFeedResults.map((c) => ({ ...(c.data as Feed) }));
      }

      board.set(newBoard);
      goto('/settings/boards');
    } catch (error) {
      console.error('An error occurred while saving the board:', error);
      showToast(
        'Error',
        'An error occurred while saving the board, please try again later',
        'error'
      );
    } finally {
      isLoading = false;
    }
  }

  function showErrorDialog(title: string, message: string) {
    title = title;
    message = message;
    open = true;
  }

  function showToast(
    title: string,
    description: string,
    toastState: 'error' | 'success' | 'info' | 'warning' | 'loading' = 'success',
    action?: {
      label: string;
      onClick: () => void;
    }
  ) {
    toast[toastState](title, {
      description,
      action
    });
  }

  function saveFeed(e: CustomEvent<NewFeed>) {
    if ($board && $board.feeds) {
      const isDuplcate = $board.feeds.find((feed) => feed.link === e.detail.link);
      if (isDuplcate) {
        showErrorDialog('Duplicate Feed', 'This feed is already added');
        return;
      }
    }

    const newFeed = {
      ...e.detail,
      id: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      syncedAt: new Date(),
      boardId: $board.id
    };
    if ($board && $board.feeds) {
      $board.feeds = [...$board.feeds, newFeed];
    }
  }

  function removeFeed(feed: Feed) {
    if ($board && $board.feeds) {
      $board.feeds = $board.feeds.filter((f) => f.link !== feed.link);
    }
  }
</script>

<svelte:head>
  <title>New board - Clairvue</title>
</svelte:head>

<AlertDialog bind:open {title} {message} />

<Page.Container>
  <Page.Header title="New board" subtitle="Create a new board" />

  <div class="space-y-12">
    <div class="space-y-2">
      <Label for="feedName" class=" font-semibold">Board name</Label>
      <Input
        id="feedName"
        type="text"
        placeholder="Feed name"
        class="w-full"
        bind:value={$board.name}
      />
    </div>

    <div>
      <div class="mb-4 flex items-center justify-between">
        <div class="space-y-2">
          <Label for="feedUrls" class=" font-semibold">Feeds</Label>
          <p class="text-sm text-muted-foreground">Add, edit or remove feeds</p>
        </div>

        <CreateFeedDialog on:create={saveFeed} />
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {#if !$board.feeds || $board.feeds.length === 0}
          <div class="col-span-full mt-4 flex flex-col items-center justify-center">
            <h2 class="text-xl font-bold text-foreground">No Feeds Added Yet</h2>
            <p class="mt-2 text-center text-muted-foreground">
              Add feeds to your board to get started. You can add multiple feeds to monitor
              different sources in one place.
            </p>
          </div>
        {:else}
          {#each $board.feeds as feed}
            <FeedListItem {feed} on:delete={() => removeFeed(feed)} />
          {/each}
        {/if}
      </div>
    </div>
  </div>
  <svelte:fragment slot="footer">
    <Button disabled={isLoading} type="submit" on:click={saveBoard}>
      {#if isLoading}
        <Loader2 class="mr-2 h-4 w-4 animate-spin" />
        Saving...
      {:else}
        Save feed
      {/if}
    </Button>
  </svelte:fragment>
</Page.Container>
