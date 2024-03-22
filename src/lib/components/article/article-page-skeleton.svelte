<script>
	import Separator from '../ui/separator/separator.svelte';
	import { Skeleton } from '../ui/skeleton';
</script>

<div class="parsed-content">
	<div class="space-y-6">
		<Skeleton class="h-6 w-48 rounded-md" />
		<Skeleton class="h-12 w-full rounded-md" />
		<Skeleton class="h-4 w-48 rounded-md" />
		<Skeleton class="h-4 w-32 rounded-md" />
	</div>

	<Separator class="my-6" />

	<Skeleton class="my-8 h-80 w-full rounded-md" />

	<div class="space-y-4">
		<Skeleton class="h-4 w-full rounded-md" />
		<Skeleton class="h-4 w-2/3 rounded-md" />
		<Skeleton class="h-4 w-1/3 rounded-md" />
		<Skeleton class="h-4 w-1/2 rounded-md" />
	</div>

	<Skeleton class="my-8 h-64 w-full rounded-md" />

	<div class="space-y-4">
		<Skeleton class="h-4 w-full rounded-md" />
		<Skeleton class="h-4 w-3/4 rounded-md" />
		<Skeleton class="h-4 w-1/2 rounded-md" />
		<Skeleton class="h-4 w-1/4 rounded-md" />
	</div>
</div>
