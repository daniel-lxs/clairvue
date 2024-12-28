<script lang="ts">
  import { Pagination as PaginationPrimitive } from 'bits-ui';
  import ChevronRight from 'lucide-svelte/icons/chevron-right';
  import { Button } from '$lib/components/ui/button';
  import { cn } from '$lib/utils';

  type $$Props = PaginationPrimitive.NextButtonProps;
  type $$Events = PaginationPrimitive.NextButtonEvents;

  interface Props {
    class?: $$Props['class'];
    children?: import('svelte').Snippet;
    [key: string]: any;
  }

  let { class: className = undefined, children, ...rest }: Props = $props();
</script>

<PaginationPrimitive.NextButton asChild let:builder>
  <Button
    variant="ghost"
    class={cn('gap-1 pr-2.5', className)}
    builders={[builder]}
    on:click
    {...rest}
  >
    {@render children?.()}
    <span>Next</span>
    <ChevronRight class="h-4 w-4" />
  </Button>
</PaginationPrimitive.NextButton>
