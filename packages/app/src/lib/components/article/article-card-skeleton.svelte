<script>
  import { Skeleton } from '../ui/skeleton';
  import * as Card from '../ui/card';
  import { MediaQuery } from 'runed';

  const isDesktop = new MediaQuery('(min-width: 768px)');
</script>

<div class="w-full">
  <Card.Root class="flex rounded-lg shadow-lg">
    <div class="flex w-full flex-col">
      <div class="w-full">
        <Skeleton class="h-48 w-full rounded-t-lg" />
      </div>
      <div class="space-y-2 p-4">
        <div class="flex w-full justify-between">
          <div class="flex w-full flex-col justify-between">
            <div class="space-y-2">
              <Card.Header class="p-0">
                <Skeleton class="h-4 w-32" />
                <div class="mt-2 flex flex-col gap-1">
                  <Skeleton class="h-6 w-full" />
                </div>
                <div class="mt-2">
                  <Skeleton class="h-4 w-48" />
                </div>
              </Card.Header>
              {#if isDesktop.matches}
                <Card.Content class="p-0">
                  <Skeleton class="h-4 w-full" />
                  <Skeleton class="mt-2 h-4 w-3/4" />
                </Card.Content>
              {/if}
            </div>
          </div>
          {#if isDesktop.matches}
            <div class="ml-2 h-8 w-8">
              <Skeleton class="h-full w-full rounded-md" />
            </div>
          {/if}
        </div>
      </div>
    </div>
  </Card.Root>
</div>
