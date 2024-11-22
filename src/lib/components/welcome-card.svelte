<script lang="ts">
  import { preventDefault } from 'svelte/legacy';

  import * as Card from '@/components/ui/card';
  import { Input } from '@/components/ui/input';
  import Button from '@/components/ui/button/button.svelte';
  import { goto } from '$app/navigation';

  let isInputVisible = $state(false);
  let collectionCode = $state('');

  function onCollectionCodeSubmit() {
    if (collectionCode) {
      window.location.href = `/collection/${collectionCode}`;
    }
  }

  function navigateToLogin() {
    goto('/auth/login');
  }

  function navigateToSignup() {
    goto('/auth/signup');
  }
</script>

<Card.Root
  class="relative flex h-4/5 w-full flex-col items-center justify-center space-y-4 rounded-lg border bg-card p-8 text-center text-card-foreground shadow-sm md:w-1/2"
>
  <Card.Header>
    <Card.Title tag="h1" class="text-4xl font-bold">Welcome to ReadableSS</Card.Title>
    <Card.Description class="text-md">A minimalistic and light feed reader</Card.Description>
  </Card.Header>
  <Card.Content class="w-full space-y-6">
    <div class="flex flex-col items-center gap-4">
      <div class="flex gap-4">
        <Button variant="outline" on:click={navigateToLogin}>Login</Button>
        <Button on:click={navigateToSignup}>Sign Up</Button>
      </div>
      <span class="text-muted-foreground">or</span>
    </div>

    {#if isInputVisible}
      <form
        onsubmit={preventDefault(onCollectionCodeSubmit)}
        class="mx-auto flex w-full max-w-sm items-center space-x-2"
      >
        <Input
          type="text"
          autofocus
          placeholder="Enter your collection code"
          bind:value={collectionCode}
        />
        <Button type="submit">Submit</Button>
      </form>
    {:else}
      <Button variant="outline" on:click={() => (isInputVisible = true)}
        >Enter collection code</Button
      >
    {/if}
    <div class="flex flex-col items-center gap-4">
      <span class="text-muted-foreground">or</span>
      <Button>Create a new collection</Button>
    </div>
  </Card.Content>
  <Card.Footer>
    <a href="/#" class="text-sm text-muted-foreground hover:underline">What is this?</a>
  </Card.Footer>
</Card.Root>
