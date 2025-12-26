<!-- src/routes/trips/[id]/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { parseGPX, type TrackPoint } from '$lib/utils/gpx';
	import {
		calculateTripSegments,
		formatTime,
		type Pause,
		type TripSegment
	} from '$lib/utils/calculator';
	import {
		fetchWeatherForPoint,
		fetchSunTimes,
		getWeatherDescription,
		type WeatherData,
		type SunTimes
	} from '$lib/utils/weather';
	import { getClothingRecommendations, type ClothingRecommendation } from '$lib/utils/clothing';
	import TripMap from '$lib/components/TripMap.svelte';
	import SunChart from '$lib/components/SunChart.svelte';
	import IconShare from '~icons/fluent/share-20-regular';
	import IconEdit from '~icons/fluent/edit-20-regular';
	import IconDelete from '~icons/fluent/delete-20-regular';
	import FluentEmojiTShirt from '~icons/fluent-emoji/t-shirt';
	import IconBack from '~icons/fluent/arrow-left-20-regular';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let gpxData: { points: TrackPoint[]; totalDistanceKm: number } | null = $state(null);
	let pauses: Pause[] = $state([]);
	let segments: TripSegment[] = $state([]);
	let weatherData: WeatherData[] = $state([]);
	let sunTimes: SunTimes | null = $state(null);
	let clothingRecs: ClothingRecommendation[] = $state([]);
	let loading = $state(false);

	let tripStartDateTime = $derived(new Date(data.trip.startTime));
	let tripEndTime = $derived(segments.length > 0 ? segments[segments.length - 1].endTime : null);
	let shareUrl = $derived(`${$page.url.origin}/trips/${data.trip.id}`);

	async function loadTripData() {
		loading = true;

		try {
			const parsed = parseGPX(data.trip.gpxData);
			gpxData = parsed;

			pauses = data.pauses.map((p) => ({
				distanceKm: p.distanceKm,
				durationMinutes: p.durationMinutes,
				point: { lat: p.lat, lon: p.lon }
			}));

			segments = calculateTripSegments(
				parsed.points,
				parsed.totalDistanceKm,
				tripStartDateTime,
				pauses
			);

			const midPoint = parsed.points[Math.floor(parsed.points.length / 2)];
			const endTime = segments[segments.length - 1].endTime;

			weatherData = await fetchWeatherForPoint(
				midPoint.lat,
				midPoint.lon,
				tripStartDateTime,
				endTime
			);
			sunTimes = await fetchSunTimes(midPoint.lat, midPoint.lon, tripStartDateTime);

			if (sunTimes && weatherData.length > 0) {
				clothingRecs = getClothingRecommendations(
					weatherData,
					sunTimes,
					tripStartDateTime,
					endTime
				);
			}
		} catch (err) {
			console.error('Error loading trip:', err);
		} finally {
			loading = false;
		}
	}

	async function deleteTrip() {
		if (!confirm('Are you sure you want to delete this trip?')) return;

		const formData = new FormData();
		formData.append('tripId', data.trip.id);

		await fetch('/trips?/deleteTrip', {
			method: 'POST',
			body: formData
		});

		goto('/trips');
	}

	function copyShareLink() {
		navigator.clipboard.writeText(shareUrl);
		alert('Link copied to clipboard!');
	}

	onMount(() => {
		loadTripData();
	});
</script>

<svelte:head>
	<title>{data.trip.name} - Bike Trip</title>
</svelte:head>

