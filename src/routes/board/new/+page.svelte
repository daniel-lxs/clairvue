<script lang="ts">
	import * as Page from '@/components/page';
	import RssfeedsTable from '@/components/feed/rssfeeds-table.svelte';
	import Button from '@/components/ui/button/button.svelte';
	import { Input } from '@/components/ui/input';
	import Label from '@/components/ui/label/label.svelte';
	import AlertDialog from '@/components/shared/alert.dialog.svelte';
	import type { Board, RssFeed } from '@/server/data/schema';
	import { writable } from 'svelte/store';
	import { createBoard, createRssFeeds } from '@/api';
	import type { CreateRssFeedDto } from '@/server/dto/rssFeedDto';
	import { Loader2 } from 'lucide-svelte';
	import { type PageData } from './$types';

	export let data: PageData;

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
					link: rssFeed.link,
					boardId: newBoard.id
				}));

				if (newRssFeeds.length > 0) {
					const createRssFeedResults = await createRssFeeds(newRssFeeds);

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
</script>

<AlertDialog {open} {title} {message} />

<Page.Container>
	<Page.Header title="New feed" />

	<div class="space-y-8">
		<div class="space-y-2">
			<Label>Feed name</Label>
			<Input type="text" placeholder="Feed name" bind:value={$board.name} />
		</div>
		<RssfeedsTable {board} />
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
