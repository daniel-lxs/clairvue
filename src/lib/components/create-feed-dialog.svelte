<script lang="ts">
	import { Button, buttonVariants } from '@/components/ui/button';
	import * as Dialog from '@/components/ui/dialog';
	import { Input } from '@/components/ui/input';
	import { Label } from '@/components/ui/label';
	import type { RssFeed } from '@/data/schema';
	import { getRssInfo } from '../api';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{
		create: Pick<RssFeed, 'name' | 'description' | 'link'>;
	}>();

	let newRssFeed: Pick<RssFeed, 'name' | 'description' | 'link'>;
	let open: boolean;
	let link: string = '';

	async function save() {
		const rssInfo = await getRssInfo(link);

		if (rssInfo) {
			newRssFeed.name = rssInfo.title;
			newRssFeed.description = rssInfo.description;
			newRssFeed.link = link;
			open = false;
			dispatch('create', newRssFeed);
			return;
		}

		//TODO: handle error
	}

	$: link = newRssFeed.link;
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger class={buttonVariants({ variant: 'secondary' })}>Add RSS feed</Dialog.Trigger>

	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Create RSS feed</Dialog.Title>
			<Dialog.Description>Create a new RSS feed. Click save when you're done</Dialog.Description>
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
			<Button type="submit" on:click={save}>Save</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
