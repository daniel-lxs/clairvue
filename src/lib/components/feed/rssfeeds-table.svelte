<script lang="ts">
	import type { Board, RssFeed } from '@/server/data/schema';
	import { Label } from '@/components/ui/label';
	import * as Card from '@/components/ui/card';
	import EditFeedDialog from '@/components/feed/edit-feed-dialog.svelte';
	import { Button } from '@/components/ui/button';
	import { type Writable } from 'svelte/store';
	import CreateFeedDialog from './create-feed-dialog.svelte';

	export let board: Writable<Board>;

	$: rssFeeds = $board.rssFeeds || [];

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

	function editRssFeed(e: CustomEvent<RssFeed>) {
		if ($board && $board.rssFeeds) {
			$board.rssFeeds = $board.rssFeeds.map((rssFeed) => {
				if (rssFeed.id === e.detail.id) {
					return e.detail;
				}
				return rssFeed;
			});
		}
	}
</script>

<div class="space-y-4">
	<div class="space-y-4">
		<div class="space-y-2">
			<Label for="feedUrls">RSS feeds</Label>
			<p class="text-sm text-muted-foreground">Add, edit or remove RSS feeds</p>
		</div>
		{#if $board?.rssFeeds && $board?.rssFeeds.length > 0}
			<CreateFeedDialog on:create={saveNewRssFeed} />
		{/if}
	</div>
	{#if $board?.rssFeeds && $board?.rssFeeds.length > 0}
		{#each rssFeeds as rssFeed, i (i)}
			<div class="hover-trigger">
				<Card.Root class="relative transition-colors hover:bg-muted">
					<Card.Header class="pb-2 pt-6">
						<Card.Title>
							<a href={rssFeed.link} target="_blank">{rssFeed.name}</a>
						</Card.Title>
					</Card.Header>
					<Card.Content class="py-2">
						<p>
							{rssFeed.description}
						</p>
					</Card.Content>
					<Card.Footer>
						<a href={rssFeed.link} target="_blank" class="hover:text-primary">{rssFeed.link}</a>
						<div class="flex-grow"></div>
						<div class="edit-delete-buttons space-x-2">
							<EditFeedDialog on:edit={editRssFeed} feed={rssFeed} />
							<Button class="bg-destructive">Delete</Button>
						</div>
					</Card.Footer>
				</Card.Root>
			</div>
		{/each}
	{:else}
		<Card.Root class="flex flex-col items-center space-y-12 p-4">
			<Card.Header class="pb-2 pt-4">
				<Card.Title>
					<h2 class="text-xl font-bold">No RSS Feeds Found</h2>
				</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-2 py-2 text-center">
				<p class="text-muted-foreground">
					It looks like this board doesn't have any RSS feeds added yet.
				</p>
				<p class="text-muted-foreground">You can start by adding a new RSS feed.</p>
			</Card.Content>
			<Card.Footer>
				<CreateFeedDialog on:create={saveNewRssFeed} />
			</Card.Footer>
		</Card.Root>
	{/if}
</div>

<style lang="postcss">
	.edit-delete-buttons {
		@apply transition-opacity;
	}

	.edit-delete-buttons {
		@apply opacity-0;
	}

	.hover-trigger:hover .edit-delete-buttons {
		@apply opacity-100;
	}
</style>
