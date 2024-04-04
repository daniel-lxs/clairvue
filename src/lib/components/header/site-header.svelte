<script>
  import { BookOpenText } from 'lucide-svelte';
  import LightSwitch from '@/components/header/light-switch.svelte';
</script>

<header
  class="fixed top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
>
  <div
    class="container relative mx-auto flex h-12 max-w-screen-2xl items-center justify-between px-4 sm:h-14 md:px-0"
  >
    <div class="mr-4 flex items-center md:flex-1">
      <a href="/" class="flex items-center space-x-2">
        <BookOpenText />
        <span class="font-bold">clairvue</span>
      </a>
    </div>
    <div class="flex items-center space-x-2 md:ml-auto">
      <div class="w-full md:w-auto"><LightSwitch /></div>
    </div>
  </div>
</header>
