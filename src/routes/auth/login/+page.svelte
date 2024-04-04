<script lang="ts">
  import type { ActionData } from './$types';
  import LoginForm from '@/components/auth/login-form.svelte';
  import * as Page from '@/components/page';

  export let form: ActionData;
</script>

<Page.Container>
  <div class="flex h-full flex-col items-center justify-center">
    <LoginForm {form} />
  </div>
</Page.Container>
