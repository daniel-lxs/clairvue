<script lang="ts">
  import * as Sheet from '$lib/components/ui/sheet';
  import type { Collection, Feed } from '$lib/server/data/schema';
  import { Button } from '../ui/button';
  import { Menu } from 'lucide-svelte';
  import Logo from '../ui/logo/logo.svelte';
  import NavigationMenu from './navigation-menu.svelte';

  let { collections, feeds, currentFeedId, onLoadMoreFeeds } = $props<{
    collections: Collection[];
    feeds: Feed[];
    currentFeedId?: string;
    onLoadMoreFeeds: (page: number) => void;
  }>();

  let open = $state(false);

  function handleNavigate() {
    open = false;
  }
</script>

<Sheet.Root bind:open>
  <Sheet.Trigger asChild let:builder>
    <Button
      builders={[builder]}
      variant="ghost"
      size="icon"
      title="Navigation menu"
      class="bg-background/95 supports-[backdrop-filter]:bg-background/60 h-8 w-8 backdrop-blur sm:h-10 sm:w-10"
    >
      <Menu class="h-[1.2rem] w-[1.2rem]" />
      <span class="sr-only">Menu</span>
    </Button>
  </Sheet.Trigger>
  <Sheet.Content side="left" class="w-[350px] sm:w-[540px]">
    <Sheet.Header>
      <Logo />
    </Sheet.Header>

    <NavigationMenu
      class="py-6 md:pl-0 lg:pl-6"
      {collections}
      {feeds}
      {currentFeedId}
      {onLoadMoreFeeds}
      onNavigate={handleNavigate}
    />
  </Sheet.Content>
</Sheet.Root>
