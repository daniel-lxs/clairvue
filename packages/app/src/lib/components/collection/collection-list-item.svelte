<script lang="ts">
  import type { CollectionWithFeeds } from '@clairvue/types';
  import { Button } from '../ui/button';
  import { calculateAge } from '$lib/utils';

  interface Props {
    collection: CollectionWithFeeds;
  }

  let { collection }: Props = $props();
  let feedsCount = collection.feeds.length || 0;

  const feedText = feedsCount === 1 ? 'feed' : 'feeds';
  const timeAgo = calculateAge(collection.createdAt, 'long');
</script>

<div class="bg-muted relative rounded-lg">
  <div class="flex items-center justify-between gap-4 px-6 py-5">
    <div class="item-body flex min-w-0 flex-col gap-1.5">
      <a
        href="/collection/{collection.slug}"
        class="item-title text-primary decoration-primary/30 hover:text-primary/80 truncate text-lg font-medium underline-offset-4 transition-colors hover:underline"
      >
        {collection.name}
      </a>
      <div
        class="item-description text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-sm"
      >
        <span>{feedsCount} {feedText}</span>
        <span class="bg-muted-foreground/30 h-1 w-1 rounded-full"></span>
        <span>Added {timeAgo}</span>
      </div>
    </div>
    <div class="item-actions shrink-0">
      <Button href="/collections/edit/{collection.slug}" size="sm" variant="default">Edit</Button>
    </div>
  </div>
</div>
