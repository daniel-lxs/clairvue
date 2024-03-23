<script lang="ts">
	import { Skeleton } from '../ui/skeleton';
</script>

<div class="pb-6 sm:space-y-2 sm:py-8">
	<div class="space-y-2">
		<Skeleton class="h-10 w-48" />
		<Skeleton class="h-4 w-72" />
	</div>
</div>

<div class="space-y-12">
	<div class="space-y-2">
		<Skeleton class="h-6 w-32" />
		<Skeleton class="h-10 w-full" />
	</div>

	<div>
		<div class="mb-4 flex items-center justify-between">
			<div class="space-y-2">
				<Skeleton class="h-6 w-32" />
				<Skeleton class="h-4 w-48" />
			</div>
			<Skeleton class="h-10 w-32 rounded-lg" />
		</div>

		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
			{#each Array(6) as _}
				<div class="space-y-2">
					<Skeleton class="h-20 w-full" />
				</div>
			{/each}
		</div>
	</div>

	<div class="space-y-2">
		<Skeleton class="h-6 w-32" />
		<div class="flex w-full items-center justify-between rounded-lg border p-4">
			<div class="space-y-2">
				<Skeleton class="h-4 w-48" />
				<Skeleton class="h-4 w-32" />
			</div>
			<Skeleton class="h-10 w-24 rounded-lg" />
		</div>
	</div>
</div>
