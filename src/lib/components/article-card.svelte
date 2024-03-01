<script lang="ts">
	import * as Card from '@/components/ui/card';
	import type { Article } from '@/server/data/schema';
	import { calculateAge } from '@/utils';
	import { badgeVariants } from '@/components/ui/badge';

	export let article: Article;

	let age = calculateAge(new Date(article.publishedAt));

	const domainMatch = article.link.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n?]+)\//i);
	let domain = domainMatch?.[1];
</script>

<Card.Root class="flex px-6 py-4 transition-colors hover:bg-muted">
	{#if article.image}
		<div class="flex w-1/4 items-center justify-center">
			<div class="relative h-full max-h-48 min-h-48 w-full max-w-full overflow-hidden rounded-lg">
				<div class="absolute inset-0 bg-gray-200 blur-sm filter">
					<a href="/article/{article.id}">
						<img
							src={article.image}
							alt={article.title}
							loading="lazy"
							class="h-full w-full object-cover"
							style="height: 100%; width: 100%;"
						/>
					</a>
				</div>
				<a href="/article/{article.id}">
					<img
						src={article.image}
						alt={article.title}
						loading="lazy"
						class="absolute inset-0 h-full w-full object-contain"
					/>
				</a>
			</div>
		</div>
	{:else}
		<div class="w-1/4 flex-grow rounded-lg bg-muted"></div>
	{/if}
	<div class="flex w-3/4 flex-col">
		<Card.Header class="pb-2 pt-2">
			<Card.Title tag="h1" class="text-lg font-bold transition-colors hover:text-primary">
				<a href="/article/{article.id}">{article.title}</a>
			</Card.Title>
			<Card.Description class="text-sm">
				<a href={article.link} class="hover:text-primary">({domain})</a>
			</Card.Description>
		</Card.Header>
		<Card.Content class="flex-grow py-2">
			{#if article.description}
				<p>
					{article.description.length > 150
						? article.description.substring(0, 150) + '...'
						: article.description}
				</p>
			{/if}
		</Card.Content>
		<Card.Footer class="w-full pb-0 pr-0 pt-2">
			<span class="text-sm text-muted-foreground">{age} ago</span>
			<div class="flex-grow"></div>
			<a
				href="/dashboard"
				class="{badgeVariants({
					variant: 'default'
				})} transition-colors hover:bg-muted">{article.rssFeed?.name}</a
			>
		</Card.Footer>
	</div>
</Card.Root>
