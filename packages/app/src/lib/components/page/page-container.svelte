<script lang="ts">
  interface Props {
    children?: import('svelte').Snippet;
    footer?: import('svelte').Snippet;
  }

  let { children, footer }: Props = $props();
</script>

<div
  class="mx-auto flex w-full max-w-[100rem] justify-center pb-8 pl-8 pr-6 pt-16 sm:pl-6 sm:pr-6 md:pl-8 lg:pr-12"
>
  {@render children?.()}

  {#if footer}
    <div class="footer mt-auto w-full pb-8">
      {@render footer?.()}
    </div>
  {/if}
</div>
