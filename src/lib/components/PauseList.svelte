<!-- src/lib/components/PauseList.svelte -->
<script lang="ts">
	import IconDelete from '~icons/fluent/delete-20-regular';
	import IconChevronDown from '~icons/fluent/chevron-down-20-regular';
	import IconChevronUp from '~icons/fluent/chevron-up-20-regular';
	import type { Pause } from '$lib/utils/calculator';

	interface Props {
		pauses: Pause[];
		expanded?: boolean;
		onToggle?: () => void;
		onRemove: (index: number) => void;
		onUpdateDuration: (index: number, minutes: number) => void;
	}

	let { pauses, expanded = true, onToggle, onRemove, onUpdateDuration }: Props = $props();
</script>

<div class="card bg-base-100 border-base-300 border">
	<div class="card-body p-4">
		{#if onToggle}
			<button onclick={onToggle} class="flex w-full items-center justify-between text-left">
				<h2 class="card-title text-base md:text-lg">Pauses ({pauses.length})</h2>
				{#if expanded}
					<IconChevronUp class="text-xl" />
				{:else}
					<IconChevronDown class="text-xl" />
				{/if}
			</button>
		{:else}
			<h2 class="card-title text-base md:text-lg">Pauses ({pauses.length})</h2>
		{/if}

		{#if expanded}
			{#if pauses.length === 0}
				<p class="mt-2 text-sm opacity-50">No pauses added yet. Tap the map to add pauses.</p>
			{:else}
				<div class="mt-2 space-y-2">
					{#each pauses as pause, i}
						<div class="border-base-300 flex items-center gap-2 rounded border p-2 text-sm">
							<div class="flex-1">
								<div class="font-medium">{pause.distanceKm.toFixed(1)} km</div>
								<div class="mt-1 flex items-center gap-1">
									<input
										type="number"
										value={pause.durationMinutes}
										oninput={(e) =>
											onUpdateDuration(i, parseInt((e.target as HTMLInputElement).value))}
										class="input input-xs input-bordered w-16"
										min="1"
									/>
									<span class="text-xs">min</span>
								</div>
							</div>
							<button onclick={() => onRemove(i)} class="btn btn-ghost btn-sm btn-square">
								<IconDelete />
							</button>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</div>
