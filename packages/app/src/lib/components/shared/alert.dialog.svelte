<script lang="ts">
  import { Button } from '../ui/button';
  import * as Dialog from '../ui/dialog';
  import { Label } from '../ui/label';

  interface Props {
    open: boolean;
    title: string;
    message: string;
  }

  let { open = $bindable(), title, message }: Props = $props();

  function onClick() {
    open = false;
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="sm:max-w-[425px]">
    <Dialog.Header>
      <Dialog.Title>{title}</Dialog.Title>
    </Dialog.Header>
    <div class="grid gap-4 py-4">
      <div class="grid grid-cols-4 items-center gap-4">
        <Label class="text-right">{message}</Label>
      </div>
    </div>
    <Dialog.Footer>
      <Button type="submit" on:click={onClick}>Ok</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
