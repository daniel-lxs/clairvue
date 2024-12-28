<script lang="ts">
  import { ArrowUp } from 'lucide-svelte';
  import Button from '$lib/components/ui/button/button.svelte';

  let { onClick } = $props();
</script>

<div class="sticky top-0 z-50">
  <div class="absolute left-1/2 mt-16 -translate-x-1/2">
    <Button
      class="bg-muted/90 text-foreground hover:bg-foreground hover:text-muted rounded-full px-3 py-1 text-sm shadow-md backdrop-blur-sm transition-all hover:shadow-lg"
      on:click={onClick}
    >
      New articles
      <ArrowUp class="ml-2 h-4 w-4" />
    </Button>
  </div>
</div>
