<script lang="ts">
  import { Button, buttonVariants } from '@/components/ui/button';
  import { Folder, FolderPlus } from 'lucide-svelte';
  import { Label } from '../ui/label';
  import type { Collection, Feed } from '@/server/data/schema';
  import { Trigger } from '@/components/ui/dialog';
  import CollectionDialog from './collection-dialog.svelte';
  import { goto } from '$app/navigation';

  let {
    collections,
    selectedCollection,
    feeds,
    openCollectionDialog = $bindable(false)
  }: {
    collections: Collection[];
    selectedCollection: Collection;
    feeds: Feed[];
    openCollectionDialog: boolean;
  } = $props();

  async function handleCreateCollection(collection: Collection) {
    goto(`/feeds/${collection.slug}`);
  }
</script>

<aside class="hidden w-64 space-y-2 px-4 sm:block">
  <div class="flex items-center justify-between">
    <Label>Collections</Label>
    <CollectionDialog
      {feeds}
      onSave={handleCreateCollection}
      bind:open={openCollectionDialog}
    >
      <Trigger class={buttonVariants({ variant: 'ghost', size: 'sm' })}>
        <FolderPlus class="h-4 w-4" color="hsl(var(--primary))" />
      </Trigger>
    </CollectionDialog>
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
