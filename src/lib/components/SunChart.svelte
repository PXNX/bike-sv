<!-- src/lib/components/SunChart.svelte -->
<script lang="ts">
	import type { SunTimes } from '$lib/utils/weather';
	import type { TripSegment } from '$lib/utils/calculator';

	interface Props {
		sunTimes: SunTimes;
		tripStart: Date;
		tripEnd: Date;
		segments: TripSegment[];
	}

	let { sunTimes, tripStart, tripEnd, segments }: Props = $props();

	const WIDTH = 800;
	const HEIGHT = 200;
	const PADDING = 40;

	let chartData = $derived.by(() => {
		const dayStart = new Date(tripStart);
		dayStart.setHours(0, 0, 0, 0);
		const dayEnd = new Date(dayStart);
		dayEnd.setHours(23, 59, 59, 999);

		const totalMs = dayEnd.getTime() - dayStart.getTime();

		const getX = (date: Date) => {
			const elapsed = date.getTime() - dayStart.getTime();
			return PADDING + (elapsed / totalMs) * (WIDTH - 2 * PADDING);
		};

		const sunriseX = getX(sunTimes.sunrise);
		const sunsetX = getX(sunTimes.sunset);
		const tripStartX = getX(tripStart);
		const tripEndX = getX(tripEnd);

		const sunPathY = HEIGHT / 2;
		const sunPeakY = HEIGHT / 4;

		// Create sun arc path
		const sunMidX = (sunriseX + sunsetX) / 2;
		const sunPath = `M ${sunriseX} ${sunPathY} Q ${sunMidX} ${sunPeakY} ${sunsetX} ${sunPathY}`;

		// Time labels
		const hours = [];
		for (let h = 0; h <= 24; h += 3) {
			const time = new Date(dayStart);
			time.setHours(h);
			hours.push({
				x: getX(time),
				label: `${h}:00`
			});
		}

		return {
			sunriseX,
			sunsetX,
			tripStartX,
			tripEndX,
			sunPath,
			sunPathY,
			hours,
			dayStart,
			dayEnd
		};
	});

	function formatTimeShort(date: Date): string {
		return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
	}
</script>

<div class="w-full">
	<svg viewBox="0 0 {WIDTH} {HEIGHT}" class="w-full">
		<!-- Night background -->
		<rect
			x={PADDING}
			y={0}
			width={chartData.sunriseX - PADDING}
			height={HEIGHT}
			fill="#1e293b"
			opacity="0.1"
		/>
		<rect
			x={chartData.sunsetX}
			y={0}
			width={WIDTH - PADDING - chartData.sunsetX}
			height={HEIGHT}
			fill="#1e293b"
			opacity="0.1"
		/>

		<!-- Sun arc -->
		<path
			d={chartData.sunPath}
			stroke="#fbbf24"
			stroke-width="2"
			fill="none"
			stroke-dasharray="4 4"
		/>

		<!-- Sunrise marker -->
		<line
			x1={chartData.sunriseX}
			y1={chartData.sunPathY - 10}
			x2={chartData.sunriseX}
			y2={chartData.sunPathY + 10}
			stroke="#fbbf24"
			stroke-width="2"
		/>
		<text
			x={chartData.sunriseX}
			y={chartData.sunPathY + 25}
			text-anchor="middle"
			class="fill-current text-xs"
		>
			☀️ {formatTimeShort(sunTimes.sunrise)}
		</text>

		<!-- Sunset marker -->
		<line
			x1={chartData.sunsetX}
			y1={chartData.sunPathY - 10}
			x2={chartData.sunsetX}
			y2={chartData.sunPathY + 10}
			stroke="#f97316"
			stroke-width="2"
		/>
		<text
			x={chartData.sunsetX}
			y={chartData.sunPathY + 25}
			text-anchor="middle"
			class="fill-current text-xs"
		>
			🌙 {formatTimeShort(sunTimes.sunset)}
		</text>

		<!-- Trip timeline -->
		<rect
			x={chartData.tripStartX}
			y={chartData.sunPathY - 5}
			width={chartData.tripEndX - chartData.tripStartX}
			height={10}
			fill="#3b82f6"
			opacity="0.6"
		/>

		<!-- Trip start/end markers -->
		<circle cx={chartData.tripStartX} cy={chartData.sunPathY} r="4" fill="#10b981" />
		<circle cx={chartData.tripEndX} cy={chartData.sunPathY} r="4" fill="#ef4444" />

		<!-- Segment markers -->
		{#each segments.slice(0, -1) as segment}
			{@const elapsed = segment.endTime.getTime() - chartData.dayStart.getTime()}
			{@const total = chartData.dayEnd.getTime() - chartData.dayStart.getTime()}
			{@const x = PADDING + (elapsed / total) * (WIDTH - 2 * PADDING)}
			<circle cx={x} cy={chartData.sunPathY} r="3" fill="#f59e0b" />
		{/each}

		<!-- Time axis -->
		<line
			x1={PADDING}
			y1={HEIGHT - 20}
			x2={WIDTH - PADDING}
			y2={HEIGHT - 20}
			stroke="currentColor"
			stroke-width="1"
			opacity="0.3"
		/>
		{#each chartData.hours as hour}
			<line
				x1={hour.x}
				y1={HEIGHT - 25}
				x2={hour.x}
				y2={HEIGHT - 15}
				stroke="currentColor"
				stroke-width="1"
				opacity="0.3"
			/>
			<text x={hour.x} y={HEIGHT - 5} text-anchor="middle" class="fill-current text-xs opacity-60">
				{hour.label}
			</text>
		{/each}
	</svg>
</div>
