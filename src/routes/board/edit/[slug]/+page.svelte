<script lang="ts">
	import * as Page from '@/components/page';
	import RssfeedsTable from '@/components/feed/rssfeeds-table.svelte';
	import Button from '@/components/ui/button/button.svelte';
	import { Input } from '@/components/ui/input';
	import Label from '@/components/ui/label/label.svelte';
	import type { Board } from '@/server/data/schema';
	import { writable } from 'svelte/store';
	import type { PageData } from '../$types';
	import { updateBoard } from '@/api';
	import { Loader2 } from 'lucide-svelte';
	import { goto } from '$app/navigation';

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
</script>

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
