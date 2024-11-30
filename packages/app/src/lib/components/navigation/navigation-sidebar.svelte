<script lang="ts">
  import type { Collection, Feed } from '@clairvue/types';
  import NavigationMenu from './navigation-menu.svelte';

  let {
    class: className = undefined,
    collections,
    feeds,
    currentFeedId,
    onLoadMoreFeeds
  } = $props<{
    class?: string;
    collections: Collection[];
    feeds: Feed[];
    currentFeedId?: string;
    onLoadMoreFeeds: (page: number) => void;
  }>();
</script>

<div class={className}>
  <NavigationMenu {collections} {feeds} {currentFeedId} {onLoadMoreFeeds} />
</div>
