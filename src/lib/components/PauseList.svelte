<!-- src/lib/components/PauseList.svelte -->
<script lang="ts">
	import IconDelete from '~icons/fluent/delete-20-regular';
	import IconChevronDown from '~icons/fluent/chevron-down-20-regular';
	import IconChevronUp from '~icons/fluent/chevron-up-20-regular';
	import FluentEmojiCoffee from '~icons/fluent-emoji/hot-beverage';
	import FluentEmojiTimer from '~icons/fluent-emoji/timer-clock';
	import FluentEmojiRoad from '~icons/fluent-emoji/motorway';
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
			{#if pauses.length === 0}
				<div class="border-base-300 mt-3 rounded-lg border-2 border-dashed p-6 text-center">
					<FluentEmojiCoffee class="mx-auto mb-2 text-4xl opacity-50" />
					<p class="text-sm opacity-60">No pauses added yet</p>
					<p class="mt-1 text-xs opacity-40">Tap the map to add pauses</p>
				</div>
			{:else}
				<div class="mt-3 space-y-3">
					{#each pauses as pause, i (i)}
						<div
							class="group rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 transition-all hover:border-amber-500/50 hover:bg-amber-500/10 hover:shadow-md"
						>
							<div class="flex items-start gap-3">
								<div
									class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg"
								>
									<span class="font-bold">{i + 1}</span>
								</div>

								<div class="flex-1">
									<div class="mb-2 flex items-center gap-2">
										<FluentEmojiRoad class="text-base" />
										<span class="font-semibold">{pause.distanceKm.toFixed(1)} km</span>
									</div>

									<div class="flex items-center gap-2">
										<FluentEmojiTimer class="text-base" />
										<input
											type="number"
											value={pause.durationMinutes}
											oninput={(e) =>
												onUpdateDuration(i, parseInt((e.target as HTMLInputElement).value))}
											class="input input-sm input-bordered w-20 font-mono"
											min="1"
											max="999"
										/>
										<span class="text-sm opacity-70">minutes</span>
									</div>
								</div>

								<button
									onclick={() => onRemove(i)}
									class="btn btn-ghost btn-sm btn-circle text-error opacity-0 transition-opacity group-hover:opacity-100"
									title="Remove pause"
								>
									<IconDelete class="text-lg" />
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</div>
