<script>
	import { ModeWatcher } from 'mode-watcher';
	import SiteHeader from '@/components/header/site-header.svelte';
	import '../app.pcss';
	import { Toaster } from '$lib/components/ui/sonner';
</script>

<Toaster />
<ModeWatcher />
<SiteHeader />
<slot />
