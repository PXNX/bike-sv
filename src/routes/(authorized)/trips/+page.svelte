<!-- src/routes/trips/+page.svelte -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { parseGPX, interpolatePointAtDistance, type TrackPoint } from '$lib/utils/gpx';
	import {
		calculateTripSegments,
		formatTime,
		formatDuration,
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
	import IconUpload from '~icons/fluent/arrow-upload-20-regular';
	import IconSave from '~icons/fluent/save-20-regular';
	import IconShare from '~icons/fluent/share-20-regular';
	import IconDelete from '~icons/fluent/delete-20-regular';
	import FluentEmojiTShirt from '~icons/fluent-emoji/t-shirt';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let gpxFile: File | null = $state(null);
	let tripName = $state('');
	let startTime = $state('');
	let startDate = $state('');
	let isPublic = $state(false);

	let gpxData: { points: TrackPoint[]; totalDistanceKm: number } | null = $state(null);
	let pauses: Pause[] = $state([]);
	let segments: TripSegment[] = $state([]);
	let weatherData: WeatherData[] = $state([]);
	let sunTimes: SunTimes | null = $state(null);
	let clothingRecs: ClothingRecommendation[] = $state([]);
	let loading = $state(false);
	let saving = $state(false);

	let tripStartDateTime = $derived(
		startDate && startTime ? new Date(`${startDate}T${startTime}`) : null
	);
	let tripEndTime = $derived(segments.length > 0 ? segments[segments.length - 1].endTime : null);

	async function handleFileUpload(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		gpxFile = file;
		const text = await file.text();
		const parsed = parseGPX(text);
		gpxData = parsed;

		// Set default name and date/time
		tripName = file.name.replace('.gpx', '');
		const now = new Date();
		startDate = now.toISOString().split('T')[0];
		startTime = now.toTimeString().slice(0, 5);
	}

	function addPause(lat: number, lon: number, distanceKm: number) {
		if (!gpxData) return;

		const point = interpolatePointAtDistance(gpxData.points, distanceKm) || { lat, lon };

		pauses = [
			...pauses,
			{
				distanceKm,
				durationMinutes: 15,
				point
			}
		];
	}

	function removePause(index: number) {
		pauses = pauses.filter((_, i) => i !== index);
	}

	function updatePauseDuration(index: number, minutes: number) {
		pauses = pauses.map((p, i) => (i === index ? { ...p, durationMinutes: minutes } : p));
	}

	async function analyzeTrip() {
		if (!gpxData || !tripStartDateTime) return;

		loading = true;

		try {
			segments = calculateTripSegments(
				gpxData.points,
				gpxData.totalDistanceKm,
				tripStartDateTime,
				pauses
			);

			const midPoint = gpxData.points[Math.floor(gpxData.points.length / 2)];
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
			console.error('Error analyzing trip:', err);
			alert('Error fetching weather data');
		} finally {
			loading = false;
		}
	}

	async function saveTrip() {
		if (!gpxData || !tripStartDateTime || !tripName) return;

		saving = true;

		const formData = new FormData();
		formData.append('name', tripName);
		formData.append('gpxData', await gpxFile!.text());
		formData.append('startTime', tripStartDateTime.toISOString());
		formData.append(
			'pauses',
			JSON.stringify(
				pauses.map((p) => ({
					lat: p.point.lat,
					lon: p.point.lon,
					durationMinutes: p.durationMinutes,
					distanceKm: p.distanceKm
				}))
			)
		);
		formData.append('isPublic', isPublic.toString());

		const response = await fetch('?/saveTrip', {
			method: 'POST',
			body: formData
		});

		if (response.redirected) {
			window.location.href = response.url;
		}

		saving = false;
	}

	function loadTrip(trip: any) {
		tripName = trip.name;
		const parsed = parseGPX(trip.gpxData);
		gpxData = parsed;

		const startDt = new Date(trip.startTime);
		startDate = startDt.toISOString().split('T')[0];
		startTime = startDt.toTimeString().slice(0, 5);
		isPublic = trip.isPublic === 1;
	}

	$effect(() => {
		if (gpxData && tripStartDateTime && !loading) {
			analyzeTrip();
		}
	});
</script>

<svelte:head>
	<title>Bike Trip Weather Analyzer</title>
</svelte:head>

<div class="container mx-auto max-w-7xl p-6">
	<div class="mb-8 flex items-center justify-between">
		<h1 class="text-3xl font-bold">Bike Trip Weather Analyzer</h1>
	</div>

	<div class="grid gap-6 lg:grid-cols-3">
		<div class="space-y-4 lg:col-span-1">
			<div class="card bg-base-100 border-base-300 border">
				<div class="card-body">
					<h2 class="card-title text-lg">Trip Details</h2>

					<div class="form-control">
						<label class="label">
							<span class="label-text">GPX File</span>
						</label>
						<input
							type="file"
							accept=".gpx"
							onchange={handleFileUpload}
							class="file-input file-input-bordered w-full"
						/>
					</div>

					{#if gpxData}
						<div class="form-control">
							<label class="label">
								<span class="label-text">Trip Name</span>
							</label>
							<input
								type="text"
								bind:value={tripName}
								class="input input-bordered"
								placeholder="My bike trip"
							/>
						</div>

						<div class="form-control">
							<label class="label">
								<span class="label-text">Start Date</span>
							</label>
							<input type="date" bind:value={startDate} class="input input-bordered" />
						</div>

						<div class="form-control">
							<label class="label">
								<span class="label-text">Start Time</span>
							</label>
							<input type="time" bind:value={startTime} class="input input-bordered" />
						</div>

						<div class="form-control">
							<label class="label cursor-pointer">
								<span class="label-text">Make trip public (shareable link)</span>
								<input type="checkbox" bind:checked={isPublic} class="checkbox" />
							</label>
						</div>

						<button
							onclick={saveTrip}
							disabled={saving || !tripName}
							class="btn btn-primary w-full"
						>
							<IconSave />
							{saving ? 'Saving...' : 'Save Trip'}
						</button>

						<div class="divider"></div>

						<div class="space-y-2 text-sm">
							<p><strong>Distance:</strong> {gpxData.totalDistanceKm.toFixed(1)} km</p>
							<p><strong>Points:</strong> {gpxData.points.length}</p>
						</div>
					{/if}
				</div>
			</div>

			{#if gpxData}
				<div class="card bg-base-100 border-base-300 border">
					<div class="card-body">
						<h2 class="card-title text-lg">Pauses</h2>
						<p class="text-sm opacity-70">Click on the map to add pauses</p>

						{#if pauses.length === 0}
							<p class="text-sm opacity-50">No pauses added yet</p>
						{:else}
							<div class="space-y-2">
								{#each pauses as pause, i}
									<div class="border-base-300 flex items-center gap-2 rounded border p-2">
										<div class="flex-1">
											<div class="text-sm font-medium">{pause.distanceKm.toFixed(1)} km</div>
											<input
												type="number"
												value={pause.durationMinutes}
												oninput={(e) =>
													updatePauseDuration(i, parseInt((e.target as HTMLInputElement).value))}
												class="input input-xs input-bordered mt-1 w-20"
												min="1"
											/>
											<span class="ml-1 text-xs">min</span>
										</div>
										<button onclick={() => removePause(i)} class="btn btn-ghost btn-sm btn-square">
											<IconDelete />
										</button>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			{/if}

			{#if data.trips.length > 0}
				<div class="card bg-base-100 border-base-300 border">
					<div class="card-body">
						<h2 class="card-title text-lg">Your Trips</h2>
						<div class="space-y-2">
							{#each data.trips as trip}
								<button
									onclick={() => goto(`/trips/${trip.id}`)}
									class="btn btn-sm btn-ghost w-full justify-start"
								>
									{trip.name}
								</button>
							{/each}
						</div>
					</div>
				</div>
			{/if}
		</div>

		<div class="space-y-6 lg:col-span-2">
			{#if gpxData}
				<div class="card bg-base-100 border-base-300 border">
					<div class="card-body">
						<h2 class="card-title text-lg">Route Map</h2>
						<TripMap points={gpxData.points} {pauses} onPauseAdd={addPause} />
					</div>
				</div>

				{#if sunTimes && tripStartDateTime && tripEndTime}
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
											<th>Duration</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td>0.0 km</td>
											<td>{formatTime(tripStartDateTime!)}</td>
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
			{:else}
				<div class="card bg-base-100 border-base-300 border">
					<div class="card-body items-center py-20 text-center">
						<IconUpload class="mb-4 text-6xl opacity-30" />
						<h3 class="mb-2 text-xl font-semibold">Upload a GPX File</h3>
						<p class="opacity-70">Get started by uploading your bike trip GPX file</p>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
