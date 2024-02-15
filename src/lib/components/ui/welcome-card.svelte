<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import Button from './button/button.svelte';

	let isInputVisible = false;
	let feedCode = '';
</script>

<Card.Root
	class="relative flex h-4/5 w-full flex-col items-center justify-center space-y-4 rounded-lg border bg-card p-8 text-center text-card-foreground shadow-sm md:w-1/2"
>
	<Card.Header>
		<Card.Title tag="h1" class="text-4xl font-bold">Welcome to ReadableSS</Card.Title>
		<Card.Description class="text-md">A minimalistic and light RSS reader</Card.Description>
	</Card.Header>
	<Card.Content class="space-y-4">
		{#if isInputVisible}
			<form class="flex w-full max-w-sm items-center space-x-2">
				<Input type="text" autofocus placeholder="Enter your feed code" bind:value={feedCode} />
				<Button type="submit">Submit</Button>
			</form>
		{:else}
			<Button on:click={() => (isInputVisible = true)}>Enter feed code</Button>
		{/if}
		<div class="flex flex-col items-center gap-4">
			<span>Or</span>
			<Button>Create a new feed</Button>
		</div>
	</Card.Content>
	<Card.Footer>
		<a href="/rss" class="text-sm text-muted-foreground">What is this?</a>
	</Card.Footer>
</Card.Root>
