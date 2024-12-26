<script lang="ts">
  import { enhance } from '$app/forms';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import Button from '@/components/ui/button/button.svelte';
  import * as Card from '@/components/ui/card';
  import { AlertOctagon } from 'lucide-svelte';

  interface Props {
    form: {
      errors?: string[];
    } | null;
  }

  let { form }: Props = $props();
</script>

<Card.Root
  class="relative flex w-full flex-col items-center justify-center space-y-4 p-6 text-center"
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

      {#if form?.errors}
        <div class="mt-3 space-y-2">
          {#each form.errors as error}
            <p class="flex items-center gap-2 text-sm font-bold text-red-500">
              <AlertOctagon />{error}
            </p>
          {/each}
        </div>
      {/if}
    </div>
  </Card.Content>
  <Card.Footer>
    <a href="/auth/signup" class="text-muted-foreground text-sm">Don't have an account? Sign up</a>
  </Card.Footer>
</Card.Root>
