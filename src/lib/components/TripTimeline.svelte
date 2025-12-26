<!-- src/lib/components/TripTimeline.svelte -->
<script lang="ts">
	import IconChevronDown from '~icons/fluent/chevron-down-20-regular';
	import IconChevronUp from '~icons/fluent/chevron-up-20-regular';
	import { formatTime } from '$lib/utils/calculator';
	import type { TripSegment, Pause } from '$lib/utils/calculator';

	interface Props {
		segments: TripSegment[];
		pauses: Pause[];
		tripStart: Date;
		expanded?: boolean;
		onToggle?: () => void;
	}

	let { segments, pauses, tripStart, expanded = false, onToggle }: Props = $props();
</script>

<div class="card bg-base-100 border-base-300 border">
	<div class="card-body p-4">
		{#if onToggle}
			<button onclick={onToggle} class="flex w-full items-center justify-between text-left">
				<h2 class="card-title text-base md:text-lg">Trip Timeline</h2>
				{#if expanded}
					<IconChevronUp class="text-xl" />
				{:else}
					<IconChevronDown class="text-xl" />
				{/if}
			</button>
		{:else}
			<h2 class="card-title text-base md:text-lg">Trip Timeline</h2>
		{/if}

		{#if expanded}
			<div class="mt-2 overflow-x-auto">
				<table class="table-sm table">
					<thead>
						<tr>
							<th class="text-xs">Distance</th>
							<th class="text-xs">Time</th>
							<th class="text-xs">Event</th>
						</tr>
					</thead>
					<tbody class="text-xs">
						<tr>
							<td>0.0 km</td>
							<td>{formatTime(tripStart)}</td>
							<td>Start</td>
						</tr>
						{#each segments as segment, i}
							<tr>
								<td>{segment.distanceKm.toFixed(1)} km</td>
								<td>{formatTime(segment.endTime)}</td>
								<td>
									{#if i < pauses.length}
										Pause ({pauses[i].durationMinutes}m)
									{:else}
										End
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
