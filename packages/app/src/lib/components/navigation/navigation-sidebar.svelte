<script lang="ts">
  import type { Collection } from '@clairvue/types';
  import NavigationMenu from './navigation-menu.svelte';

  let {
    class: className = undefined,
    collections,
    currentFeedId,
    currentCollectionSlug
  }: {
    class?: string;
    collections: Collection[];
    currentFeedId?: string;
    currentCollectionSlug?: string;
  } = $props();
</script>

<div class={className}>
  <NavigationMenu {collections} {currentFeedId} {currentCollectionSlug} />
</div>
