<div
  class="container mx-auto flex h-full max-w-screen-2xl flex-col px-4 pb-10 pt-16 sm:max-w-2xl sm:px-0 sm:pt-16"
>
  <slot />

  <div class="flex-grow"></div>
  <div class="footer mt-4 w-full pb-8">
    <slot name="footer" />
  </div>
</div>
