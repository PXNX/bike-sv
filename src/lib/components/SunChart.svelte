<!-- src/lib/components/SunChart.svelte -->
<script lang="ts">
	import type { SunTimes } from '$lib/utils/weather';
	import type { TripSegment } from '$lib/utils/calculator';
	import { SvelteDate } from 'svelte/reactivity';

	interface Props {
		sunTimes: SunTimes;
		tripStart: Date;
		tripEnd: Date;
		segments: TripSegment[];
	}

	let { sunTimes, tripStart, tripEnd, segments }: Props = $props();

	// Calculate derived times
	const dawn = $derived(new Date(sunTimes.sunrise.getTime() - 30 * 60 * 1000));
	const dusk = $derived(new Date(sunTimes.sunset.getTime() + 30 * 60 * 1000));
	const solarNoon = $derived(
		new Date((sunTimes.sunrise.getTime() + sunTimes.sunset.getTime()) / 2)
	);

	// SVG dimensions
	const SVG_WIDTH = 400;
	const SVG_HEIGHT = 120;
	const NIGHT_WIDTH = 80;
	const DAY_START_X = NIGHT_WIDTH;
	const DAY_END_X = SVG_WIDTH - NIGHT_WIDTH;

	// Calculate day boundaries
	const dayStart = $derived.by(() => {
		const d = new SvelteDate(tripStart);
		d.setHours(0, 0, 0, 0);
		return d;
	});

	const dayDuration = 24 * 60 * 60 * 1000;

	// Convert time to X coordinate
	function timeToX(date: Date): number {
		const percent = (date.getTime() - dayStart.getTime()) / dayDuration;
		return 20 + percent * (SVG_WIDTH - 40);
	}

	// Sun arc path
	const sunPath = $derived.by(() => {
		const startX = 100;
		const endX = 300;
		const y = 90;
		const peakY = 20;
		const midX = (startX + endX) / 2;
		return `M ${startX} ${y} Q ${midX} ${peakY} ${endX} ${y}`;
	});

	// Trip bar coordinates
	const tripBar = $derived.by(() => {
		const startPercent = (tripStart.getTime() - dayStart.getTime()) / dayDuration;
		const endPercent = (tripEnd.getTime() - dayStart.getTime()) / dayDuration;
		const startX = 20 + startPercent * (SVG_WIDTH - 40);
		const endX = 20 + endPercent * (SVG_WIDTH - 40);
		const width = Math.max(endX - startX, 2);

		return { startX, endX, width };
	});

	// Format time helper
	function formatTime(date: Date): string {
		return date.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		});
	}

	// Determine trip phase for styling
	const tripPhase = $derived.by(() => {
		const start = tripStart.getTime();
		const end = tripEnd.getTime();
		const sunrise = sunTimes.sunrise.getTime();
		const sunset = sunTimes.sunset.getTime();
		const dawnTime = dawn.getTime();
		const duskTime = dusk.getTime();

		if (end < dawnTime) return 'night';
		if (start > duskTime) return 'night';
		if (start < sunrise && end < sunset) return 'morning';
		if (start > sunrise && end < sunset) return 'day';
		if (start < sunset && end > sunset) return 'evening';
		return 'mixed';
	});

	// Phase badge
	const phaseBadge = $derived.by(() => {
		const phases: Record<string, { text: string; color: string }> = {
			night: { text: '🌙 Night Ride', color: 'badge-info' },
			morning: { text: '🌅 Morning Ride', color: 'badge-warning' },
			day: { text: '☀️ Day Ride', color: 'badge-success' },
			evening: { text: '🌆 Evening Ride', color: 'badge-warning' },
			mixed: { text: '🌗 Mixed Conditions', color: 'badge-neutral' }
		};
		return phases[tripPhase] || phases.mixed;
	});
</script>

