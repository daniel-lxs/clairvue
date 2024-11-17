<script lang="ts">
  import { Pagination as PaginationPrimitive } from 'bits-ui';
  import ChevronLeft from 'lucide-svelte/icons/chevron-left';
  import { Button } from '$lib/components/ui/button';
  import { cn } from '$lib/utils';

  type $$Props = PaginationPrimitive.PrevButtonProps;
  type $$Events = PaginationPrimitive.PrevButtonEvents;

  interface Props {
    class?: $$Props['class'];
    children?: import('svelte').Snippet;
    [key: string]: any;
  }

  let { class: className = undefined, children, ...rest }: Props = $props();
</script>

<PaginationPrimitive.PrevButton asChild let:builder>
  <Button
    variant="ghost"
    class={cn('gap-1 pl-2.5', className)}
    builders={[builder]}
    on:click
    {...rest}
  >
    {@render children?.()}
    <ChevronLeft class="h-4 w-4" />
    <span>Previous</span>
  </Button>
</PaginationPrimitive.PrevButton>
