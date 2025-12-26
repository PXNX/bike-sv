<!-- src/lib/components/TripTimeline.svelte -->
<script lang="ts">
	import IconChevronDown from '~icons/fluent/chevron-down-20-regular';
	import IconChevronUp from '~icons/fluent/chevron-up-20-regular';
	import FluentEmojiCheckMarkButton from '~icons/fluent-emoji/check-mark-button';
	import FluentEmojiHourglassDone from '~icons/fluent-emoji/hourglass-done';
	import FluentEmojiCoffee from '~icons/fluent-emoji/hot-beverage';
	import FluentEmojiFlag from '~icons/fluent-emoji/chequered-flag';
	import IconNavigation from '~icons/fluent/navigation-20-filled';
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
				<h2 class="card-title flex items-center gap-2 text-base md:text-lg">
					<IconNavigation class="text-blue-500" />
					Trip Timeline
				</h2>
				{#if expanded}
					<IconChevronUp class="text-xl" />
				{:else}
					<IconChevronDown class="text-xl" />
				{/if}
			</button>
		{:else}
			<h2 class="card-title flex items-center gap-2 text-base md:text-lg">
				<IconNavigation class="text-blue-500" />
				Trip Timeline
			</h2>
		{/if}

		{#if expanded}
			<div class="mt-3">
				<!-- Timeline layout -->
				<div class="relative space-y-4 pl-8">
					<!-- Vertical line -->
					<div
						class="absolute top-2 bottom-2 left-[11px] w-0.5 bg-gradient-to-b from-green-500 via-blue-500 to-red-500"
					></div>

					<!-- Start -->
					<div class="relative">
						<div
							class="absolute -left-8 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white shadow-lg"
						>
							<FluentEmojiCheckMarkButton class="text-lg" />
						</div>
						<div class="rounded-lg border border-green-500/30 bg-green-500/10 p-3">
							<div class="flex items-center justify-between">
								<div>
									<div class="text-sm font-semibold">Start</div>
									<div class="text-xs opacity-70">0.0 km</div>
								</div>
								<div class="text-right">
									<div class="font-mono text-sm font-bold">{formatTime(tripStart)}</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Segments with pauses -->
					{#each segments as segment, i (i)}
						<div class="relative">
							{#if i < pauses.length}
								<!-- Pause -->
								<div
									class="absolute -left-8 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg"
								>
									<FluentEmojiCoffee class="text-lg" />
								</div>
								<div class="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
									<div class="flex items-center justify-between">
										<div>
											<div class="text-sm font-semibold">Pause {i + 1}</div>
											<div class="text-xs opacity-70">{segment.distanceKm.toFixed(1)} km</div>
										</div>
										<div class="text-right">
											<div class="font-mono text-sm font-bold">{formatTime(segment.endTime)}</div>
											<div class="badge badge-sm badge-warning mt-1">
												{pauses[i].durationMinutes}m break
											</div>
										</div>
									</div>
								</div>
							{:else}
								{@const duration = segment.endTime.getTime() - tripStart.getTime()}
								{@const hours = Math.floor(duration / 3600000)}
								{@const minutes = Math.floor((duration % 3600000) / 60000)}
								<!-- End -->
								<div
									class="absolute -left-8 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-lg"
								>
									<FluentEmojiFlag class="text-lg" />
								</div>
								<div class="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
									<div class="flex items-center justify-between">
										<div>
											<div class="text-sm font-semibold">Finish</div>
											<div class="text-xs opacity-70">{segment.distanceKm.toFixed(1)} km</div>
										</div>
										<div class="text-right">
											<div class="font-mono text-sm font-bold">{formatTime(segment.endTime)}</div>

											<div class="badge badge-sm mt-1">{hours}h {minutes}m total</div>
										</div>
									</div>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>
