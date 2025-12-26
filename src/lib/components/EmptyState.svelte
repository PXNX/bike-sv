<!-- src/lib/components/EmptyState.svelte -->
<script lang="ts">
	import IconUpload from '~icons/fluent/arrow-upload-20-regular';
</script>

<div class="card bg-base-100 border-base-300 border">
	<div class="card-body items-center py-12 text-center md:py-20">
		<IconUpload class="mb-4 text-5xl opacity-30 md:text-6xl" />
		<h3 class="mb-2 text-lg font-semibold md:text-xl">Upload a GPX File</h3>
		<p class="text-sm opacity-70">Get started by uploading your bike trip GPX file</p>
	</div>
</div>
