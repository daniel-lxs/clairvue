<script lang="ts">
  import { enhance } from '$app/forms';
  import * as Card from '@/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import Button from '@/components/ui/button/button.svelte';
  import { AlertOctagon } from 'lucide-svelte';

  interface Props {
    form: { errors: string[] } | null;
  }

  let { form }: Props = $props();

  let errors: string[] = $state([]);
  let password: string = $state('');
  let confirmPassword: string = $state('');

  function checkPassword() {
    errors = errors.filter((e) => e !== 'Passwords do not match!');
    if ((password || confirmPassword) && password !== confirmPassword) {
      errors = [...errors, 'Passwords do not match!'];
    }
  }

  $effect(() => {
    if (form?.errors) {
      errors = form.errors;
    }
  });
</script>

<Card.Root class="relative flex flex-col items-center justify-center space-y-4 p-6 text-center">
  <Card.Header>
    <Card.Title tag="h1" class="text-3xl font-bold">Register a New clairvue Account</Card.Title>
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
          <Input
            type="password"
            name="password"
            id="password"
            bind:value={password}
            on:input={() => checkPassword()}
          />
        </div>
        <div>
          <Label for="confirmPassword">Confirm Password</Label>
          <Input
            type="password"
            name="confirmPassword"
            id="confirmPassword"
            bind:value={confirmPassword}
            on:input={() => checkPassword()}
          />
        </div>
        <Button type="submit" class="w-full">Continue</Button>
      </form>

      {#if errors.length > 0}
        <div class="mt-3 space-y-2">
          {#each errors as error}
            <p class="flex items-center gap-2 text-sm font-bold text-red-500">
              <AlertOctagon />{error}
            </p>
          {/each}
        </div>
      {/if}
    </div>
  </Card.Content>
  <Card.Footer>
    <a href="/auth/login" class="text-muted-foreground text-sm">Already have an account? Sign in</a>
  </Card.Footer>
</Card.Root>
