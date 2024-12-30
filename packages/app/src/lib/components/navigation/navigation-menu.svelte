<script lang="ts">
  import type { Collection } from '@clairvue/types';
  import { NavigationCollections } from '.';
  import Button from '../ui/button/button.svelte';
  import { cn } from '$lib/utils';
  import { Separator } from '../ui/separator';
  import { Home, Bookmark } from 'lucide-svelte';
  let {
    class: className = undefined,
    collections,
    onNavigate
  }: {
    class?: string;
    collections: Collection[];
    onNavigate?: (slug: string) => void;
  } = $props();
</script>

<div class={cn('flex flex-col', className)}>
  <Button
    variant="ghost"
    class={cn('text-muted-foreground w-full justify-start')}
    href="/"
    onclick={() => onNavigate?.('/')}
  >
    <Home class="h-5 w-5" />
    <span class="ml-2">Home</span>
  </Button>
  <Button
    variant="ghost"
    class={cn('text-muted-foreground w-full justify-start')}
    href="/articles/saved"
    onclick={() => onNavigate?.('/articles/saved')}
  >
    <Bookmark class="h-5 w-5" />
    <span class="ml-2">Saved Articles</span>
  </Button>
  <Separator class="my-2" />
  <div class="flex flex-col gap-1">
    <div class="text-muted-foreground px-4 py-2 text-sm font-semibold">Collections</div>
    <div class="pl-2">
      <NavigationCollections {collections} {onNavigate} />
    </div>
  </div>
</div>
