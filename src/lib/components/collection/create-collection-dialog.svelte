<script lang="ts">
  import { Button, buttonVariants } from '@/components/ui/button';
  import * as Dialog from '@/components/ui/dialog';
  import { Input } from '@/components/ui/input';
  import { Label } from '@/components/ui/label';
  import { Checkbox } from '@/components/ui/checkbox';
  import { ScrollArea } from '@/components/ui/scroll-area';
  import { Loader2, PlusCircle } from 'lucide-svelte';
  import type { Feed, Collection } from '@/server/data/schema';

  let {
    feeds,
    onCollectionCreated,
    children
  }: {
    feeds: Feed[];
    onCollectionCreated: (collection: Collection) => void;
    children?: import('svelte').Snippet;
  } = $props();

  let isLoading = $state(false);
  let hasError = $state(false);
  let errorMessage = $state('');
  let open = $state(false);
  let name = $state('');
  let selectedFeeds = $state<string[]>([]);

  async function save() {
    if (!name.trim()) {
      hasError = true;
      errorMessage = 'Collection name is required';
      return;
    }

    isLoading = true;
    try {
      const response = await fetch('/api/collection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          slug: name.toLowerCase().replace(/\s+/g, '-')
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create collection');
      }

      const collection = await response.json();

      // Assign selected feeds to the collection
      if (selectedFeeds.length > 0) {
        const assignResponse = await fetch('/api/collection', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id: collection.id,
            feedIds: selectedFeeds
          })
        });

        if (!assignResponse.ok) {
          throw new Error('Failed to assign feeds to collection');
        }
      }

      onCollectionCreated(collection);
      open = false;
      isLoading = false;
      hasError = false;
      name = '';
      selectedFeeds = [];
    } catch (error) {
      hasError = true;
      errorMessage = error instanceof Error ? error.message : 'An error occurred';
      isLoading = false;
    }
  }

  function toggleFeed(feedId: string) {
    selectedFeeds = selectedFeeds.includes(feedId)
      ? selectedFeeds.filter((id) => id !== feedId)
      : [...selectedFeeds, feedId];
  }

  $effect.pre(() => {
    if (open === false) {
      selectedFeeds = [];
      hasError = false;
      errorMessage = '';
      name = '';
      isLoading = false;
    }
  });
</script>

<Dialog.Root bind:open>
  {#if children}
    {@render children?.()}
  {:else}
    <Dialog.Trigger class={buttonVariants({ variant: 'outline' })}>
      <PlusCircle class="mr-2 h-4 w-4" />Create new collection
    </Dialog.Trigger>
  {/if}

  <Dialog.Content class="sm:max-w-[425px]">
    <Dialog.Header>
      <Dialog.Title>Create new collection</Dialog.Title>
      <Dialog.Description>Create a new collection and select feeds to add to it.</Dialog.Description
      >
    </Dialog.Header>

    <div class="grid gap-6 py-4">
      <div class="flex w-full max-w-sm flex-col gap-2">
        <Label for="name">Name</Label>
        <Input id="name" bind:value={name} class="col-span-3" />
      </div>

      <div class="grid grid-cols-1 gap-2">
        <Label>Select feeds</Label>
        <ScrollArea class="h-72 rounded-md border">
          <div class="space-y-4 p-4">
            {#each feeds as feed (feed.id)}
              <div class="flex items-center space-x-2">
                <Checkbox
                  id={feed.id}
                  checked={selectedFeeds.includes(feed.id)}
                  onCheckedChange={() => toggleFeed(feed.id)}
                />
                <label
                  for={feed.id}
                  class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {feed.name}
                </label>
              </div>
            {/each}
          </div>
        </ScrollArea>
      </div>

      {#if hasError}
        <p class="text-center text-xs text-red-500">
          {errorMessage}
        </p>
      {/if}
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
