<script lang="ts">
  import { Button, buttonVariants } from '@/components/ui/button';
  import * as Dialog from '@/components/ui/dialog';
  import { Input } from '@/components/ui/input';
  import { Label } from '@/components/ui/label';
  import { Checkbox } from '@/components/ui/checkbox';
  import { Loader2, PlusCircle } from 'lucide-svelte';
  import { z } from 'zod';
  import type { Result } from '@clairvue/types';

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
    onSave?: (articleIds: string[]) => void;
    showButton?: boolean;
    children?: import('svelte').Snippet;
    open?: boolean;
  } = $props();

  let isLoading = $state(false);
  let hasError = $state(false);
  let errorMessage = $state('');
  let articleData = $state({
    title: '',
    url: '',
    makeReadable: true
  });

  const urlSchema = z.string().url();

  async function handleSave() {
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

<Dialog.Root bind:open>
  {#if children}
    {@render children?.()}
  {:else if showButton}
    <Dialog.Trigger class={buttonVariants({ variant: 'default' })}>
      <PlusCircle class="h-4 w-4 sm:mr-2" />
      <span class="hidden sm:inline">Import article</span>
    </Dialog.Trigger>
  {/if}

  <Dialog.Content class="sm:max-w-[425px]">
    <Dialog.Header>
      <Dialog.Title>Import article</Dialog.Title>
      <Dialog.Description
        >Import an article from a URL. Click save when you're done.</Dialog.Description
      >
    </Dialog.Header>

    <form onsubmitcapture={handleSave} class="grid gap-4 py-4">
      <div class="grid grid-cols-4 items-center gap-4">
        <Label for="url" class="text-right">URL</Label>
        <Input id="url" bind:value={articleData.url} class="col-span-3" type="url" required />
      </div>

      <div class="grid grid-cols-4 items-center gap-4">
        <Label for="title" class="text-right">Title</Label>
        <Input id="title" bind:value={articleData.title} class="col-span-3" required />
      </div>

      <div class="grid grid-cols-4 items-center gap-4">
        <Label for="makeReadable" class="text-right">Make readable</Label>
        <div class="col-span-3">
          <Checkbox id="makeReadable" bind:checked={articleData.makeReadable} />
        </div>
      </div>

      {#if hasError}
        <p class="text-center text-sm text-red-500">
          {errorMessage || 'An error occurred'}
        </p>
      {/if}

      <Dialog.Footer>
        <Button disabled={isLoading} type="submit">
          {#if isLoading}
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
            Importing...
          {:else}
            Import
          {/if}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
