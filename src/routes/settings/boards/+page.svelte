<script lang="ts">
	import * as Page from '@/components/page';
	import BoardListItem from '@/components/board/board-list-item.svelte';
	import type { PageData } from './$types';
	import { Button } from '@/components/ui/button';
	import { Label } from '@/components/ui/label';

	export let data: PageData;
</script>

<Page.Container>
	<Page.Header title="My boards" subtitle="Manage your boards" />
	<div class="space-y-4">
		<div class="mb-4 flex items-center justify-between">
			<div class="space-y-2">
				<Label for="feedUrls" class="font-semibold">Boards</Label>
				<p class="text-sm text-muted-foreground">Add, edit or remove boards</p>
			</div>
			<Button href="/settings/boards/add" variant="outline">Add new board</Button>
		</div>

		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
			{#if data && data.boards && data.boards.length > 0}
				{#each data.boards as board}
					<BoardListItem {board} />
				{/each}
			{/if}
		</div>
	</div>
</Page.Container>
