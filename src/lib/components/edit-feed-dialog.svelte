<script lang="ts">
	import { Button, buttonVariants } from '@/components/ui/button';
	import * as Dialog from '@/components/ui/dialog';
	import { Input } from '@/components/ui/input';
	import { Label } from '@/components/ui/label';
	import type { rssFeed } from '@/data/schema';

	export let mode: keyof typeof settings = 'create';
	export let rssFeed: rssFeed | undefined = undefined;

	let open: boolean;
	let link = rssFeed?.link ?? '';

	type ButtonVariants = keyof typeof buttonVariants.variants.variant;

	type DialogSettings = {
		edit: {
			buttonLabel: string;
			buttonVariant: ButtonVariants;
			title: string;
			description: string;
		};
		create: {
			buttonLabel: string;
			buttonVariant: ButtonVariants;
			title: string;
			description: string;
		};
	};

	let settings: DialogSettings = {
		edit: {
			buttonLabel: 'Edit',
			buttonVariant: 'default',
			title: 'Edit RSS feed',
			description: "Edit the link of the RSS feed. Click save when you're done"
		},
		create: {
			buttonLabel: 'Add RSS feed',
			buttonVariant: 'secondary',
			title: 'Create RSS feed',
			description: "Create a new RSS feed. Click save when you're done"
		}
	};

	async function onSave() {
		if (mode === 'edit') {
			if (!rssFeed) {
				return; // TODO: Show error
			}

			const rssInfo: { title: string; description: string } = await fetch(
				`/api/rssFeedInfo?link=${btoa(link)}`
			).then((response) => response.json());

			if (!rssInfo || !rssInfo.title || !rssInfo.description) {
				return; // TODO: Show error
			}

			const response = await fetch('/api/rssFeed', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					id: rssFeed.id,
					name: rssInfo.title,
					description: rssFeed.description,
					link: rssFeed.link
				})
			});

			// TODO: Handle errors
			if (response.ok) {
				open = false;
			}
		} else if (mode === 'create') {
			const rssInfo: { title: string; description: string } = await fetch(
				`/api/rssFeedInfo?link=${btoa(link)}`
			).then((response) => response.json());

			if (!rssInfo || !rssInfo.title || !rssInfo.description) {
				return; // TODO: Show error
			}

			const response = await fetch('/api/rssFeed', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: rssInfo.title,
					description: rssInfo.description,
					link: link
				})
			});

			// TODO: Handle errors
			if (response.ok) {
				open = false;
			}
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger class={buttonVariants({ variant: settings[mode].buttonVariant })}>
		{settings[mode].buttonLabel}</Dialog.Trigger
	>

	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>{settings[mode].title}</Dialog.Title>
			<Dialog.Description>{settings[mode].description}</Dialog.Description>
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
			<Button type="submit" on:click={onSave}>Save</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
