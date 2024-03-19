<script lang="ts">
	import * as Card from '@/components/ui/card';
	import type { Article } from '@/server/data/schema';
	import { calculateAge, truncateDescription } from '@/utils';
	import ArticleCardImage from './article-card-image.svelte';
	import { Skeleton } from '../ui/skeleton';
	import { BookOpen } from 'lucide-svelte';
	import { onMount } from 'svelte';

	export let article: Article;

	$: imageLoaded = false;
	$: imageError = false;
	$: imageType = 'wide';
	$: age = calculateAge(new Date(article.publishedAt));
	$: imageWidth = 0;
	$: imageHeight = 0;
	$: aspectRatio = 0;

	let isMobile = false;

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

			if (aspectRatio <= 1.3 || imageWidth < 300) {
				imageType = 'square';
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

	setTimeout(() => {
		if (!imageLoaded) {
			imageError = true;
		}
	}, 5000);

	onMount(() => {
		isMobile = window.innerWidth <= 768;
	});
</script>

<div>
	<Card.Root class="flex shadow-lg">
		<div class="flex w-full flex-col">
			{#if article.image && !imageError && imageType === 'wide'}
				{#if imageLoaded}
					<div class="w-full">
						<ArticleCardImage {article} bind:imageLoaded bind:imageError type={imageType} />
					</div>
				{:else}
					<Skeleton class="h-48 object-cover" />
				{/if}
			{/if}
			<div class="space-y-2 p-4">
				<div class="flex w-full justify-between">
					<div class="flex w-full flex-col justify-between">
						<div class="space-y-2">
							<Card.Header class="p-0">
								<a
									href="/dashboard"
									class="text-xs font-bold transition-colors hover:text-primary sm:text-sm"
									>{article.rssFeed?.name}</a
								>
								<div class="flex flex-col gap-1">
									<Card.Title
										tag="h1"
										class="text-lg font-bold transition-colors hover:text-primary sm:text-xl"
									>
										<a href="/article/{article.id}">{article.title}</a>
									</Card.Title>
									<Card.Description class="sm:text-md text-sm">
										<div class="flex items-center">
											<a href={article.link} class="hover:text-primary">({article.siteName})</a>
											<span class="text-md ml-1 text-muted-foreground">• {age} ago </span>
											{#if article.readable}
												<div class="ml-2" title="readable">
													<BookOpen class="h-4 w-4" />
												</div>
											{/if}
										</div>
									</Card.Description>
								</div>
							</Card.Header>
							{#if !isMobile || imageType === 'wide'}
								<Card.Content class="p-0">
									{#if article.description}
										<p class="text-md">
											{truncateDescription(article.description, descriptionLength)}
										</p>
									{/if}
								</Card.Content>
							{/if}
						</div>
					</div>
					{#if article.image && !imageError && imageType === 'square'}
						{#if imageLoaded}
							<div class="ml-4 pl-2">
								<ArticleCardImage {article} bind:imageLoaded bind:imageError type={imageType} />
							</div>
						{:else}
							<Skeleton class="h-48 object-cover" />
						{/if}
					{/if}
				</div>
				{#if isMobile && imageType === 'square'}
					<Card.Content class="p-0">
						{#if article.description}
							<p class="text-md">
								{truncateDescription(article.description, descriptionLength)}
							</p>
						{/if}
					</Card.Content>
				{/if}
			</div>
		</div>
	</Card.Root>
</div>
