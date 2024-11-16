<script>
  import WelcomeCard from '@/components/welcome-card.svelte';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  onMount(() => {
    // Check if user is authenticated using the session from the page store
    if ($page.data.session?.user) {
      goto('/boards');
    }
  });
</script>

<div class="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center">
  <div class="flex-grow"></div>
  <div class="w-full max-w-full">
    <div class="-mt-8 flex justify-center">
      <WelcomeCard />
    </div>
  </div>
  <div class="flex-grow"></div>
</div>
