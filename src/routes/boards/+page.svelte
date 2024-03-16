<script lang="ts">
	import * as Page from '@/components/page';
	import type { PageData } from './$types';

	export let data: PageData;

	console.log(JSON.stringify(data));
</script>

<Page.Container>
	<Page.Header title="Boards" />

	<div>
		{#if data && data.boards && data.boards.length > 0}
			{#each data.boards as board}
				<a href="/board/{board.slug}">{board.name}</a>
			{/each}
		{/if}
	</div>
</Page.Container>
