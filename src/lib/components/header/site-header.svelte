<script lang="ts">
  import { BookOpenText, Menu } from 'lucide-svelte';
  import AppearancePopover from './appearance-popover.svelte';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import Button from '../ui/button/button.svelte';
</script>

<header
  class="fixed top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
>
  <div
    class="container relative mx-auto flex h-12 max-w-screen-2xl items-center justify-between px-4 sm:h-14 sm:px-0 md:px-8"
  >
    <div class="mr-4 flex items-center md:flex-1">
      <a href="/" class="flex items-center space-x-2">
        <BookOpenText />
        <span class="font-bold">clairvue</span>
      </a>
    </div>

    <div class="flex items-center space-x-2 md:ml-auto">
      <AppearancePopover />
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild let:builder>
          <Button
            builders={[builder]}
            variant="ghost"
            size="icon"
            title="Navigation menu"
            class="h-8 w-8 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:h-10 sm:w-10"
          >
            <Menu class="h-[1.2rem] w-[1.2rem]" />
            <span class="sr-only">Menu</span>
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.Item>
            <a href="/feeds" class="flex w-full">Feeds</a>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  </div>
</header>
