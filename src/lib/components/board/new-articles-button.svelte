<script lang="ts">
  import { ArrowUp } from 'lucide-svelte';
  import Button from '$lib/components/ui/button/button.svelte';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  function handleClick() {
    dispatch('click');
  }
</script>

<div class="sticky top-0 z-10">
  <div class="absolute left-1/2 mt-16 -translate-x-1/2">
    <Button
      class="rounded-full bg-muted/90 px-3 py-1 text-sm text-muted-foreground shadow-md backdrop-blur-sm transition-all hover:bg-muted-foreground hover:text-muted hover:shadow-lg"
      on:click={handleClick}
    >
      New articles
      <ArrowUp class="ml-2 h-4 w-4" />
    </Button>
  </div>
</div>
