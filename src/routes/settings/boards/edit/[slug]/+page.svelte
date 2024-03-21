<script lang="ts">
	import * as Page from '@/components/page';
	import Button from '@/components/ui/button/button.svelte';
	import { Input } from '@/components/ui/input';
	import Label from '@/components/ui/label/label.svelte';
	import type { Board, RssFeed } from '@/server/data/schema';
	import { writable } from 'svelte/store';
	import type { PageData } from './$types';
	import { createRssFeeds, deleteFeedFromBoard, updateBoard } from '@/api';
	import { goto } from '$app/navigation';
	import RssFeedListItem from '@/components/feed/rss-feed-list-item.svelte';
	import CreateFeedDialog from '@/components/feed/create-feed-dialog.svelte';
	import { toast } from 'svelte-sonner';
	import type { NewRssFeed } from '@/types/NewRssFeed';

	export let data: PageData;

	let isLoading = false;
	let board = writable<Board>();

	$: if (data.board) {
		board.set(data.board);
	} else {
		goto('/board/new');
	}

	async function saveBoard() {
		isLoading = true;
		try {
			const rssFeeds = $board.rssFeeds?.map((rssFeed) => {
				return {
					id: rssFeed.id,
					name: rssFeed.name,
					description: rssFeed.description,
					link: rssFeed.link,
					boardId: $board.id
				};
			});
			await updateBoard($board.id, $board.name);
		} catch (error) {
			//TODO: Handle error
			console.error('An error occurred while saving the board:', error);
			// Perform error handling - e.g. display error message to user
		} finally {
			isLoading = false;
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
	<Page.Header title="Edit board" subtitle="Edit board name and RSS feeds" />

	<div class="space-y-12">
		<div class="space-y-2">
			<Label for="feedName" class="font-semibold">Feed name</Label>
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
					<Label for="feedUrls" class="font-semibold">RSS feeds</Label>
					<p class="text-sm text-muted-foreground">Add, edit or remove RSS feeds</p>
				</div>
				{#if $board?.rssFeeds && $board?.rssFeeds.length > 0}
					<CreateFeedDialog on:create={saveRssFeed} />
				{/if}
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

				<Button variant="destructive" disabled={isLoading} on:click={() => {}}>Delete board</Button>
			</div>
		</div>
	</div>
</Page.Container>
