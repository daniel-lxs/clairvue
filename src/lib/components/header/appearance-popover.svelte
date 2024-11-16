<script lang="ts">
  import { CaseSensitive } from 'lucide-svelte';
  import Button from '../ui/button/button.svelte';
  import * as Popover from '$lib/components/ui/popover';
  import * as ToggleGroup from '$lib/components/ui/toggle-group';
  import { fontSize } from '@/stores/font-size';
  import { setMode, mode } from 'mode-watcher';

  let theme = $state<'light' | 'dark'>($mode || 'dark');

  $effect(() => {
    setMode(theme);
  });
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
          <div class="relative">
            <ToggleGroup.Root
              type="single"
              bind:value={theme}
              class="grid w-full grid-cols-2 gap-2"
            >
              <ToggleGroup.Item value="light" class="w-full">Light</ToggleGroup.Item>
              <ToggleGroup.Item value="dark" class="w-full">Dark</ToggleGroup.Item>
            </ToggleGroup.Root>
          </div>
        </div>
        <div class="grid gap-2">
          <label class="text-sm font-medium leading-none" for="font-size">Font Size</label>
          <div class="relative">
            <ToggleGroup.Root
              type="single"
              bind:value={$fontSize}
              class="grid w-full grid-cols-4 gap-2"
            >
              <ToggleGroup.Item value="small" class="w-full">
                <span class="text-xs">A</span>
              </ToggleGroup.Item>
              <ToggleGroup.Item value="default" class="w-full">
                <span class="text-sm">A</span>
              </ToggleGroup.Item>
              <ToggleGroup.Item value="large" class="w-full">
                <span class="text-base">A</span>
              </ToggleGroup.Item>
              <ToggleGroup.Item value="extra large" class="w-full">
                <span class="text-lg">A</span>
              </ToggleGroup.Item>
            </ToggleGroup.Root>
          </div>
        </div>
      </div>
    </div>
  </Popover.Content>
</Popover.Root>
