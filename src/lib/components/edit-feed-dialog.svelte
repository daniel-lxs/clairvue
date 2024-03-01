<script lang="ts">
	import { Button, buttonVariants } from '@/components/ui/button';
	import * as Dialog from '@/components/ui/dialog';
	import { Input } from '@/components/ui/input';
	import { Label } from '@/components/ui/label';
	import type { RssFeed } from '@/server/data/schema';
	import { getRssInfo } from '../api';
	import { createEventDispatcher } from 'svelte';
	import { Loader2 } from 'lucide-svelte';

	const dispatch = createEventDispatcher<{
		edit: RssFeed;
	}>();

	export let feed: RssFeed;

	let isLoading = false;
	let open: boolean;
	let link: string = '';

	async function save() {
		isLoading = true;
		const rssInfo = await getRssInfo(link);

		if (rssInfo) {
			feed.name = rssInfo.title;
			feed.description = rssInfo.description;
			feed.link = link;
			open = false;
			isLoading = false;
			dispatch('edit', feed);
			return;
		}

		//TODO: handle error
		isLoading = false;
	}

	$: if (feed) {
		link = feed.link;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger class={buttonVariants({ variant: 'default' })}>Edit</Dialog.Trigger>

	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Edit RSS feed</Dialog.Title>
			<Dialog.Description
				>Edit the link of the RSS feed. Click save when you're done</Dialog.Description
			>
		</Dialog.Header>
		<div class="grid gap-4 py-4">
			<div class="grid grid-cols-4 items-center gap-4">
				<Label class="text-right">Link</Label>
				<Input id="name" bind:value={link} class="col-span-3" />
			</div>
			<p class="text-center text-xs text-muted-foreground">
				The name and description will be fetched automatically
			</p>
		</div>
		<Dialog.Footer>
			<Button disabled={isLoading} type="submit" on:click={save}>
				{#if isLoading}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					Saving...
				{:else}
					Save
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