<div class="container mx-auto max-w-7xl p-6">
	<div class="mb-8 flex items-center gap-4">
		<button onclick={() => goto('/trips')} class="btn btn-ghost btn-circle">
			<IconBack />
		</button>
		<h1 class="flex-1 text-3xl font-bold">{data.trip.name}</h1>

		{#if data.trip.isPublic === 1}
			<button onclick={copyShareLink} class="btn btn-outline">
				<IconShare />
				Share
			</button>
		{/if}

		{#if data.isOwner}
			<button onclick={deleteTrip} class="btn btn-outline btn-error">
				<IconDelete />
				Delete
			</button>
		{/if}
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-20">
			<span class="loading loading-spinner loading-lg"></span>
		</div>
	{:else if gpxData}
		<div class="grid gap-6 lg:grid-cols-3">
			<div class="space-y-4 lg:col-span-1">
				<div class="card bg-base-100 border-base-300 border">
					<div class="card-body">
						<h2 class="card-title text-lg">Trip Info</h2>

						<div class="space-y-2 text-sm">
							<div>
								<span class="font-semibold">Start:</span>
								<div>{formatTime(tripStartDateTime)}</div>
								<div class="opacity-70">{tripStartDateTime.toLocaleDateString('de-DE')}</div>
							</div>

							{#if tripEndTime}
								<div>
									<span class="font-semibold">End:</span>
									<div>{formatTime(tripEndTime)}</div>
								</div>
							{/if}

							<div class="divider"></div>

							<div>
								<span class="font-semibold">Distance:</span>
								{gpxData.totalDistanceKm.toFixed(1)} km
							</div>

							<div>
								<span class="font-semibold">Pauses:</span>
								{pauses.length}
							</div>

							<div>
								<span class="font-semibold">Visibility:</span>
								{data.trip.isPublic === 1 ? 'Public' : 'Private'}
							</div>
						</div>
					</div>
				</div>

				{#if pauses.length > 0}
					<div class="card bg-base-100 border-base-300 border">
						<div class="card-body">
							<h2 class="card-title text-lg">Pauses</h2>
							<div class="space-y-2">
								{#each pauses as pause}
									<div class="border-base-300 rounded border p-2">
										<div class="text-sm font-medium">{pause.distanceKm.toFixed(1)} km</div>
										<div class="text-xs opacity-70">{pause.durationMinutes} min</div>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/if}
			</div>

			<div class="space-y-6 lg:col-span-2">
				<div class="card bg-base-100 border-base-300 border">
					<div class="card-body">
						<h2 class="card-title text-lg">Route Map</h2>
						<TripMap points={gpxData.points} {pauses} interactive={false} />
					</div>
				</div>

				{#if sunTimes && tripEndTime}
					<div class="card bg-base-100 border-base-300 border">
						<div class="card-body">
							<h2 class="card-title text-lg">Sun Timeline</h2>
							<SunChart {sunTimes} tripStart={tripStartDateTime} tripEnd={tripEndTime} {segments} />
						</div>
					</div>
				{/if}

				{#if clothingRecs.length > 0}
					<div class="card bg-base-100 border-base-300 border">
						<div class="card-body">
							<h2 class="card-title text-lg">
								<FluentEmojiTShirt />
								Clothing Recommendations
							</h2>

							<div class="space-y-4">
								{#each clothingRecs as rec}
									<div
										class:alert={rec.category === 'Safety Warnings'}
										class:alert-warning={rec.category === 'Safety Warnings'}
									>
										<h3 class="mb-2 font-semibold">{rec.category}</h3>
										<p class="mb-2 text-sm opacity-70">{rec.reason}</p>
										<ul class="list-inside list-disc space-y-1">
											{#each rec.items as item}
												<li class="text-sm">{item}</li>
											{/each}
										</ul>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/if}

				{#if segments.length > 0}
					<div class="card bg-base-100 border-base-300 border">
						<div class="card-body">
							<h2 class="card-title text-lg">Trip Timeline</h2>

							<div class="overflow-x-auto">
								<table class="table">
									<thead>
										<tr>
											<th>Distance</th>
											<th>Time</th>
											<th>Event</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td>0.0 km</td>
											<td>{formatTime(tripStartDateTime)}</td>
											<td>Start</td>
										</tr>
										{#each segments as segment, i}
											<tr>
												<td>{segment.distanceKm.toFixed(1)} km</td>
												<td>{formatTime(segment.endTime)}</td>
												<td>
													{#if i < pauses.length}
														Pause ({pauses[i].durationMinutes} min)
													{:else}
														End
													{/if}
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				{/if}

				{#if weatherData.length > 0}
					<div class="card bg-base-100 border-base-300 border">
						<div class="card-body">
							<h2 class="card-title text-lg">Weather Forecast</h2>

							<div class="grid gap-4 sm:grid-cols-2">
								{#each weatherData as weather}
									<div class="border-base-300 rounded border p-3">
										<div class="mb-2 font-medium">{formatTime(weather.time)}</div>
										<div class="mb-1 text-2xl font-bold">{weather.temperature.toFixed(1)}°C</div>
										<div class="space-y-1 text-sm">
											<div>{getWeatherDescription(weather.weatherCode)}</div>
											<div>Wind: {weather.windSpeed.toFixed(1)} km/h</div>
											{#if weather.precipitation > 0}
												<div>Rain: {weather.precipitation.toFixed(1)} mm</div>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