<div class="bg-base-300 w-full rounded-lg p-6">
	<!-- Header with phase badge -->
	<div class="mb-4 flex items-center justify-between">
		<div class="text-xs font-semibold tracking-wide uppercase opacity-60">Sun Timeline</div>
		<div class="badge {phaseBadge.color} badge-sm">{phaseBadge.text}</div>
	</div>

	<!-- Top row: Sunrise and Sunset times -->
	<div class="mb-6 flex items-start justify-between">
		<div>
			<div class="text-sm opacity-60">Sunrise</div>
			<div class="text-3xl font-bold">{formatTime(sunTimes.sunrise)}</div>
		</div>
		<div class="text-right">
			<div class="text-sm opacity-60">Sunset</div>
			<div class="text-3xl font-bold">{formatTime(sunTimes.sunset)}</div>
		</div>
	</div>

	<!-- Sun arc visualization -->
	<div class="relative mb-6 h-32">
		<svg
			viewBox="0 0 {SVG_WIDTH} {SVG_HEIGHT}"
			class="h-full w-full"
			preserveAspectRatio="xMidYMid meet"
		>
			<!-- Night background left -->
			<rect x="0" y="0" width={NIGHT_WIDTH} height={SVG_HEIGHT} fill="currentColor" opacity="0.1" />

			<!-- Night background right -->
			<rect
				x={DAY_END_X}
				y="0"
				width={NIGHT_WIDTH}
				height={SVG_HEIGHT}
				fill="currentColor"
				opacity="0.1"
			/>

			<!-- Day background -->
			<rect
				x={DAY_START_X}
				y="0"
				width={DAY_END_X - DAY_START_X}
				height={SVG_HEIGHT}
				fill="#7dd3fc"
				opacity="0.15"
			/>

			<!-- Dawn marker -->
			<line
				x1={DAY_START_X}
				y1="10"
				x2={DAY_START_X}
				y2="110"
				stroke="currentColor"
				opacity="0.2"
				stroke-width="1"
			/>

			<!-- Dusk marker -->
			<line
				x1={DAY_END_X}
				y1="10"
				x2={DAY_END_X}
				y2="110"
				stroke="currentColor"
				opacity="0.2"
				stroke-width="1"
			/>

			<!-- Sun path arc -->
			<path d={sunPath} stroke="#fbbf24" stroke-width="3" fill="none" />

			<!-- Sunrise marker -->
			<circle cx="100" cy="90" r="6" fill="#fbbf24" />
			<line
				x1="100"
				y1="95"
				x2="100"
				y2="110"
				stroke="currentColor"
				opacity="0.3"
				stroke-width="1"
			/>

			<!-- Sunset marker -->
			<circle cx="300" cy="90" r="6" fill="#fb923c" />
			<line
				x1="300"
				y1="95"
				x2="300"
				y2="110"
				stroke="currentColor"
				opacity="0.3"
				stroke-width="1"
			/>

			<!-- Solar noon indicator -->
			<circle cx="200" cy="20" r="12" fill="#fbbf24" opacity="0.8" />
			<circle cx="200" cy="20" r="16" fill="#fbbf24" opacity="0.3" />

			<!-- Trip duration bar -->
			<rect
				x={tripBar.startX}
				y="92"
				width={tripBar.width}
				height="8"
				fill="#3b82f6"
				opacity="0.8"
				rx="4"
			/>
			<circle cx={tripBar.startX} cy="96" r="5" fill="#10b981" />
			<circle cx={tripBar.endX} cy="96" r="5" fill="#ef4444" />
		</svg>
	</div>

	<!-- Bottom row: Dawn, Solar noon, Dusk -->
	<div class="flex items-center justify-between text-sm">
		<div class="text-center">
			<div class="opacity-60">Dawn</div>
			<div class="font-semibold">{formatTime(dawn)}</div>
		</div>
		<div class="text-center">
			<div class="opacity-60">Solar noon</div>
			<div class="font-semibold">{formatTime(solarNoon)}</div>
		</div>
		<div class="text-center">
			<div class="opacity-60">Dusk</div>
			<div class="font-semibold">{formatTime(dusk)}</div>
		</div>
	</div>
</div>
