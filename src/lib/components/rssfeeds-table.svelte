<script lang="ts">
	import type { rssFeed } from '@/data/schema';
	import { Label } from '@/components/ui/label';
	import * as Card from '@/components/ui/card';
	import EditFeedDialog from '@/components/edit-feed-dialog.svelte';
	import { Button } from '@/components/ui/button';

	export let rssFeeds: rssFeed[];
</script>

<div>
	{#if rssFeeds}
		<div class="space-y-4">
			<div class="space-y-4">
				<div class="space-y-2">
					<Label for="feedUrls">RSS feeds</Label>
					<p class="text-sm text-muted-foreground">Add, edit or remove RSS feeds</p>
				</div>
				<EditFeedDialog mode="create" />
			</div>
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
								<EditFeedDialog mode="edit" {rssFeed} />
								<Button class="bg-destructive">Delete</Button>
							</div>
						</Card.Footer>
					</Card.Root>
				</div>
			{/each}
		</div>
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
