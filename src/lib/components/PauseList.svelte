<!-- src/lib/components/PauseList.svelte -->
<script lang="ts">
	import IconChevronDown from '~icons/fluent/chevron-down-20-regular';
	import IconChevronUp from '~icons/fluent/chevron-up-20-regular';
	import IconDelete from '~icons/fluent/delete-20-regular';
	import FluentEmojiCoffee from '~icons/fluent-emoji/hot-beverage';
	import type { Pause } from '$lib/utils/calculator';

	interface Props {
		pauses: Pause[];
		expanded?: boolean;
		onToggle?: () => void;
		onRemove?: (index: number) => void;
		onUpdateDuration?: (index: number, minutes: number) => void;
	}

	let { pauses, expanded = true, onToggle, onRemove, onUpdateDuration }: Props = $props();
</script>

<div class="card bg-base-100 border-base-300 border">
	<div class="card-body p-4">
		{#if onToggle}
			<button onclick={onToggle} class="flex w-full items-center justify-between text-left">
				<h2 class="card-title flex items-center gap-2 text-base md:text-lg">
					<FluentEmojiCoffee class="text-xl" />
					Pauses ({pauses.length})
				</h2>
				{#if expanded}
					<IconChevronUp class="text-xl" />
				{:else}
					<IconChevronDown class="text-xl" />
				{/if}
			</button>
		{:else}
			<h2 class="card-title flex items-center gap-2 text-base md:text-lg">
				<FluentEmojiCoffee class="text-xl" />
				Pauses ({pauses.length})
			</h2>
		{/if}

		{#if expanded}
			<div class="mt-3 space-y-3">
				{#if pauses.length === 0}
					<p class="py-4 text-center text-sm opacity-50">
						No pauses added yet. Click on the map to add a pause.
					</p>
				{:else}
					{#each pauses as pause, i (i)}
						<div class="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
							<div class="flex items-center justify-between gap-3">
								<div class="flex-1">
									<div class="text-sm font-semibold">Pause {i + 1}</div>
									<div class="text-xs opacity-70">{pause.distanceKm.toFixed(1)} km</div>
								</div>

								<div class="flex items-center gap-2">
									{#if onUpdateDuration}
										<input
											type="number"
											min="1"
											max="120"
											value={pause.durationMinutes}
											oninput={(e) => {
												const val = parseInt(e.currentTarget.value);
												if (!isNaN(val) && val > 0) {
													onUpdateDuration(i, val);
												}
											}}
											class="input input-sm input-bordered w-16 text-center"
										/>
										<span class="text-xs opacity-70">min</span>
									{:else}
										<span class="text-sm font-medium">{pause.durationMinutes} min</span>
									{/if}

									{#if onRemove}
										<button
											onclick={() => onRemove(i)}
											class="btn btn-ghost btn-sm btn-square"
											aria-label="Remove pause"
										>
											<IconDelete class="text-lg" />
										</button>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		{/if}
	</div>
</div>
