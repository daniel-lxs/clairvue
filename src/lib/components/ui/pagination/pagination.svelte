<script lang="ts">
  import { Pagination as PaginationPrimitive } from 'bits-ui';

  import { cn } from '$lib/utils';

  type $$Props = PaginationPrimitive.Props;
  type $$Events = PaginationPrimitive.Events;

  interface Props {
    class?: $$Props['class'];
    count?: $$Props['count'];
    perPage?: $$Props['perPage'];
    page?: $$Props['page'];
    siblingCount?: $$Props['siblingCount'];
    children?: import('svelte').Snippet<[any]>;
    [key: string]: any;
  }

  let {
    class: className = undefined,
    count = 0,
    perPage = 10,
    page = $bindable(1),
    siblingCount = 1,
    children,
    ...rest
  }: Props = $props();

  let currentPage = $derived(page);
</script>

<PaginationPrimitive.Root
  {count}
  {perPage}
  {siblingCount}
  bind:page
  let:builder
  let:pages
  let:range
  asChild
  {...rest}
>
  <nav {...builder} class={cn('mx-auto flex w-full flex-col items-center', className)}>
    {@render children?.({ pages, range, currentPage })}
  </nav>
</PaginationPrimitive.Root>
