<script lang="ts">
  import * as Card from '@/components/ui/card';
  import { Input } from '@/components/ui/input';
  import Button from '@/components/ui/button/button.svelte';

  let isInputVisible = false;
  let boardCode = '';

  function onBoardCodeSubmit() {
    if (boardCode) {
      window.location.href = `/board/${boardCode}`;
    }
  }
</script>

<Card.Root
  class="relative flex h-4/5 w-full flex-col items-center justify-center space-y-4 rounded-lg border bg-card p-8 text-center text-card-foreground shadow-sm md:w-1/2"
>
  <Card.Header>
    <Card.Title tag="h1" class="text-4xl font-bold">Welcome to ReadableSS</Card.Title>
    <Card.Description class="text-md">A minimalistic and light feed reader</Card.Description>
  </Card.Header>
  <Card.Content class="space-y-4">
    {#if isInputVisible}
      <form
        on:submit|preventDefault={onBoardCodeSubmit}
        class="flex w-full max-w-sm items-center space-x-2"
      >
        <Input type="text" autofocus placeholder="Enter your board code" bind:value={boardCode} />
        <Button type="submit">Submit</Button>
      </form>
    {:else}
      <Button on:click={() => (isInputVisible = true)}>Enter board code</Button>
    {/if}
    <div class="flex flex-col items-center gap-4">
      <span>Or</span>
      <Button>Create a new board</Button>
    </div>
  </Card.Content>
  <Card.Footer>
    <a href="/#" class="text-sm text-muted-foreground">What is this?</a>
  </Card.Footer>
</Card.Root>
