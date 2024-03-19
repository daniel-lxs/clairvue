<script lang="ts">
	import * as Page from '@/components/page';
	import Button from '@/components/ui/button/button.svelte';
	import { Input } from '@/components/ui/input';
	import Label from '@/components/ui/label/label.svelte';
	import type { Board, RssFeed } from '@/server/data/schema';
	import { writable } from 'svelte/store';
	import type { PageData } from './$types';
	import { updateBoard } from '@/api';
	import { Loader2 } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import RssFeedListItem from '@/components/feed/rss-feed-list-item.svelte';
	import CreateFeedDialog from '@/components/feed/create-feed-dialog.svelte';

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
					...(rssFeed.id ? { id: rssFeed.id } : {}),
					name: rssFeed.name,
					description: rssFeed.description,
					link: rssFeed.link,
					boardId: $board.id
				};
			});

			await updateBoard($board.id, $board.name, rssFeeds);
		} catch (error) {
			//TODO: Handle error
			console.error('An error occurred while saving the board:', error);
			// Perform error handling - e.g. display error message to user
		} finally {
			isLoading = false;
		}
	}

	function saveNewRssFeed(e: CustomEvent<Pick<RssFeed, 'name' | 'description' | 'link'>>) {
		const newRssFeed = {
			...e.detail,
			id: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			syncedAt: new Date()
		};

		if ($board && $board.rssFeeds && newRssFeed) {
			$board.rssFeeds = [...$board.rssFeeds, newRssFeed];
		}
	}
</script>

<Page.Container>
	<div class="flex items-center justify-between">
		<Page.Header title="Edit board" subtitle="Edit board name and RSS feeds" />
		<Button disabled={isLoading} type="submit" on:click={saveBoard} variant="default">
			{#if isLoading}
				<Loader2 class="mr-2 h-4 w-4 animate-spin" />
				Saving...
			{:else}
				Save feed
			{/if}
		</Button>
	</div>

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
					<CreateFeedDialog on:create={saveNewRssFeed} />
				{/if}
			</div>

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
				{#each $board.rssFeeds || [] as rssFeed}
					<RssFeedListItem {rssFeed} {board} />
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
