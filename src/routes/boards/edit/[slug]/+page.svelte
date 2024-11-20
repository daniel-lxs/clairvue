<script lang="ts">
  import { run } from 'svelte/legacy';

  import { createFeeds, deleteFeedFromBoard, updateBoard } from '@/api';
  import CreateFeedDialog from '@/components/feed/create-feed-dialog.svelte';
  import FeedListItem from '@/components/feed/feed-list-item.svelte';
  import * as Page from '@/components/page';
  import Button from '@/components/ui/button/button.svelte';
  import { Input } from '@/components/ui/input';
  import Label from '@/components/ui/label/label.svelte';
  import type { Board, Feed } from '@/server/data/schema';
  import type { NewFeed } from '@/types/NewFeed';
  import { toast } from 'svelte-sonner';
  import { writable } from 'svelte/store';
  import type { PageData } from './$types';
  import { debounce } from 'throttle-debounce';
  import BoardSettingsSkeleton from '@/components/board/board-settings-skeleton.svelte';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
  let board = writable<Board>();

  async function loadBoard() {
    board.set(await data.streamed.board);
  }

  const debounceSaveBoard = debounce(1000, saveBoard);

  async function saveBoard() {
    try {
      if ($board.name && $board.name.length > 0 && $board.feeds && $board.feeds.length > 0) {
        await updateBoard($board.id, $board.name);
      }
    } catch (error) {
      showToast('An error occurred while saving the board', 'Please try again later', 'error');
      console.error('An error occurred while saving the board:', error);
    }
  }

  function removeFeed(feed: Feed) {
    if ($board && $board.feeds) {
      $board.feeds = $board.feeds.filter((f) => f.id !== feed.id);
    }
    deleteFeedFromBoard($board.id, feed.id);

    showToast('Feed deleted', `Feed "${feed.name}" has been deleted.`);
  }

  async function saveFeed(e: CustomEvent<NewFeed>) {
    const newFeed = {
      name: e.detail.name,
      link: e.detail.link,
      description: e.detail.description || undefined,
      boardId: $board.id
    };

    const createFeedResult = (await createFeeds([newFeed]))[0];

    if (!createFeedResult || createFeedResult.result === 'error') {
      showToast('Failed to create new feed', 'Please try again later', 'error');
      throw new Error('Failed to create new feed');
    }

    const createdFeed = createFeedResult.data;

    if ($board.feeds) {
      $board.feeds = [...$board.feeds, createdFeed];
    }

    showToast('New feed added', `"${newFeed.name}" has been added to the board.`);
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
  run(() => {
    loadBoard();
  });
</script>

<svelte:head>
  <title>Edit board - Clairvue</title>
</svelte:head>

<Page.Container>
  {#await data.streamed.board}
    <BoardSettingsSkeleton />
  {:then}
    <Page.Header title="Edit board" subtitle="Edit board name and feeds" />

    <div class="w-full space-y-12">
      <div class="space-y-2">
        <Label for="boardName" class="font-semibold">Board name</Label>
        <Input
          id="boardName"
          type="text"
          placeholder="Board name"
          class="w-full"
          bind:value={$board.name}
          on:input={debounceSaveBoard}
        />
      </div>

      <div>
        <div class="mb-4 flex items-center justify-between">
          <div class="space-y-2">
            <Label for="feedUrls" class="font-semibold">Feeds</Label>
            <p class="text-sm text-muted-foreground">Add, edit or remove feeds</p>
          </div>

          <CreateFeedDialog on:create={saveFeed} />
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {#each $board.feeds || [] as feed}
            <FeedListItem {feed} deleteFeed={removeFeed} />
          {/each}
        </div>
      </div>

      <div class="space-y-2">
        <Label for="boardDelete" class="font-semibold">Danger zone</Label>

        <div
          class="flex w-full items-center justify-between rounded-lg border border-destructive p-4"
        >
          <div>
            <p class="text-sm font-semibold">Delete this board</p>
            <p class="text-sm text-muted-foreground">This action cannot be undone</p>
          </div>

          <Button variant="destructive" on:click={() => {}}>Delete board</Button>
        </div>
      </div>
    </div>
  {/await}
</Page.Container>
