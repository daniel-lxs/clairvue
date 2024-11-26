<script lang="ts">
  import { Button } from '@/components/ui/button';
  import * as Page from '@/components/page';
</script>

<Page.Container>
  <div class="flex h-full flex-col items-center justify-center">
    <div class="max-w-md text-center">
      <h1 class="text-6xl font-bold">404</h1>
      <p class="mt-4 text-2xl text-foreground">Feed not found</p>
      <p class="mt-2 text-lg text-muted-foreground">
        Hmm... seems like there's nothing here, why don't you go back?
      </p>
      <div class="mt-6">
        <Button href="/" class="w-full">Go back to home</Button>
      </div>
    </div>
  </div>
</Page.Container>
