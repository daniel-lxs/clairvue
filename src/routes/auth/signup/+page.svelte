<script lang="ts">
  import SignupForm from '@/components/auth/signup-form.svelte';
  import type { ActionData } from './$types';
  import * as Page from '@/components/page';

  export let form: ActionData;
</script>

<Page.Container>
  <div class="flex h-full flex-col items-center justify-center w-full">
    <SignupForm {form} />
  </div>
</Page.Container>
