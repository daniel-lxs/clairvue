<script lang="ts">
	import { createBoard, createRssFeeds } from '@/api';
	import CreateFeedDialog from '@/components/feed/create-feed-dialog.svelte';
	import RssFeedListItem from '@/components/feed/rss-feed-list-item.svelte';
	import * as Page from '@/components/page';
	import AlertDialog from '@/components/shared/alert.dialog.svelte';
	import Button from '@/components/ui/button/button.svelte';
	import { Input } from '@/components/ui/input';
	import Label from '@/components/ui/label/label.svelte';
	import type { Board, RssFeed } from '@/server/data/schema';
	import type { CreateRssFeedDto } from '@/server/dto/rssFeedDto';
	import type { NewRssFeed } from '@/types/NewRssFeed';
	import { Loader2 } from 'lucide-svelte';
	import { writable } from 'svelte/store';
	import type { PageServerData } from './$types';
	import { goto } from '$app/navigation';

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
		rssFeeds: [],
		createdAt: new Date(),
		updatedAt: new Date()
	});

	async function saveBoard() {
		isLoading = true;
		try {
			if ($board.rssFeeds) {
				const newBoard = await createBoard($board.name);

				if (!newBoard) {
					//TODO: Handle error
					throw new Error('Failed to create new board');
				}

				const newRssFeeds: CreateRssFeedDto[] = $board.rssFeeds.map((rssFeed) => ({
					name: rssFeed.name,
					description: rssFeed.description,
					link: rssFeed.link
				}));

				if (newRssFeeds.length > 0) {
					const createRssFeedResults = await createRssFeeds(newRssFeeds, newBoard.id);

					if (
						!createRssFeedResults ||
						createRssFeedResults.length === 0 ||
						createRssFeedResults.some((r) => r.result === 'error') ||
						createRssFeedResults.some((r) => !r.data)
					) {
						//TODO: Handle error
						throw new Error('Failed to create new RSS feeds');
					}

					newBoard.rssFeeds = createRssFeedResults.map((c) => ({ ...(c.data as RssFeed) }));
				}

				board.set(newBoard);
				goto('/settings/boards');
			}

			//TODO: Handle empty board
		} catch (error) {
			console.error('An error occurred while saving the board:', error);
			showErrorDialog('Error', 'An error occurred while saving the board, please try again later');
		} finally {
			isLoading = false;
		}
	}

	function showErrorDialog(title: string, message: string) {
		title = title;
		message = message;
		open = true;
	}

	function saveRssFeed(e: CustomEvent<NewRssFeed>) {
		const newRssFeed = {
			...e.detail,
			id: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			syncedAt: new Date(),
			boardId: $board.id
		};
		if ($board && $board.rssFeeds) $board.rssFeeds = [...$board.rssFeeds, newRssFeed];

		$board.rssFeeds?.push(newRssFeed);
	}

	function removeRssFeed(rssFeed: RssFeed) {
		if ($board && $board.rssFeeds) {
			$board.rssFeeds = $board.rssFeeds.filter((f) => f.id !== rssFeed.id);
		}
	}
</script>

<AlertDialog {open} {title} {message} />

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
					<Label for="feedUrls" class=" font-semibold">RSS feeds</Label>
					<p class="text-sm text-muted-foreground">Add, edit or remove RSS feeds</p>
				</div>

				<CreateFeedDialog on:create={saveRssFeed} />
			</div>

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
				{#if !$board.rssFeeds || $board.rssFeeds.length === 0}
					<div class="col-span-full mt-4 flex flex-col items-center justify-center">
						<h2 class="text-xl font-bold text-foreground">No RSS Feeds Added Yet</h2>
						<p class="mt-2 text-center text-muted-foreground">
							Add RSS feeds to your board to get started. You can add multiple feeds to monitor
							different sources in one place.
						</p>
					</div>
				{:else}
					{#each $board.rssFeeds as rssFeed}
						<RssFeedListItem {rssFeed} on:delete={() => removeRssFeed(rssFeed)} />
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
