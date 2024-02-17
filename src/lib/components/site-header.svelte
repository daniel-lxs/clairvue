<script>
	import { BookOpenText } from 'lucide-svelte';
	import LightSwitch from '@/components/light-switch.svelte';
</script>

<header
	class="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
>
	<div class="container flex h-14 max-w-screen-2xl items-center">
		<div class="mr-4 hidden md:flex">
			<a href="/" class="mr-6 flex items-center space-x-2">
				<BookOpenText />
				<span class="hidden font-bold sm:inline-block">ReadableSS</span>
			</a>
		</div>
		<div class="flex flex-1 items-center justify-between space-x-2 md:justify-end">
			<div class="w-full flex-1 md:w-auto md:flex-none"><LightSwitch /></div>
		</div>
	</div>
</header>
