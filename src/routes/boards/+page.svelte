<script lang="ts">
  import * as Page from '@/components/page';
  import BoardListItem from '@/components/board/board-list-item.svelte';
  import type { PageData } from './$types';
  import { Button } from '@/components/ui/button';
  import { Label } from '@/components/ui/label';
  import { PlusCircle } from 'lucide-svelte';

  export let data: PageData;
</script>

<Page.Container>
  <Page.Header title="Feed Collections" subtitle="Organize and read your favorite RSS feeds" />
  <div class="space-y-6 w-full">
    <div class="flex items-center justify-between">
      <div class="space-y-1">
        <Label class="text-lg font-medium">Your Collections</Label>
        <p class="text-sm text-muted-foreground">Group and manage your RSS feed subscriptions</p>
      </div>
      <Button href="/boards/add" variant="outline" class="gap-2">
        <PlusCircle class="h-4 w-4" />
        <span>Create Collection</span>
      </Button>
    </div>

    {#if data.boards && data.boards.length > 0}
      <div class="grid grid-cols-1 gap-4 rounded-lg">
        {#each data.boards as board}
          <BoardListItem {board} />
        {/each}
      </div>
    {:else}
      <div class="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed">
        <div class="text-center space-y-2">
          <p class="font-medium text-muted-foreground">No collections yet</p>
          <p class="text-sm text-muted-foreground">Create your first collection to start organizing your favorite feeds</p>
        </div>
      </div>
    {/if}
  </div>
</Page.Container>
