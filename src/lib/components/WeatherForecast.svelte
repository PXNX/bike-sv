<!-- src/lib/components/WeatherForecast.svelte -->
<script lang="ts">
	import IconChevronDown from '~icons/fluent/chevron-down-20-regular';
	import IconChevronUp from '~icons/fluent/chevron-up-20-regular';
	import { formatTime } from '$lib/utils/calculator';
	import { getWeatherDescription, type WeatherData } from '$lib/utils/weather';

	interface Props {
		weatherData: WeatherData[];
		expanded?: boolean;
		onToggle?: () => void;
	}

	let { weatherData, expanded = false, onToggle }: Props = $props();
</script>

<div class="card bg-base-100 border-base-300 border">
	<div class="card-body p-4">
		{#if onToggle}
			<button onclick={onToggle} class="flex w-full items-center justify-between text-left">
				<h2 class="card-title text-base md:text-lg">Weather Forecast</h2>
				{#if expanded}
					<IconChevronUp class="text-xl" />
				{:else}
					<IconChevronDown class="text-xl" />
				{/if}
			</button>
		{:else}
			<h2 class="card-title text-base md:text-lg">Weather Forecast</h2>
		{/if}

		{#if expanded}
			<div class="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
				{#each weatherData as weather}
					<div class="border-base-300 rounded border p-3">
						<div class="mb-2 text-sm font-medium">{formatTime(weather.time)}</div>
						<div class="mb-1 text-2xl font-bold">{weather.temperature.toFixed(1)}°C</div>
						<div class="space-y-1 text-xs">
							<div>{getWeatherDescription(weather.weatherCode)}</div>
							<div>Wind: {weather.windSpeed.toFixed(1)} km/h</div>
							{#if weather.precipitation > 0}
								<div>Rain: {weather.precipitation.toFixed(1)} mm</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
