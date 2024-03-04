<script lang="ts">
	import { enhance } from '$app/forms';
	import * as Card from '@/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import Button from '@/components/ui/button/button.svelte';
</script>

<div class="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center">
	<div class="flex-grow"></div>
	<div class="-mt-8 flex w-full justify-center">
		<Card.Root
			class="relative flex h-4/5 w-full flex-col items-center justify-center space-y-4  p-6 text-center md:w-1/3"
		>
			<Card.Header>
				<Card.Title tag="h1" class="text-3xl font-bold">Register a New Clairvue Account</Card.Title>
			</Card.Header>
			<Card.Content class="flex w-full items-center justify-center">
				<div class="flex w-full max-w-sm flex-col text-left">
					<form method="post" use:enhance>
						<Label for="username">Username</Label>
						<Input name="username" id="username" /><br />
						<Label for="password">Password</Label>
						<Input type="password" name="password" id="password" /><br />

						<Button type="submit" class="w-full">Continue</Button>
					</form>
				</div>
			</Card.Content>
			<Card.Footer>
				<a href="/signin" class="text-sm text-muted-foreground">Already have an account? Sign in</a>
			</Card.Footer>
		</Card.Root>
	</div>
	<div class="flex-grow"></div>
</div>
