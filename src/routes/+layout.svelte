<script>
	import { ModeWatcher } from 'mode-watcher';
	import SiteHeader from '@/components/header/site-header.svelte';
	import '../app.pcss';
</script>

<ModeWatcher />
<SiteHeader />
<slot />
