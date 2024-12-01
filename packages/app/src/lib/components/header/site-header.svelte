<script lang="ts">
  import AppearancePopover from './appearance-popover.svelte';
  import { NavigationMobileSheet } from '../navigation';
  import { collectionsStore } from '@/stores/collections';
  import { feedsStore } from '@/stores/feeds';
  import Logo from '@/components/ui/logo/logo.svelte';

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

<header
  class="border-border/40 bg-background/95 supports-[backdrop-filter]:bg-background/60 fixed top-0 z-50 w-full border-b backdrop-blur"
>
  <div
    class="mx-auto flex h-12 w-full max-w-[90rem] items-center justify-between px-4 sm:h-14 lg:px-12"
  >
    <div class="mr-4 hidden items-center md:flex md:flex-1">
      <Logo />
    </div>

    <div class="flex flex-1 items-center md:hidden">
      <NavigationMobileSheet {collections} {feeds} onLoadMoreFeeds={loadMoreFeeds} />
    </div>

    <div class="flex items-center space-x-2 md:ml-auto">
      <AppearancePopover />
    </div>
  </div>
</header>
