<script lang="ts">
	import PageContainer from '@/components/page-container.svelte';
	import PageHeader from '@/components/page-header.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	console.log(JSON.stringify(data));
</script>

<PageContainer>
	<PageHeader title="Boards" />

	<div>
		{#if data && data.boards && data.boards.length > 0}
			{#each data.boards as board}
				<a href="/board/{board.slug}">{board.name}</a>
			{/each}
		{/if}
	</div>
</PageContainer>
