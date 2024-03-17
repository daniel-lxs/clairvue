<div
	class="container relative mx-auto flex min-h-[calc(100vh-4rem)] flex-col px-2 pb-10 pt-6 sm:max-w-screen-lg sm:pt-16"
>
	<slot />

	<div class="flex-grow"></div>
	<div class="footer mt-4 w-full pb-8">
		<slot name="footer" />
	</div>
</div>
