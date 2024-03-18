<script lang="ts">
	import * as Page from '@/components/page';
	import BoardListItem from '@/components/board/board-list-item.svelte';
	import type { PageData } from './$types';
	import { Button } from '@/components/ui/button';

	export let data: PageData;
</script>

<Page.Container>
	<Page.Header title="Boards" subtitle="Add, edit or remove boards" />
	<div class="space-y-4">
		<div class="flex">
			<Button href="/board/new" variant="outline">Add new board</Button>
		</div>

		<div>
			{#if data && data.boards && data.boards.length > 0}
				{#each data.boards as board}
					<BoardListItem {board} />
				{/each}
			{/if}
		</div>
	</div>
</Page.Container>
