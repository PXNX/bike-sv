<!-- src/lib/components/WeatherForecast.svelte -->
<script lang="ts">
	import IconChevronDown from '~icons/fluent/chevron-down-20-regular';
	import IconChevronUp from '~icons/fluent/chevron-up-20-regular';
	import IconWeatherCloudy from '~icons/fluent/weather-cloudy-20-filled';
	import IconWeatherPartlyCloudyDay from '~icons/fluent/weather-partly-cloudy-day-20-filled';
	import IconWeatherRain from '~icons/fluent/weather-rain-20-filled';
	import IconWeatherSnow from '~icons/fluent/weather-snow-20-filled';
	import IconWeatherSunny from '~icons/fluent/weather-sunny-20-filled';
	import IconWeatherThunderstorm from '~icons/fluent/weather-thunderstorm-20-filled';
	import IconTemperature from '~icons/fluent/temperature-20-filled';
	import IconWeatherHaze from '~icons/fluent/weather-haze-20-filled';
	import FluentEmojiDroplet from '~icons/fluent-emoji/droplet';
	import FluentEmojiDashingAway from '~icons/fluent-emoji/dashing-away';

	import { formatTime } from '$lib/utils/calculator';
	import { getWeatherDescription, type WeatherData } from '$lib/utils/weather';

	interface Props {
		weatherData: WeatherData[];
		expanded?: boolean;
		onToggle?: () => void;
	}

	let { weatherData, expanded = false, onToggle }: Props = $props();

	function getWeatherIcon(code: number) {
		if (code === 0 || code === 1) return IconWeatherSunny;
		if (code === 2) return IconWeatherPartlyCloudyDay;
		if (code === 3) return IconWeatherCloudy;
		if (code === 45 || code === 48) return IconWeatherHaze;
		if (code >= 51 && code <= 65) return IconWeatherRain;
		if (code >= 71 && code <= 75) return IconWeatherSnow;
		if (code >= 95) return IconWeatherThunderstorm;
		return IconWeatherCloudy;
	}

	function getWeatherColor(code: number): string {
		if (code === 0 || code === 1) return 'bg-yellow-500/10 border-yellow-500/30';
		if (code === 2) return 'bg-blue-500/10 border-blue-500/30';
		if (code === 3) return 'bg-gray-500/10 border-gray-500/30';
		if (code === 45 || code === 48) return 'bg-gray-400/10 border-gray-400/30';
		if (code >= 51 && code <= 65) return 'bg-blue-600/10 border-blue-600/30';
		if (code >= 71 && code <= 75) return 'bg-cyan-400/10 border-cyan-400/30';
		if (code >= 95) return 'bg-purple-600/10 border-purple-600/30';
		return 'bg-base-200';
	}

	function getTempColor(temp: number): string {
		if (temp < 0) return 'text-cyan-400';
		if (temp < 10) return 'text-blue-500';
		if (temp < 20) return 'text-green-500';
		if (temp < 30) return 'text-orange-500';
		return 'text-red-500';
	}
</script>

<div class="card bg-base-100 border-base-300 border">
	<div class="card-body p-4">
		{#if onToggle}
			<button onclick={onToggle} class="flex w-full items-center justify-between text-left">
				<h2 class="card-title flex items-center gap-2 text-base md:text-lg">
					<IconTemperature class="text-orange-500" />
					Weather Forecast
				</h2>
				{#if expanded}
					<IconChevronUp class="text-xl" />
				{:else}
					<IconChevronDown class="text-xl" />
				{/if}
			</button>
		{:else}
			<h2 class="card-title flex items-center gap-2 text-base md:text-lg">
				<IconTemperature class="text-orange-500" />
				Weather Forecast
			</h2>
		{/if}

		{#if expanded}
			<div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{#each weatherData as weather, i (i)}
					{@const WeatherIcon = getWeatherIcon(weather.weatherCode)}
					<div
						class="rounded-lg border p-4 transition-shadow hover:shadow-md {getWeatherColor(
							weather.weatherCode
						)}"
					>
						<div class="mb-3 flex items-center justify-between">
							<div class="text-sm font-semibold opacity-80">{formatTime(weather.time)}</div>
							<WeatherIcon class="text-2xl" />
						</div>

						<div class="mb-3 text-3xl font-bold {getTempColor(weather.temperature)}">
							{weather.temperature.toFixed(1)}°C
						</div>

						<div class="space-y-2 text-sm">
							<div class="flex items-center gap-2">
								<span class="opacity-70">{getWeatherDescription(weather.weatherCode)}</span>
							</div>

							<div class="flex items-center gap-2">
								<FluentEmojiDashingAway class="text-base" />
								<span class="opacity-70">{weather.windSpeed.toFixed(1)} km/h</span>
							</div>

							{#if weather.precipitation > 0}
								<div class="flex items-center gap-2 text-blue-500">
									<FluentEmojiDroplet class="text-base" />
									<span class="font-medium">{weather.precipitation.toFixed(1)} mm</span>
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
