<script lang="ts">
	import PageContainer from '@/components/page-container.svelte';
	import type { Board } from '@/data/schema';
	import ArticleCard from '@/components/article-card.svelte';
	import PageHeader from '@/components/page-header.svelte';

	//Mock data
	let date = new Date();
	let feedData: Board = {
		id: '1',
		slug: 'tech-news',
		name: 'Tech News',
		rssFeed: {
			id: '101',
			name: 'Tech News RSS',
			description: 'A feed for the latest tech news',
			link: 'http://example.com/tech-news-rss',
			feeds: [],
			articles: [
				{
					id: '201',
					title: 'New Tech Innovation',
					rssFeedId: '101',
					excerpt: 'This is a new article about new tech innovation',
					link: 'http://example.com/new-tech-innovation',
					pubDate: new Date('2024-02-15T00:00:00.000Z')
				},
				{
					id: '202',
					title: 'Breaking AI Advancements',
					rssFeedId: '101',
					excerpt: 'This is a new article about breaking AI advancements',
					link: 'http://example.com/breaking-ai-advancements',
					pubDate: new Date('2024-02-13T00:00:00.000Z')
				},
				{
					id: '203',
					title: 'Robotics in Healthcare',
					rssFeedId: '101',
					excerpt: 'This is a new article about robotics in healthcare',
					link: 'http://example.com/robotics-in-healthcare',
					pubDate: new Date('2024-02-14T00:00:00.000Z')
				},
				{
					id: '204',
					title: 'Future of Quantum Computing',
					rssFeedId: '101',
					excerpt: 'This is a new article about future of quantum computing',
					link: 'http://example.com/future-of-quantum-computing',
					pubDate: new Date('2024-02-15T00:00:00.000Z')
				}
			],
			createdAt: date,
			updatedAt: date
		},
		editCode: 'abc123',
		createdAt: date,
		updatedAt: date
	};
</script>

<PageContainer>
	<PageHeader title={feedData.name} />
	<div class="space-y-2">
		{#each feedData.rssFeed.articles as article}
			<ArticleCard {article} rssFeedName={feedData.rssFeed.name} />
		{/each}
	</div></PageContainer
>
