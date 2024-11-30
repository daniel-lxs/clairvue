<script lang="ts">
  interface Props {
    title?: string;
    children?: import('svelte').Snippet;
    subtitle?: string;
  }

  let { title, children, subtitle }: Props = $props();
</script>

<div class="flex w-full flex-col items-start pb-6 sm:space-y-2 sm:py-4">
  {#if children}
    {@render children()}
  {:else if title}
    <h1 class="text-xl font-bold sm:text-2xl">{title}</h1>
  {/if}

  {#if subtitle && !children}
    <p class="sm:text-md text-md text-muted-foreground">{subtitle}</p>
  {/if}
</div>
