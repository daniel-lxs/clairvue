<script lang="ts">
	import { enhance } from '$app/forms';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import Button from '@/components/ui/button/button.svelte';
	import * as Card from '@/components/ui/card';
	import { AlertOctagon } from 'lucide-svelte';

	import type { ActionData } from './$types';

	export let form: ActionData;
</script>

<div class="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center">
	<div class="flex-grow"></div>
	<div class="-mt-8 flex w-full justify-center">
		<Card.Root
			class="relative flex flex-col items-center justify-center space-y-4 p-6 text-center md:w-1/3"
		>
			<Card.Header>
				<Card.Title tag="h1" class="text-3xl font-bold">Login to Clairvue</Card.Title>
			</Card.Header>
			<Card.Content class="flex w-full items-center justify-center">
				<div class="flex w-full max-w-sm flex-col text-left">
					<form method="post" use:enhance class="space-y-4">
						<div>
							<Label for="username">Username</Label>
							<Input name="username" id="username" />
						</div>
						<div>
							<Label for="password">Password</Label>
							<Input type="password" name="password" id="password" />
						</div>
						<Button type="submit" class="w-full">Login</Button>
					</form>

					<p
						class="mt-3 flex items-center gap-2 text-sm font-bold text-red-500 opacity-0 {form?.errors &&
						Object.keys(form?.errors).length > 0
							? 'opacity-100 transition-opacity'
							: ''}"
					>
						<AlertOctagon />{form?.message ||
							form?.errors?.['username']?.[0] ||
							form?.errors?.['password']?.[0]}
					</p>
				</div>
			</Card.Content>
			<Card.Footer>
				<a href="/signup" class="text-sm text-muted-foreground">Don't have an account? Sign up</a>
			</Card.Footer>
		</Card.Root>
	</div>
	<div class="flex-grow"></div>
</div>
