<script lang="ts">
	import * as Card from '@/components/ui/card';
	import type { Article } from '@/data/schema';
	import { calculateAge } from '@/utils';
	import { badgeVariants } from '@/components/ui/badge';

	export let article: Article;
	export let rssFeedName: string;

	let age = calculateAge(new Date(article.publishedAt));

	const domainMatch = article.link.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n?]+)\//i);
	let domain = domainMatch?.[1];
</script>

<Card.Root class="transition-colors hover:bg-muted ">
	<Card.Header class="pb-2 pt-6">
		<Card.Title tag="h1" class="text-lg font-bold transition-colors hover:text-primary">
			<a href="/article/{article.id}" target="_blank">{article.title}</a>
		</Card.Title>
		<Card.Description class="text-sm">
			<a href={article.link} target="_blank" class="hover:text-primary">({domain})</a>
		</Card.Description>
	</Card.Header>
	<Card.Content class="py-2">
		<p>
			{article.description}
		</p>
	</Card.Content>
	<Card.Footer>
		<span class="text-sm text-muted-foreground">{age} ago</span>
		<div class="flex-grow"></div>
		<a
			href="/dashboard"
			class="{badgeVariants({
				variant: 'secondary'
			})} hover: bg-muted-foreground text-popover transition-colors hover:text-primary"
			>{rssFeedName}</a
		>
	</Card.Footer>
</Card.Root>
