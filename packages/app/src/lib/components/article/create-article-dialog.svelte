<script lang="ts">
  import { Button } from '@/components/ui/button';
  import * as Dialog from '@/components/ui/dialog';
  import * as Drawer from '@/components/ui/drawer';
  import { Input } from '@/components/ui/input';
  import { Label } from '@/components/ui/label';
  import { Checkbox } from '@/components/ui/checkbox';
  import { Loader2, PlusCircle } from 'lucide-svelte';
  import { z } from 'zod';
  import type { Result } from '@clairvue/types';
  import { MediaQuery } from 'runed';
  import type { Builder } from 'bits-ui';
  import { getArticleMetadata } from '$lib/api/article';

  let {
    save,
    onSave,
    showButton,
    open = $bindable(false),
    children
  }: {
    save: (articleData: {
      title: string;
      url: string;
      makeReadable: boolean;
    }) => Promise<Result<string[], Error>>;
    onSave?: (articleSlugs: string[]) => void;
    showButton?: boolean;
    children?: import('svelte').Snippet;
    open?: boolean;
  } = $props();

  const isDesktop = new MediaQuery('(min-width: 768px)');
  let isLoading = $state(false);
  let hasError = $state(false);
  let errorMessage = $state('');
  let articleData = $state({
    title: '',
    url: '',
    makeReadable: true
  });

  const urlSchema = z.string().url();

  let isLoadingMetadata = $state(false);

  async function handleSave(e: SubmitEvent) {
    e.preventDefault();
    isLoading = true;
    hasError = false;
    errorMessage = '';

    const parsedUrl = urlSchema.safeParse(articleData.url);
    if (!parsedUrl.success) {
      hasError = true;
      errorMessage = 'Invalid URL format';
      isLoading = false;
      return;
    }

    if (!articleData.title.trim()) {
      hasError = true;
      errorMessage = 'Title is required';
      isLoading = false;
      return;
    }

    const result = await save(articleData);

    result.match({
      ok: (slugs) => {
        open = false;
        isLoading = false;
        onSave?.(slugs);
      },
      err: (error) => {
        hasError = true;
        errorMessage = error.message;
        isLoading = false;
      }
    });
  }

  async function handleUrlChange() {
    if (!articleData.title.trim()) {
      const parsedUrl = urlSchema.safeParse(articleData.url);
      if (!parsedUrl.success) {
        return;
      }

      isLoadingMetadata = true;
      hasError = false;
      errorMessage = '';

      const result = await getArticleMetadata(articleData.url);

      result.match({
        ok: (metadata) => {
          articleData.title = metadata.title;
          articleData.makeReadable = metadata.readable;
          isLoadingMetadata = false;
        },
        err: (error) => {
          hasError = true;
          errorMessage = error.message;
          isLoadingMetadata = false;
        }
      });
    }
  }

  $effect.pre(() => {
    if (open === false) {
      articleData = {
        title: '',
        url: '',
        makeReadable: true
      };
      hasError = false;
      errorMessage = '';
      isLoading = false;
    }
  });
</script>

{#snippet formContent()}
  <form onsubmitcapture={handleSave} class="grid gap-4">
    <div class="grid gap-2">
      <Label for="url">URL</Label>
      <Input
        id="url"
        bind:value={articleData.url}
        type="url"
        required
        on:blur={handleUrlChange}
        disabled={isLoading}
      />
    </div>

    <div class="grid gap-2">
      <Label for="title">Title</Label>
      <Input
        id="title"
        bind:value={articleData.title}
        required
        disabled={isLoading || isLoadingMetadata}
      />
    </div>

    <div class="flex items-center space-x-2">
      <Checkbox
        id="makeReadable"
        bind:checked={articleData.makeReadable}
        disabled={isLoading || isLoadingMetadata}
      />
      <Label for="makeReadable">Make readable</Label>
    </div>

    {#if hasError}
      <p class="text-center text-sm text-red-500">
        {errorMessage || 'An error occurred'}
      </p>
    {/if}

    <Button disabled={isLoading || isLoadingMetadata} type="submit">
      {#if isLoading}
        <Loader2 class="mr-2 h-4 w-4 animate-spin" />
        Importing...
      {:else if isLoadingMetadata}
        <Loader2 class="mr-2 h-4 w-4 animate-spin" />
        Fetching metadata...
      {:else}
        Import
      {/if}
    </Button>
  </form>
{/snippet}

{#snippet triggerContent(builder: Builder)}
  {#if children}
    {@render children()}
  {:else if showButton}
    <Button variant="default" builders={[builder]}>
      <PlusCircle class="h-4 w-4 sm:mr-2" />
      <span class="hidden sm:inline">Import article</span>
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
        <Dialog.Title>Import article</Dialog.Title>
        <Dialog.Description>
          Import an article from a URL. Click import when you're done.
        </Dialog.Description>
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
        <Drawer.Title>Import article</Drawer.Title>
        <Drawer.Description>
          Import an article from a URL. Click import when you're done.
        </Drawer.Description>
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
