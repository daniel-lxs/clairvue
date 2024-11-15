<script lang="ts">
  export let title: string;
  export let subtitle: string | undefined = undefined;
</script>

<div class="pb-6 sm:space-y-2 sm:py-4">
  <h1 class="text-xl font-bold sm:text-3xl">{title}</h1>
  {#if subtitle}
    <p class="sm:text-md text-md text-muted-foreground">{subtitle}</p>
  {/if}
</div>
