<script lang="ts">
	import * as Card from '@/components/ui/card';
	import type { Article } from '@/server/data/schema';
	import { calculateAge } from '@/utils';
	import { badgeVariants } from '@/components/ui/badge';
	import { Skeleton } from './ui/skeleton';

	export let article: Article;

	$: imageLoaded = false;
	$: age = calculateAge(new Date(article.publishedAt));
	$: domain = new URL(article.link).hostname.replace(/^www\./, '');

	setTimeout(() => {
		if (!imageLoaded) {
			imageLoaded = true;
		}
	}, 100);
</script>

{#if article.image}
	<Card.Root class="flex px-6 py-4 transition-colors hover:bg-muted">
		<div class="flex w-full flex-row">
			<div class="w-1/4 pr-4">
				<div class="relative h-48 w-full overflow-hidden rounded-lg">
					{#if !imageLoaded}
						<Skeleton class="h-full w-full object-cover" />
					{/if}
					<a href="/article/{article.id}">
						<img
							src={article.image}
							alt={article.title}
							loading="lazy"
							class="h-full w-full object-cover opacity-0 blur-md transition-opacity {imageLoaded
								? 'opacity-100'
								: ''}"
							style="height: 100%; width: 100%;"
							on:load={() => {
								imageLoaded = true;
							}}
						/>
					</a>

					<a href="/article/{article.id}">
						<img
							src={article.image}
							alt={article.title}
							loading="lazy"
							class="absolute inset-0 h-full w-full object-contain opacity-0 transition-opacity {imageLoaded
								? 'opacity-100'
								: ''}"
							on:load={() => {
								imageLoaded = true;
							}}
						/>
					</a>
				</div>
			</div>
			<div class="flex w-3/4 flex-col justify-between">
				<div>
					<Card.Header class="pb-2 pt-2">
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
								{article.description.length > 150
									? article.description.substring(0, 150) + '...'
									: article.description}
							</p>
						{/if}
					</Card.Content>
				</div>
				<Card.Footer class="flex items-center justify-between pb-0 pr-0 pt-2">
					<span class="text-sm text-muted-foreground">{age} ago</span>
					<a
						href="/dashboard"
						class="{badgeVariants({
							variant: 'default'
						})} transition-colors hover:bg-muted">{article.rssFeed?.name}</a
					>
				</Card.Footer>
			</div>
		</div>
	</Card.Root>
{:else}
	<Card.Root class="flex py-2  transition-colors hover:bg-muted">
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
						{article.description.length > 150
							? article.description.substring(0, 150) + '...'
							: article.description}
					</p>
				</Card.Content>
			{/if}
			<Card.Footer class="flex items-center justify-between pb-2 pr-6 pt-2">
				<span class="text-sm text-muted-foreground">{age} ago</span>
				<a
					href="/dashboard"
					class="{badgeVariants({
						variant: 'default'
					})} transition-colors hover:bg-muted">{article.rssFeed?.name}</a
				>
			</Card.Footer>
		</div>
	</Card.Root>
{/if}
