<script lang="ts">
  interface Props {
    title: string;
    subtitle?: string | undefined;
  }

  let { title, subtitle = undefined }: Props = $props();
</script>

<div class="flex w-full flex-col items-start pb-6 sm:space-y-2 sm:py-4">
  <h1 class="text-xl font-bold sm:text-3xl">{title}</h1>
  {#if subtitle}
    <p class="sm:text-md text-md text-muted-foreground">{subtitle}</p>
  {/if}
</div>
