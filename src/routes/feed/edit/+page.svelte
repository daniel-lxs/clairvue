<script lang="ts">
	import PageContainer from '@/components/page-container.svelte';
	import PageHeader from '@/components/page-header.svelte';
	import RssfeedsTable from '@/components/rssfeeds-table.svelte';
	import Button from '@/components/ui/button/button.svelte';
	import { Input } from '@/components/ui/input';
	import Label from '@/components/ui/label/label.svelte';
	import type { Board, RssFeed } from '@/data/schema';
	import { writable } from 'svelte/store';
	import type { PageData } from './$types';
	import { createBoard, createRssFeeds, updateBoard } from '@/api';
	import type { CreateRssFeedDto } from '../../../lib/dto/rssFeedDto';
	import { Loader2 } from 'lucide-svelte';

	export let data: PageData;

	let isLoading = false;
	let board = writable<Board>();

	$: if (data.board) {
		board.set(data.board);
	} else {
		board.set({
			id: '',
			slug: '',
			name: '',
			editCode: '',
			rssFeeds: [],
			createdAt: new Date(),
			updatedAt: new Date()
		});
	}

	async function saveBoard() {
		isLoading = true;
		try {
			console.log(JSON.stringify($board));
			if ($board.id !== '') {
				await updateBoard($board.id, $board.name);
			} else {
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
		} catch (error) {
			//TODO: Handle error
			console.error('An error occurred while saving the board:', error);
			// Perform error handling - e.g. display error message to user
		} finally {
			isLoading = false;
		}
	}
</script>

<PageContainer>
	<PageHeader title="New feed" />

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
</PageContainer>
