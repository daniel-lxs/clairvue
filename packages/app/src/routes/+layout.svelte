<script lang="ts">
  import { ModeWatcher } from 'mode-watcher';
  import SiteHeader from '@/components/header/site-header.svelte';
  import '../app.pcss';
  import { Toaster } from '$lib/components/ui/sonner';
  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();
</script>

<svelte:head>
  <link rel="manifest" href="/manifest.webmanifest" />
</svelte:head>

<Toaster />
<ModeWatcher />
<div class="min-h-screen">
  <SiteHeader />
  {@render children?.()}
</div>
