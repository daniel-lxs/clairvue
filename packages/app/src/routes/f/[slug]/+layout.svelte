<script lang="ts">
  import NavigationSidebar from '@/components/navigation/navigation-sidebar.svelte';
  import { collectionsStore } from '@/stores/collections';
  import { feedsStore } from '@/stores/feeds';

  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();
  let collections = $state($collectionsStore);
  let feeds = $state($feedsStore);

  function loadMoreFeeds(page: number) {
    console.log('load more feeds', page);
  }

  $effect(() => {
    collectionsStore.subscribe((value) => {
      collections = value;
    });

    feedsStore.subscribe((value) => {
      feeds = value;
    });
  });
</script>

<div class="mx-auto flex h-[calc(100vh-3.5rem)] w-full max-w-[90rem] pt-0">
  <div class="hidden md:block md:w-80 md:flex-shrink-0">
    <NavigationSidebar
      class="fixed h-[calc(100vh-3.5rem)] w-80 overflow-hidden pl-12 pt-20"
      {collections}
      {feeds}
      onLoadMoreFeeds={loadMoreFeeds}
    />
  </div>
  <div class="flex-1">
    {@render children?.()}
  </div>
</div>
