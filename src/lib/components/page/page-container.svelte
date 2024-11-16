<script lang="ts">
  interface Props {
    children?: import('svelte').Snippet;
    footer?: import('svelte').Snippet;
  }

  let { children, footer }: Props = $props();
</script>

<div
  class="container mx-auto min-h-screen flex flex-col items-center px-4 pb-10 pt-16 sm:max-w-2xl sm:px-0 sm:pt-16"
>
  
    {@render children?.()}
  

  <div class="footer mt-auto w-full pb-8">
    {@render footer?.()}
  </div>
</div>
