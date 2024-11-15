<script>
  import { Skeleton } from '../ui/skeleton';
  import * as Card from '../ui/card';
</script>

<Card.Root class="flex w-full shadow-lg">
  <div class="flex w-full flex-col">
    <div class="flex w-full justify-between p-4">
      <div class="flex w-full flex-col justify-between">
        <div class="space-y-2">
          <Card.Header class="p-0">
            <Skeleton class="h-4 w-32" />
            <div class="mt-2 flex flex-col gap-1">
              <Skeleton class="h-6 w-full" />
              <Card.Description class="sm:text-md text-sm">
                <div class="flex items-center">
                  <Skeleton class="h-4 w-32" />
                </div>
              </Card.Description>
            </div>
          </Card.Header>
          <Card.Content class="mt-2 p-0">
            <Skeleton class="h-4 w-full" />
            <Skeleton class="mt-2 h-4 w-full" />
          </Card.Content>
        </div>
      </div>
    </div>
    <Skeleton class="h-48 w-full rounded-t-none" />
  </div>
</Card.Root>
