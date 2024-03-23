<script lang="ts">
	import { goto } from '$app/navigation';
	import { createRssFeeds, deleteFeedFromBoard, updateBoard } from '@/api';
	import CreateFeedDialog from '@/components/feed/create-feed-dialog.svelte';
	import RssFeedListItem from '@/components/feed/rss-feed-list-item.svelte';
	import * as Page from '@/components/page';
	import Button from '@/components/ui/button/button.svelte';
	import { Input } from '@/components/ui/input';
	import Label from '@/components/ui/label/label.svelte';
	import type { Board, RssFeed } from '@/server/data/schema';
	import type { NewRssFeed } from '@/types/NewRssFeed';
	import { toast } from 'svelte-sonner';
	import { writable } from 'svelte/store';
	import type { PageData } from './$types';
	import { debounce } from 'throttle-debounce';
	import BoardSettingsSkeleton from '@/components/board/board-settings-skeleton.svelte';

	export let data: PageData;
	let board = writable<Board>();

	$: loadBoard();

	async function loadBoard() {
		board.set(await data.streamed.board);
	}

	const debounceSaveBoard = debounce(1000, saveBoard);

	async function saveBoard() {
		try {
			if ($board.name && $board.name.length > 0) {
				await updateBoard($board.id, $board.name);
			}
		} catch (error) {
			//TODO: Handle error
			console.error('An error occurred while saving the board:', error);
			// Perform error handling - e.g. display error message to user
		}
	}

	function removeRssFeed(rssFeed: RssFeed) {
		if ($board && $board.rssFeeds) {
			$board.rssFeeds = $board.rssFeeds.filter((f) => f.id !== rssFeed.id);
		}
		deleteFeedFromBoard($board.id, rssFeed.id);

		showToast('RSS feed deleted', `RSS feed "${rssFeed.name}" has been deleted.`);
	}

	async function saveRssFeed(e: CustomEvent<NewRssFeed>) {
		const newRssFeed = {
			...e.detail,
			id: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			syncedAt: new Date(),
			boardId: $board.id
		};

		const createRssFeedResults = await createRssFeeds([newRssFeed], $board.id);

		if (
			!createRssFeedResults ||
			createRssFeedResults.length === 0 ||
			createRssFeedResults.some((r) => r.result === 'error') ||
			createRssFeedResults.some((r) => !r.data)
		) {
			//TODO: Handle error
			throw new Error('Failed to create new RSS feed');
		}

		const createdRssFeed = createRssFeedResults[0].data;

		if ($board.rssFeeds && createdRssFeed) {
			$board.rssFeeds = [...$board.rssFeeds, createdRssFeed];
		}

		showToast('New RSS feed added', `RSS feed "${newRssFeed.name}" has been added to the board.`);

		console.log($board);
	}

	function showToast(
		title: string,
		description: string,
		action?: {
			label: string;
			onClick: () => void;
		}
	) {
		toast.success(title, {
			description,
			action
		});
	}
</script>

<Page.Container>
	{#await data.streamed.board}
		<BoardSettingsSkeleton />
	{:then}
		<Page.Header title="Edit board" subtitle="Edit board name and RSS feeds" />

		<div class="space-y-12">
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
						<Label for="feedUrls" class="font-semibold">RSS feeds</Label>
						<p class="text-sm text-muted-foreground">Add, edit or remove RSS feeds</p>
					</div>

					<CreateFeedDialog on:create={saveRssFeed} />
				</div>

				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
					{#each $board.rssFeeds || [] as rssFeed}
						<RssFeedListItem {rssFeed} on:delete={() => removeRssFeed(rssFeed)} />
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
