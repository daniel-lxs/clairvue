<script lang="ts">
	import PageContainer from '@/components/page-container.svelte';
	import PageHeader from '@/components/page-header.svelte';
	import RssfeedsTable from '@/components/rssfeeds-table.svelte';
	import Button from '@/components/ui/button/button.svelte';
	import { Input } from '@/components/ui/input';
	import Label from '@/components/ui/label/label.svelte';
	import type { rssFeed } from '@/data/schema';

	const rssFeeds: rssFeed[] = [
		{
			id: '1',
			name: 'Feed 1',
			description: 'Feed 1 description',
			link: 'https://example.com/feed1',
			createdAt: new Date(),
			updatedAt: new Date()
		},
		{
			id: '2',
			name: 'Feed 2',
			description: 'Feed 2 description',
			link: 'https://example.com/feed2',
			createdAt: new Date(),
			updatedAt: new Date()
		},
		{
			id: '3',
			name: 'Feed 3',
			description: 'Feed 3 description',
			link: 'https://example.com/feed3',
			createdAt: new Date(),
			updatedAt: new Date()
		},
		{
			id: '4',
			name: 'Feed 4',
			description: 'Feed 4 description',
			link: 'https://example.com/feed4',
			createdAt: new Date(),
			updatedAt: new Date()
		},
		{
			id: '5',
			name: 'Feed 5',
			description: 'Feed 5 description',
			link: 'https://example.com/feed5',
			createdAt: new Date(),
			updatedAt: new Date()
		},
		{
			id: '6',
			name: 'Feed 6',
			description: 'Feed 6 description',
			link: 'https://example.com/feed6',
			createdAt: new Date(),
			updatedAt: new Date()
		},
		{
			id: '7',
			name: 'Feed 7',
			description: 'Feed 7 description',
			link: 'https://example.com/feed7',
			createdAt: new Date(),
			updatedAt: new Date()
		}
	];
</script>

<PageContainer>
	<PageHeader title="New feed" />
	<div class="space-y-8">
		<div class="space-y-2">
			<Label>Feed name</Label>
			<Input type="text" placeholder="Feed name" />
		</div>
		<RssfeedsTable {rssFeeds} />
		<div>
			<Button>Save feed</Button>
		</div>
	</div>
</PageContainer>
