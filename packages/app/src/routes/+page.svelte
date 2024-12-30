<script lang="ts">
  import Button from '@/components/ui/button/button.svelte';
  import { goto } from '$app/navigation';
  import { Card } from '@/components/ui/card';
  import PageSkeleton from '@/components/page-skeleton.svelte';
  import NavigationSidebar from '@/components/navigation/navigation-sidebar.svelte';
  import { collectionsStore } from '@/stores/collections';
  import { feedsStore } from '@/stores/feeds';

  let collections = $state($collectionsStore);

  function navigateToLogin() {
    goto('/auth/login');
  }

  function navigateToSignup() {
    goto('/auth/signup');
  }

  $effect(() => {
    collectionsStore.subscribe((value) => {
      collections = value;
    });
  });
</script>

{#snippet sidebar()}
  <NavigationSidebar class="mt-2.5" {collections} />
{/snippet}

{#snippet content()}
  <main class="bg-background">
    <!-- App Introduction -->
    <section class="flex flex-col items-center justify-center p-8">
      <div class="container mx-auto text-center">
        <h1 class="text-4xl font-bold tracking-tight">Clairvue</h1>
        <p class="text-muted-foreground mt-2 text-lg">Your Minimalist Feed Reader</p>
        <div class="mt-6 flex justify-center gap-4">
          <Button variant="outline" on:click={navigateToLogin}>Login</Button>
          <Button on:click={navigateToSignup}>Sign Up</Button>
        </div>
      </div>
    </section>

    <!-- Feature Highlights -->
    <section class="p-8">
      <div class="container mx-auto">
        <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <!-- Feature Card 1 -->
          <Card class="p-6">
            <h3 class="text-xl font-semibold">Clean Reading</h3>
            <p class="text-muted-foreground mt-2">Enjoy a distraction-free reading experience.</p>
          </Card>

          <!-- Feature Card 2 -->
          <Card class="p-6">
            <h3 class="text-xl font-semibold">Easy Sharing</h3>
            <p class="text-muted-foreground mt-2">Share your collections effortlessly.</p>
          </Card>

          <!-- Feature Card 3 -->
          <Card class="p-6">
            <h3 class="text-xl font-semibold">Fast & Light</h3>
            <p class="text-muted-foreground mt-2">Optimized for speed and performance.</p>
          </Card>
        </div>
      </div>
    </section>

    <!-- Example Content Section (Optional) -->
    <section class="bg-muted/50 p-8">
      <div class="container mx-auto">
        <h2 class="mb-6 text-2xl font-bold">Discover</h2>
        <div class="grid gap-4 md:grid-cols-2">
          <!-- Example Content Card 1 -->
          <Card class="p-4">
            <h4 class="font-semibold">Article Title 1</h4>
            <p class="text-muted-foreground mt-1 text-sm">Short excerpt from the article...</p>
          </Card>

          <!-- Example Content Card 2 -->
          <Card class="p-4">
            <h4 class="font-semibold">Article Title 2</h4>
            <p class="text-muted-foreground mt-1 text-sm">Short excerpt from the article...</p>
          </Card>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-background mt-12 p-8 text-center">
      <p class="text-muted-foreground text-sm">
        © {new Date().getFullYear()} Clairvue. All rights reserved.
      </p>
    </footer>
  </main>
{/snippet}

<PageSkeleton {sidebar} {content} />
