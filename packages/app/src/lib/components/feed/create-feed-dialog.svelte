<script lang="ts">
  import { Button } from '@/components/ui/button';
  import * as Dialog from '@/components/ui/dialog';
  import * as Drawer from '@/components/ui/drawer';
  import { Input } from '@/components/ui/input';
  import { Label } from '@/components/ui/label';
  import feedApi from '@/api/feed';
  import { Loader2, PlusCircle } from 'lucide-svelte';
  import { type NewFeed } from '@clairvue/types';
  import { z } from 'zod';
  import { MediaQuery } from 'runed';
  import type { Builder } from 'bits-ui';

  let {
    onSave,
    showButton,
    open = $bindable(false),
    children
  }: {
    onSave: (feed: NewFeed) => void;
    showButton?: boolean;
    children?: import('svelte').Snippet;
    open?: boolean;
  } = $props();

  const isDesktop = new MediaQuery('(min-width: 768px)');
  let isLoading = $state(false);
  let hasError = $state(false);
  let errorMessage = $state('');
  let showFeedInfo = $state(false);

  let newFeed: NewFeed = $state({
    id: '',
    name: '',
    description: '',
    link: '',
    type: 'rss'
  });
  let link: string = $state('');

  const linkSchema = z.string().url();

  async function getFeedInfo() {
    isLoading = true;
    hasError = false;
    errorMessage = '';
    showFeedInfo = false;

    const parsedLink = linkSchema.safeParse(link);
    if (!parsedLink.success) {
      hasError = true;
      errorMessage = 'Invalid URL format';
      isLoading = false;
      return;
    }

    const result = await feedApi.getFeedInfo(parsedLink.data);

    result.match({
      ok: (feedInfo) => {
        newFeed = {
          id: '',
          name: feedInfo.title,
          description: feedInfo.description ?? '',
          link: feedInfo.url,
          type: feedInfo.type
        };
        showFeedInfo = true;
        isLoading = false;
      },
      err: (error) => {
        hasError = true;
        errorMessage = error.message || 'Invalid feed link';
        isLoading = false;
      }
    });
  }

  function save() {
    onSave(newFeed);
    open = false;
  }

  $effect.pre(() => {
    if (open === false) {
      newFeed = {
        id: '',
        name: '',
        description: '',
        link: '',
        type: 'rss'
      };
      link = '';
      hasError = false;
      errorMessage = '';
      isLoading = false;
      showFeedInfo = false;
    }
  });
</script>

{#snippet formContent()}
  <div class="grid gap-4">
    {#if !showFeedInfo}
      <div class="grid gap-2">
        <Label for="link">Link</Label>
        <Input id="link" bind:value={link} class="col-span-3" disabled={isLoading} />
      </div>

      {#if hasError}
        <p class="text-center text-sm text-red-500">
          {errorMessage}
        </p>
      {/if}

      <Button disabled={isLoading} type="submit" on:click={getFeedInfo}>
        {#if isLoading}
          <Loader2 class="mr-2 h-4 w-4 animate-spin" />
          Checking feed...
        {:else}
          Check feed
        {/if}
      </Button>
    {:else}
      <div class="grid gap-4">
        <div class="grid gap-2">
          <Label>Feed name</Label>
          <p class="bg-muted rounded-md p-2 text-sm">{newFeed.name}</p>
        </div>

        {#if newFeed.description}
          <div class="grid gap-2">
            <Label>Description</Label>
            <p class="bg-muted rounded-md p-2 text-sm">{newFeed.description}</p>
          </div>
        {/if}

        <div class="grid gap-2">
          <Label>Type</Label>
          <p class="bg-muted rounded-md p-2 text-sm capitalize">{newFeed.type}</p>
        </div>

        <Button on:click={save}>Save feed</Button>
      </div>
    {/if}
  </div>
{/snippet}

{#snippet triggerContent(builder: Builder)}
  {#if children}
    {@render children?.()}
  {:else if showButton}
    <Button variant="default" builders={[builder]}>
      <PlusCircle class="h-4 w-4 sm:mr-2" />
      <span class="hidden sm:inline">Add new feed</span>
    </Button>
  {/if}
{/snippet}

{#if isDesktop.matches}
  <Dialog.Root bind:open>
    <Dialog.Trigger asChild let:builder>
      {@render triggerContent(builder)}
    </Dialog.Trigger>
    <Dialog.Content class="sm:max-w-[425px]">
      <Dialog.Header>
        <Dialog.Title>Create new feed</Dialog.Title>
        <Dialog.Description>Add a new feed by providing its URL</Dialog.Description>
      </Dialog.Header>
      <div class="py-4">
        {@render formContent()}
      </div>
    </Dialog.Content>
  </Dialog.Root>
{:else}
  <Drawer.Root bind:open>
    <Drawer.Trigger asChild let:builder>
      {@render triggerContent(builder)}
    </Drawer.Trigger>
    <Drawer.Content>
      <Drawer.Header class="text-left">
        <Drawer.Title>Create new feed</Drawer.Title>
        <Drawer.Description>Add a new feed by providing its URL</Drawer.Description>
      </Drawer.Header>
      <div class="px-4">
        {@render formContent()}
      </div>
      <Drawer.Footer class="pt-2">
        <Drawer.Close asChild let:builder>
          <Button variant="outline" builders={[builder]}>Cancel</Button>
        </Drawer.Close>
      </Drawer.Footer>
    </Drawer.Content>
  </Drawer.Root>
{/if}
