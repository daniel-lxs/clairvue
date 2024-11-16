<script lang="ts">
  import { CaseSensitive, Sun, Moon } from 'lucide-svelte';
  import Button from '../ui/button/button.svelte';
  import * as Popover from '$lib/components/ui/popover';
  import { Toggle } from '$lib/components/ui/toggle';
  import { fontSize } from '@/stores/font-size';
  import { toggleMode } from 'mode-watcher';
</script>

<Popover.Root portal={null}>
  <Popover.Trigger asChild let:builder>
    <Button
      builders={[builder]}
      variant="outline"
      size="icon"
      title="Appearance settings"
      class="h-8 w-8 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:h-10 sm:w-10"
    >
      <CaseSensitive class="h-[1.2rem] w-[1.2rem]" />
      <span class="sr-only">Open appearance settings</span>
    </Button>
  </Popover.Trigger>
  <Popover.Content class="w-80">
    <div class="grid gap-4">
      <div class="space-y-2">
        <h4 class="font-medium leading-none">Appearance</h4>
        <p class="text-sm text-muted-foreground">Customize how the app looks and feels.</p>
      </div>
      <div class="grid gap-2">
        <div class="grid gap-2">
          <label class="text-sm font-medium leading-none" for="theme-toggle">Theme</label>
          <div class="grid grid-cols-2 gap-2">
            <Toggle
              size="sm"
              pressed={document.documentElement.classList.contains('light')}
              on:click={toggleMode}
            >
              <Sun class="mr-2 h-4 w-4" />
              Light
            </Toggle>
            <Toggle
              size="sm"
              pressed={document.documentElement.classList.contains('dark')}
              on:click={toggleMode}
            >
              <Moon class="mr-2 h-4 w-4" />
              Dark
            </Toggle>
          </div>
        </div>
        <div class="grid gap-2">
          <label class="text-sm font-medium leading-none" for="font-size">Font Size</label>
          <div class="grid grid-cols-4 gap-2">
            <Toggle
              size="sm"
              pressed={$fontSize === 'small'}
              on:click={() => fontSize.set('small')}
            >
              <span class="text-xs">A</span>
            </Toggle>
            <Toggle
              size="sm"
              pressed={$fontSize === 'default'}
              on:click={() => fontSize.set('default')}
            >
              <span class="text-sm">A</span>
            </Toggle>
            <Toggle
              size="sm"
              pressed={$fontSize === 'large'}
              on:click={() => fontSize.set('large')}
            >
              <span class="text-base">A</span>
            </Toggle>
            <Toggle
              size="sm"
              pressed={$fontSize === 'extra large'}
              on:click={() => fontSize.set('extra large')}
            >
              <span class="text-lg">A</span>
            </Toggle>
          </div>
        </div>
      </div>
    </div>
  </Popover.Content>
</Popover.Root>
