<div
	class="container relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-screen-lg flex-col pb-10 pt-16"
>
	<slot />

	<div class="flex-grow"></div>
	<div class="footer mt-4 w-full pb-8">
		<slot name="footer" />
	</div>
</div>
