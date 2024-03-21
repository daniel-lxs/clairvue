<script lang="ts">
	import { Button, buttonVariants } from '@/components/ui/button';
	import * as Dialog from '@/components/ui/dialog';
	import { Input } from '@/components/ui/input';
	import { Label } from '@/components/ui/label';
	import { getRssInfo } from '@/api';
	import { createEventDispatcher } from 'svelte';
	import { Loader2 } from 'lucide-svelte';
	import type { NewRssFeed } from '@/types/NewRssFeed';

	const dispatch = createEventDispatcher<{
		create: NewRssFeed;
	}>();

	let isLoading = false;
	let newRssFeed: NewRssFeed = {
		id: '',
		name: '',
		description: '',
		link: ''
	};
	let open: boolean;
	let link: string = '';

	async function save() {
		isLoading = true;
		const rssInfo = await getRssInfo(link);

		if (rssInfo) {
			newRssFeed.name = rssInfo.title;
			newRssFeed.description = rssInfo.description;
			newRssFeed.link = link;

			open = false;
			isLoading = false;

			dispatch('create', newRssFeed);
			return;
		}

		//TODO: handle error
		isLoading = false;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger class={buttonVariants({ variant: 'outline' })}>Add RSS feed</Dialog.Trigger>

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
