<script lang="ts">
	import * as Card from '@/components/ui/card';
	import type { Article } from '@/server/data/schema';
	import { calculateAge, truncateDescription } from '@/utils';
	import { badgeVariants } from '@/components/ui/badge';
	import ArticleCardImage from './article-card-image.svelte';

	export let article: Article;

	$: imageLoaded = false;
	$: imageError = false;
	$: age = calculateAge(new Date(article.publishedAt));
	$: domain = new URL(article.link).hostname.replace(/^www\./, '');
</script>

<div>
	{#if article.image && !imageError}
		<Card.Root class="flex px-2 py-6 transition-colors hover:bg-muted">
			<div class="flex w-full flex-row">
				<div class="flex w-3/4 flex-col justify-between">
					<div>
						<Card.Header class="pb-2 pt-0">
							<Card.Title tag="h1" class="text-lg font-bold transition-colors hover:text-primary">
								<a href="/article/{article.id}">{article.title}</a>
							</Card.Title>
							<Card.Description class="text-sm">
								<a href={article.link} class="hover:text-primary">({domain})</a>
							</Card.Description>
						</Card.Header>
						<Card.Content class="py-2">
							{#if article.description}
								<p>
									{truncateDescription(article.description, 160)}
								</p>
							{/if}
						</Card.Content>
					</div>
					<Card.Footer class="flex items-center pb-0 pr-6 pt-2">
						<span class="text-sm text-muted-foreground">{age} ago</span>
						<a
							href="/dashboard"
							class="ml-4 {badgeVariants({ variant: 'default' })} transition-colors hover:bg-muted"
							>{article.rssFeed?.name}</a
						>
					</Card.Footer>
				</div>
				<div class="w-1/4 pr-4">
					<ArticleCardImage {article} bind:imageLoaded bind:imageError />
				</div>
			</div>
		</Card.Root>
	{:else}
		<Card.Root class="flex px-2 py-4 transition-colors hover:bg-muted">
			<div class="flex w-full flex-col">
				<Card.Header class="pb-2 pt-2">
					<Card.Title tag="h1" class="text-lg font-bold transition-colors hover:text-primary">
						<a href="/article/{article.id}">{article.title}</a>
					</Card.Title>
					<Card.Description class="text-sm">
						<a href={article.link} class="hover:text-primary">({domain})</a>
					</Card.Description>
				</Card.Header>
				{#if article.description}
					<Card.Content class="py-2">
						<p>
							{truncateDescription(article.description, 200)}
						</p>
					</Card.Content>
				{/if}
				<Card.Footer class="flex items-center pb-2 pr-6 pt-2">
					<span class="text-sm text-muted-foreground">{age} ago</span>
					<a
						href="/dashboard"
						class="ml-4 {badgeVariants({ variant: 'default' })} transition-colors hover:bg-muted"
						>{article.rssFeed?.name}</a
					>
				</Card.Footer>
			</div>
		</Card.Root>
	{/if}
</div>
