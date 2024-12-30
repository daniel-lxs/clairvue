<script lang="ts">
  import type { Collection } from '@clairvue/types';
  import { NavigationCollections } from '.';
  import Button from '../ui/button/button.svelte';
  import { cn } from '$lib/utils';
  import { Separator } from '../ui/separator';
  import { Home, Bookmark } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  let {
    class: className = undefined,
    collections,
    onNavigate
  }: {
    class?: string;
    collections: Collection[];
    onNavigate?: (slug: string) => void;
  } = $props();

  function handleClick(route: string, event: MouseEvent) {
    event.preventDefault();
    onNavigate?.(route);
    goto(route);
  }
</script>

<div class={cn('flex flex-col', className)}>
  <Button
    variant="ghost"
    class={cn('text-muted-foreground w-full justify-start')}
    onclick={(e: MouseEvent) => handleClick('/', e)}
  >
    <Home class="mr-2 h-5 w-5" />
    Home
  </Button>
  <Button
    variant="ghost"
    class={cn('text-muted-foreground w-full justify-start')}
    onclick={(e: MouseEvent) => handleClick('/articles/saved', e)}
  >
    <Bookmark class="mr-2 h-5 w-5" />
    Saved Articles
  </Button>
  <Separator class="my-2" />
  <div class="flex flex-col gap-1">
    <div class="text-muted-foreground px-4 py-2 text-sm font-semibold">Collections</div>
    <div class="pl-2">
      <NavigationCollections {collections} {onNavigate} />
    </div>
  </div>
</div>
