<script lang="ts">
	import { Button, buttonVariants } from '@/components/ui/button';
	import * as Dialog from '@/components/ui/dialog';
	import { Input } from '@/components/ui/input';
	import { Label } from '@/components/ui/label';
	import { getFeedInfo } from '@/api';
	import { createEventDispatcher } from 'svelte';
	import { Loader2 } from 'lucide-svelte';
	import type { NewFeed } from '@/types/NewFeed';

	const dispatch = createEventDispatcher<{
		create: NewFeed;
	}>();

	let isLoading = false;
	let hasError = false;
	let newFeed: NewFeed = {
		id: '',
		name: '',
		description: '',
		link: '',
		type: 'rss'
	};
	let open: boolean;
	let link: string = '';

	async function save() {
		isLoading = true;
		const feedInfo = await getFeedInfo(link);

		if (feedInfo) {
			newFeed.name = feedInfo.title;
			newFeed.description = feedInfo.description;
			newFeed.link = link;

			open = false;
			isLoading = false;
			hasError = false;
			link = '';

			dispatch('create', newFeed);
			return;
		}

		hasError = true;
		isLoading = false;
	}

	$: if (open === false) {
		newFeed = {
			id: '',
			name: '',
			description: '',
			link: '',
			type: 'rss'
		};
		link = '';
		hasError = false;
		isLoading = false;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger class={buttonVariants({ variant: 'outline' })}>Add new feed</Dialog.Trigger>

	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Create new feed</Dialog.Title>
			<Dialog.Description>Create a new feed. Click save when you're done</Dialog.Description>
		</Dialog.Header>

		<div class="grid gap-4 py-4">
			<div class="grid grid-cols-4 items-center gap-4">
				<Label class="text-right">Link</Label>
				<Input id="name" bind:value={link} class="col-span-3" />
			</div>

			<p class="text-center text-xs text-muted-foreground {hasError ? 'text-red-500' : ''}">
				{#if hasError}
					Invalid feed link
				{:else}
					The name and description will be fetched automatically
				{/if}
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
