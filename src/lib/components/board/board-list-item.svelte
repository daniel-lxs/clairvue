<script lang="ts">
  import type { Board } from '@/server/data/schema';
  import { Button } from '../ui/button';
  import { calculateAge } from '@/utils';

  interface Props {
    board: Board;
  }

  let { board }: Props = $props();
  let feedsCount = board.feeds?.length || 0;
  
  const feedText = feedsCount === 1 ? 'feed' : 'feeds';
  const timeAgo = calculateAge(board.createdAt, 'long');
</script>

<div class="relative rounded-lg bg-muted">
  <div class="flex items-center justify-between gap-4 px-6 py-5">
    <div class="item-body flex min-w-0 flex-col gap-1.5">
      <a 
        href="/board/{board.slug}" 
        class="item-title truncate text-lg font-medium text-primary hover:text-primary/80 hover:underline decoration-primary/30 underline-offset-4 transition-colors"
      >
        {board.name}
      </a>
      <div class="item-description flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
        <span>{feedsCount} {feedText}</span>
        <span class="h-1 w-1 rounded-full bg-muted-foreground/30"></span>
        <span>Added {timeAgo}</span>
      </div>
    </div>
    <div class="item-actions shrink-0">
      <Button href="/boards/edit/{board.slug}" size="sm" variant="default">Edit</Button>
    </div>
  </div>
</div>
