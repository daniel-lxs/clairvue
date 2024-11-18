<script lang="ts">
  interface Props {
    title: (string | undefined) | import('svelte').Snippet;
    subtitle?: (string | undefined) | import('svelte').Snippet;
  }

  let { title, subtitle }: Props = $props();
</script>

<div class="flex w-full flex-col items-start pb-6 sm:space-y-2 sm:py-4">
  {#if title && typeof title === 'string'}
    <h1 class="text-xl font-bold sm:text-3xl">{title}</h1>
  {:else if title && typeof title === 'function'}
    {@render title()}
  {/if}

  {#if subtitle && typeof subtitle === 'string'}
    <p class="sm:text-md text-md text-muted-foreground">{subtitle}</p>
  {:else if subtitle && typeof subtitle === 'function'}
    {@render subtitle()}
  {/if}
</div>
