<script lang="ts">
  import { Button, buttonVariants } from '@/components/ui/button';
  import { Folder, FolderPlus } from 'lucide-svelte';
  import { Label } from '../ui/label';
  import type { Collection, Feed } from '@/server/data/schema';
  import { Trigger } from '@/components/ui/dialog';

  let {
    collections,
    selectedCollection,
    onCreateNewCollection
  }: {
    collections: Collection[];
    selectedCollection: Collection;
    feeds: Feed[];
    onCreateNewCollection: () => void;
  } = $props();
</script>

<aside class="min-w-[200px] max-w-[250px] flex-shrink-0 space-y-2">
  <div class="flex items-center justify-between">
    <Label>Collections</Label>
    <Button variant="ghost" size="icon" on:click={onCreateNewCollection}>
      <FolderPlus class="h-4 w-4" color="hsl(var(--primary))" />
    </Button>
  </div>
  <div class="space-y-1">
    {#each collections as collection}
      <Button
        href="/feeds/{collection.slug}"
        variant="ghost"
        class={`w-full justify-start gap-2 ${collection.id === selectedCollection.id ? 'bg-muted' : ''}`}
      >
        <div class="flex items-center gap-3">
          <Folder class="h-4 w-4" />
          <span>{collection.name}</span>
        </div>
      </Button>
    {/each}
  </div>
</aside>
