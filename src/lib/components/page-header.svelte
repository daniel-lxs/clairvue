<script lang="ts">
	import { Separator } from '@/components/ui/separator';

	export let title: string;
	export let description: string | undefined = undefined;
</script>

<div class="space-y-2">
	<h1 class="text-3xl font-bold">{title}</h1>
	{#if description}
		<p class="text-md text-muted-foreground">{description}</p>
	{/if}
</div>
<Separator class="my-6" />
