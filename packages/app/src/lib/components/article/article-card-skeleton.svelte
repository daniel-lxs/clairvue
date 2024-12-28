<script>
  import { Skeleton } from '../ui/skeleton';
  import * as Card from '../ui/card';
</script>

<div class="w-full">
  <Card.Root class="flex shadow-lg">
    <div class="flex flex-col w-full">
      <Skeleton class="h-48 w-full" />
      <div class="flex w-full justify-between p-4">
        <div class="flex w-full flex-col justify-between">
          <div class="space-y-2">
            <Card.Header class="p-0">
              <Skeleton class="h-4 w-32" />
              <div class="mt-2 flex flex-col gap-1">
                <Skeleton class="h-6 w-full" />
              </div>
            </Card.Header>
            <Card.Content class="mt-2 p-0">
              <div class="mb-2 flex items-center">
                <Skeleton class="h-4 w-32" />
              </div>
              <Skeleton class="h-4 w-full" />
              <Skeleton class="mt-2 h-4 w-full" />
            </Card.Content>
          </div>
        </div>
      </div>
    </div>
  </Card.Root>
</div>
