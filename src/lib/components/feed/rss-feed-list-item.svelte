<script lang="ts">
	import type { Board, RssFeed } from '@/server/data/schema';
	import { calculateAge } from '@/utils';
	import { writable } from 'svelte/store';
	import { Button } from '../ui/button';
	import { Trash } from 'lucide-svelte';

	export let board = writable<Board>();
	export let rssFeed: RssFeed;

	let isHovered = false;

	function deleteRssFeed() {
		if ($board && $board.rssFeeds) {
			$board.rssFeeds = $board.rssFeeds.filter((rssFeed) => rssFeed.id !== rssFeed.id);
		}
	}
</script>

<div
	class="rounded-lg border transition-colors hover:bg-muted"
	on:mouseenter={() => (isHovered = true)}
	on:mouseleave={() => (isHovered = false)}
	role="button"
	tabindex="0"
>
	<div class="flex items-center justify-between px-4 py-4">
		<div class="item-body mr-4 flex flex-col">
			<div class="text-sm font-semibold">{rssFeed.name}</div>
			<div class="item-description text-sm text-muted-foreground">
				Created {calculateAge(rssFeed.createdAt, 'long')} • {rssFeed.articleCount || 0} articles
			</div>
		</div>
		<div class="item-actions">
			{#if isHovered}
				<Button on:click={deleteRssFeed} variant="destructive" size="icon"
					><Trash class="h-4 w-4" /></Button
				>
			{/if}
		</div>
	</div>
</div>
