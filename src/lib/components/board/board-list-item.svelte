<script lang="ts">
	import type { Board } from '@/server/data/schema';
	import { Button } from '../ui/button';
	import { calculateAge } from '@/utils';

	export let board: Board;

	let rssFeedsCount = board.rssFeeds?.length || 0;

	let isHovered = false;
</script>

<div
	class="border-x transition-colors first:rounded-t-lg first:border-t last:rounded-b-lg last:shadow hover:bg-muted"
	on:mouseenter={() => (isHovered = true)}
	on:mouseleave={() => (isHovered = false)}
	role="button"
	tabindex="0"
>
	<div class="flex items-center justify-between border-b px-4 py-4">
		<div class="item-body flex flex-col">
			<div class="item-title text-base-content font-semibold">{board.name}</div>
			<div class="item-description text-sm text-muted-foreground">
				Created {calculateAge(board.createdAt, 'long')} • {rssFeedsCount} RSS feeds
			</div>
		</div>
		<div class="item-actions">
			{#if isHovered}
				<Button href="/settings/boards/edit/{board.slug}" size="sm" variant="outline">Edit</Button>
			{/if}
		</div>
	</div>
</div>
