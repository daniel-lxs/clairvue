<script lang="ts">
  interface Props {
    sidebar: import('svelte').Snippet;
    content: import('svelte').Snippet;
  }

  let { sidebar, content }: Props = $props();
</script>

<div class="mx-auto flex min-h-screen w-full max-w-[90rem] px-4 lg:px-12">
  <aside class="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
    <div class="mt-14 flex min-h-0 flex-1 flex-col border-r pt-2 md:pr-5">
      {@render sidebar()}
    </div>
  </aside>

  <main class="flex-1 md:pl-64">
    <div class="mx-auto mt-14 max-w-7xl pl-0 pt-2 sm:pl-3 md:pl-5">
      {@render content()}
    </div>
  </main>
</div>
