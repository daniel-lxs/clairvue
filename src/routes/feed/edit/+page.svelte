<script lang="ts">
	import PageContainer from '@/components/page-container.svelte';
	import PageHeader from '@/components/page-header.svelte';
	import RssfeedsTable from '@/components/rssfeeds-table.svelte';
	import Button from '@/components/ui/button/button.svelte';
	import { Input } from '@/components/ui/input';
	import Label from '@/components/ui/label/label.svelte';
	import type { Board } from '@/data/schema';
	import { writable } from 'svelte/store';
	import type { PageData } from './$types';
	import { createBoard, createRssFeeds, updateBoard } from '@/api';
	import type { CreateRssFeedDto } from '../../../lib/dto/rssFeedDto';

	export let data: PageData;

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
		if ($board.id !== '') {
			await updateBoard($board.id, $board.name);
		} else {
			const newBoard = await createBoard($board.name);

			if (!newBoard) return; // TODO: handle error

			const newRssFeeds: CreateRssFeedDto[] = $board.rssFeeds.map((rssFeed) => ({
				name: rssFeed.name,
				description: rssFeed.description,
				link: rssFeed.link,
				boardId: newBoard.id
			}));

			if (newRssFeeds.length > 0) {
				await createRssFeeds(newRssFeeds);
			}
		}
	}
</script>

<PageContainer>
	<PageHeader title="New feed" />
	<div class="space-y-8">
		<div class="space-y-2">
			<Label>Feed name</Label>
			<Input type="text" placeholder="Feed name" />
		</div>
		<RssfeedsTable {board} />
		<div>
			<Button on:click={saveBoard}>Save feed</Button>
		</div>
	</div>
</PageContainer>
