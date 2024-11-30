<script lang="ts">
  import { cn } from '@/utils';
  import { BookOpenText } from 'lucide-svelte';

  let { class: className = undefined }: { class?: string } = $props();
</script>

<a href="/" class={cn('flex items-center space-x-2', className)}>
  <BookOpenText class="text-primary" />
  <span class="font-bold">clairvue</span>
</a>
