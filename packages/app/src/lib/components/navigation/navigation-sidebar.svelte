<script lang="ts">
  import type { Collection } from '@clairvue/types';
  import NavigationMenu from './navigation-menu.svelte';

  let { class: className = undefined, collections }: { class?: string; collections: Collection[] } =
    $props();
</script>

<div class={className}>
  <NavigationMenu {collections} />
</div>
