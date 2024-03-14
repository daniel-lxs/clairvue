<script lang="ts">
	import * as Card from '@/components/ui/card';
	import type { Article } from '@/server/data/schema';
	import { calculateAge, truncateDescription } from '@/utils';
	import ArticleCardImage from './article-card-image.svelte';

	export let article: Article;

	$: imageLoaded = false;
	$: imageError = false;
	$: imageObjectType = 'cover';
	$: age = calculateAge(new Date(article.publishedAt));
	$: domain = new URL(article.link).hostname.replace(/^www\./, '');

	let imageWidth: number;
	let imageHeight: number;
	let aspectRatio: number;

	let descriptionLength: number = 300;

	const loadImage = () => {
		if (!article.image || imageError) {
			descriptionLength = 500;
			return;
		}
		const img = new Image();
		img.src = article.image as string;
		img.onload = () => {
			imageWidth = img.naturalWidth;
			imageHeight = img.naturalHeight;
			aspectRatio = imageWidth / imageHeight;

			if (aspectRatio <= 1.3) {
				imageObjectType = 'contain';
				descriptionLength = 200;
			}

			imageLoaded = true;
		};
	};

	$: {
		if (imageError) {
			descriptionLength = 500;
		}
	}

	loadImage();
</script>

<div>
	<Card.Root class="flex  shadow-lg transition-colors hover:bg-muted ">
		<div class="flex w-full flex-col">
			<div class="flex w-full justify-between p-4">
				<div class="flex flex-col justify-between">
					<div class="space-y-2">
						<Card.Header class="space-y-2 p-0">
							<div class="flex items-center">
								<a
									href="/dashboard"
									class="mr-2 text-sm font-bold transition-colors hover:text-primary"
									>{article.rssFeed?.name}</a
								>
							</div>
							<div class="flex flex-col gap-1">
								<Card.Title tag="h1" class="text-xl font-bold transition-colors hover:text-primary">
									<a href="/article/{article.id}">{article.title}</a>
								</Card.Title>
								<Card.Description class="text-md">
									<a href={article.link} class="hover:text-primary">({domain})</a>
									<span class="text-md text-muted-foreground"> - {age} ago</span>
								</Card.Description>
							</div>
						</Card.Header>
						<Card.Content class="p-0">
							{#if article.description}
								<p class="text-md">
									{truncateDescription(article.description, descriptionLength)}
								</p>
							{/if}
						</Card.Content>
					</div>
				</div>
				{#if article.image && !imageError && imageObjectType === 'contain'}
					<div class="ml-4 w-1/3 p-2">
						<ArticleCardImage
							{article}
							bind:imageLoaded
							bind:imageError
							objectType={imageObjectType}
						/>
					</div>
				{/if}
			</div>
			{#if article.image && !imageError && imageObjectType === 'cover'}
				<div class="w-full">
					<ArticleCardImage
						{article}
						bind:imageLoaded
						bind:imageError
						objectType={imageObjectType}
					/>
				</div>
			{/if}
		</div>
	</Card.Root>
</div>
