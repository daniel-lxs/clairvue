<script lang="ts">
  import Button from '@/components/ui/button/button.svelte';
  import { goto } from '$app/navigation';


  function navigateToLogin() {
    goto('/auth/login');
  }

  function navigateToSignup() {
    goto('/auth/signup');
  }
</script>

<main class="min-h-screen w-full">
  <!-- Hero Section -->
  <section class="relative flex min-h-[80vh] flex-col items-center justify-center bg-background px-4 py-16 overflow-hidden">
    <div class="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-primary/10"></div>
    <div class="container mx-auto text-center relative z-10">
      <h1 class="mb-6 text-5xl font-bold tracking-tight">Welcome to Clairvue</h1>
      <p class="mb-8 text-xl text-muted-foreground">A minimalistic and light feed reader for the modern web</p>
      
      <div class="mx-auto max-w-md space-y-6">
        <div class="flex flex-col items-center gap-4">
          <div class="flex gap-4">
            <Button variant="outline" on:click={navigateToLogin}>Login</Button>
            <Button on:click={navigateToSignup}>Sign Up</Button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Features Section -->
  <section class="bg-muted/50 px-4 py-16">
    <div class="container mx-auto">
      <h2 class="mb-12 text-center text-3xl font-bold">Why Choose Clairvue?</h2>
      <div class="grid gap-8 md:grid-cols-3">
        <div class="rounded-lg bg-card p-6 text-center shadow-sm">
          <h3 class="mb-3 text-xl font-semibold">Minimalistic Design</h3>
          <p class="text-muted-foreground">Clean and distraction-free reading experience</p>
        </div>
        <div class="rounded-lg bg-card p-6 text-center shadow-sm">
          <h3 class="mb-3 text-xl font-semibold">Easy Sharing</h3>
          <p class="text-muted-foreground">Share your collections with anyone, anywhere</p>
        </div>
        <div class="rounded-lg bg-card p-6 text-center shadow-sm">
          <h3 class="mb-3 text-xl font-semibold">Fast & Lightweight</h3>
          <p class="text-muted-foreground">Optimized for speed and performance</p>
        </div>
      </div>
    </div>
  </section>

  <footer class="bg-background px-4 py-8 text-center">
    <a href="/#" class="text-sm text-muted-foreground hover:underline">Learn more about Clairvue</a>
  </footer>
</main>
