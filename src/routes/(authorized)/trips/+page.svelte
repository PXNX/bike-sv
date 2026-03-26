<!-- src/routes/trips/+page.svelte - Debug Version -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { parseGPX, interpolatePointAtDistance, type TrackPoint } from '$lib/utils/gpx';
	import { calculateTripSegments, type Pause, type TripSegment } from '$lib/utils/calculator';
	import {
		fetchWeatherForPoint,
		fetchSunTimes,
		type WeatherData,
		type SunTimes
	} from '$lib/utils/weather';
	import { getClothingRecommendations, type ClothingRecommendation } from '$lib/utils/clothing';

	import TripUploadForm from '$lib/components/TripUploadForm.svelte';
	import TripMap from '$lib/components/TripMap.svelte';
	import SunChart from '$lib/components/SunChart.svelte';
	import PauseList from '$lib/components/PauseList.svelte';
	import ClothingRecommendations from '$lib/components/ClothingRecommendations.svelte';
	import TripTimeline from '$lib/components/TripTimeline.svelte';
	import WeatherForecast from '$lib/components/WeatherForecast.svelte';
	import SavedTripsList from '$lib/components/SavedTripsList.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Form state
	let gpxFile: File | null = $state(null);
	let tripName = $state('');
	let startTime = $state('');
	let startDate = $state('');
	let isPublic = $state(false);

	// Trip data
	let gpxData: { points: TrackPoint[]; totalDistanceKm: number } | null = $state(null);
	let pauses: Pause[] = $state([]);
	let segments: TripSegment[] = $state([]);
	let weatherData: WeatherData[] = $state([]);
	let sunTimes: SunTimes | null = $state(null);
	let clothingRecs: ClothingRecommendation[] = $state([]);

	// UI state
	let loading = $state(false);
	let saving = $state(false);
	let showPauses = $state(true);
	let showTrips = $state(false);
	let showClothing = $state(true);
	let showTimeline = $state(false);
	let showWeather = $state(false);
	let errorMessage = $state('');

	// Track when we last analyzed to prevent duplicate calls
	let lastAnalyzedKey = $state<string | null>(null);

	// Derived state
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

		tripName = file.name.replace('.gpx', '');
		const now = new Date();
		startDate = now.toISOString().split('T')[0];
		startTime = now.toTimeString().slice(0, 5);
	}

	function addPause(lat: number, lon: number, distanceKm: number) {
		if (!gpxData) return;

		const point = interpolatePointAtDistance(gpxData.points, distanceKm) || { lat, lon };
		pauses = [...pauses, { distanceKm, durationMinutes: 15, point }];
	}

	function removePause(index: number) {
		pauses = pauses.filter((_, i) => i !== index);
	}

	function updatePauseDuration(index: number, minutes: number) {
		pauses = pauses.map((p, i) => (i === index ? { ...p, durationMinutes: minutes } : p));
	}

	async function analyzeTrip() {
		if (!gpxData || !tripStartDateTime) {
			console.log('Cannot analyze: missing data', { gpxData: !!gpxData, tripStartDateTime });
			return;
		}

		loading = true;
		errorMessage = '';

		try {
			console.log('Starting analysis with:', {
				points: gpxData.points.length,
				totalDistance: gpxData.totalDistanceKm,
				startTime: tripStartDateTime,
				pausesCount: pauses.length
			});

			console.log('Calculating segments...');
			const calculatedSegments = calculateTripSegments(
				gpxData.points,
				gpxData.totalDistanceKm,
				tripStartDateTime,
				pauses
			);
			console.log('Segments calculated:', calculatedSegments);

			if (!calculatedSegments || calculatedSegments.length === 0) {
				throw new Error('No segments were calculated. Check calculateTripSegments function.');
			}

			segments = calculatedSegments;

			const midPoint = gpxData.points[Math.floor(gpxData.points.length / 2)];
			const endTime = segments[segments.length - 1].endTime;

			console.log('Midpoint:', midPoint, 'EndTime:', endTime);

			console.log('Fetching weather data...');
			const fetchedWeather = await fetchWeatherForPoint(
				midPoint.lat,
				midPoint.lon,
				tripStartDateTime,
				endTime
			);
			console.log('Weather data fetched:', fetchedWeather);
			weatherData = fetchedWeather;

			console.log('Fetching sun times...');
			const fetchedSunTimes = await fetchSunTimes(midPoint.lat, midPoint.lon, tripStartDateTime);
			console.log('Sun times fetched:', fetchedSunTimes);
			sunTimes = fetchedSunTimes;

			if (sunTimes && weatherData.length > 0) {
				console.log('Getting clothing recommendations...');
				const recs = getClothingRecommendations(weatherData, sunTimes, tripStartDateTime, endTime);
				console.log('Clothing recs:', recs);
				clothingRecs = recs;
			} else {
				console.log('Skipping clothing recs:', {
					hasSunTimes: !!sunTimes,
					weatherCount: weatherData.length
				});
			}

			console.log('Analysis complete!');
		} catch (err) {
			console.error('Error analyzing trip:', err);
			errorMessage = err instanceof Error ? `${err.message}\n${err.stack}` : 'Error analyzing trip';
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

	// Effect to trigger analysis when data changes
	$effect(() => {
		if (!gpxData || !tripStartDateTime) {
			console.log('Effect: Waiting for data...', {
				hasGpx: !!gpxData,
				hasDateTime: !!tripStartDateTime
			});
			return;
		}

		if (loading) {
			console.log('Effect: Already loading, skipping...');
			return;
		}

		// Create a key that represents the current analysis state
		const analysisKey = `${tripStartDateTime.toISOString()}_${pauses.length}_${pauses.map((p) => `${p.distanceKm}_${p.durationMinutes}`).join('_')}`;

		console.log('Effect: Checking if analysis needed...', {
			newKey: analysisKey,
			oldKey: lastAnalyzedKey,
			needsAnalysis: analysisKey !== lastAnalyzedKey
		});

		// Only analyze if the key has changed
		if (analysisKey !== lastAnalyzedKey) {
			lastAnalyzedKey = analysisKey;

			// For pause changes, debounce; for initial load, run immediately
			if (pauses.length > 0 && segments.length > 0) {
				console.log('Effect: Debouncing for pause change...');
				const timeoutId = setTimeout(() => {
					console.log('Effect: Debounce complete, calling analyzeTrip()');
					analyzeTrip();
				}, 500);

				return () => {
					console.log('Effect: Cleanup - clearing timeout');
					clearTimeout(timeoutId);
				};
			} else {
				console.log('Effect: Running analysis immediately (initial load)');
				analyzeTrip();
			}
		} else {
			console.log('Effect: Analysis key unchanged, skipping');
		}
	});
</script>

<svelte:head>
	<title>Bike Trip Weather Analyzer</title>
</svelte:head>

<div class="bg-base-200 min-h-screen">
	<div class="pb-safe container mx-auto max-w-7xl p-4 md:p-6">
		<div class="mb-6 flex items-center justify-between md:mb-8">
			<h1 class="text-2xl font-bold md:text-3xl">Bike Trip Analyzer</h1>
		</div>

		{#if !gpxData}
			<!-- Upload State -->
			<div class="space-y-4">
				<TripUploadForm
					{gpxData}
					{tripName}
					{startDate}
					{startTime}
					{isPublic}
					{saving}
					onNameChange={(name) => (tripName = name)}
					onDateChange={(date) => (startDate = date)}
					onTimeChange={(time) => (startTime = time)}
					onPublicChange={(pub) => (isPublic = pub)}
					onSave={saveTrip}
					onFileUpload={handleFileUpload}
				/>

				<SavedTripsList
					trips={data.trips}
					expanded={showTrips}
					onToggle={() => (showTrips = !showTrips)}
					onTripClick={(id) => goto(`/trips/${id}`)}
				/>

				<EmptyState />
			</div>
		{:else}
			<!-- Trip Loaded State -->
			<div class="space-y-4">
				<TripUploadForm
					{gpxData}
					{tripName}
					{startDate}
					{startTime}
					{isPublic}
					{saving}
					onNameChange={(name) => (tripName = name)}
					onDateChange={(date) => (startDate = date)}
					onTimeChange={(time) => (startTime = time)}
					onPublicChange={(pub) => (isPublic = pub)}
					onSave={saveTrip}
					onFileUpload={handleFileUpload}
				/>

				<!-- Map Card -->
				<div class="card bg-base-100 border-base-300 border">
					<div class="card-body p-4">
						<h2 class="card-title mb-2 text-base md:text-lg">Route Map</h2>
						<p class="mb-2 text-xs opacity-70">Tap map to add pauses</p>
						<div class="h-[300px] md:h-[400px]">
							<TripMap points={gpxData.points} {pauses} onPauseAdd={addPause} />
						</div>
					</div>
				</div>

				<!-- Manual Analyze Button (for debugging) -->
				<div class="card bg-base-100 border-base-300 border">
					<div class="card-body p-4">
						<button
							class="btn btn-primary"
							onclick={() => {
								console.log('Manual analyze button clicked');
								analyzeTrip();
							}}
							disabled={loading}
						>
							{loading ? 'Analyzing...' : 'Analyze Trip (Manual)'}
						</button>
					</div>
				</div>

				{#if loading}
					<div class="card bg-base-100 border-base-300 border">
						<div class="card-body p-8 text-center">
							<div class="loading loading-spinner loading-lg mx-auto"></div>
							<p class="mt-4 text-sm opacity-70">Analyzing trip and fetching weather data...</p>
						</div>
					</div>
				{/if}

				{#if errorMessage}
					<div class="alert alert-error">
						<span>{errorMessage}</span>
					</div>
				{/if}

				<!-- Debug Info -->
				<div class="card bg-base-100 border-base-300 border">
					<div class="card-body p-4">
						<h3 class="font-bold">Debug Info:</h3>
						<pre class="overflow-auto text-xs">{JSON.stringify(
								{
									hasGpxData: !!gpxData,
									pointsCount: gpxData?.points.length,
									hasTripStartDateTime: !!tripStartDateTime,
									pausesCount: pauses.length,
									segmentsCount: segments.length,
									weatherDataCount: weatherData.length,
									hasSunTimes: !!sunTimes,
									clothingRecsCount: clothingRecs.length,
									loading,
									tripEndTime: tripEndTime?.toISOString(),
									lastAnalyzedKey
								},
								null,
								2
							)}</pre>
					</div>
				</div>

				<PauseList
					{pauses}
					expanded={showPauses}
					onToggle={() => (showPauses = !showPauses)}
					onRemove={removePause}
					onUpdateDuration={updatePauseDuration}
				/>

				{#if sunTimes && tripStartDateTime && tripEndTime}
					<div class="card bg-base-100 border-base-300 border">
						<div class="card-body p-4">
							<SunChart {sunTimes} tripStart={tripStartDateTime} tripEnd={tripEndTime} {segments} />
						</div>
					</div>
				{:else}
					<div class="card bg-base-100 border-base-300 border">
						<div class="card-body p-4">
							<p class="text-sm opacity-70">Sun chart will appear after analysis completes</p>
						</div>
					</div>
				{/if}

				{#if clothingRecs.length > 0}
					<ClothingRecommendations
						recommendations={clothingRecs}
						expanded={showClothing}
						onToggle={() => (showClothing = !showClothing)}
					/>
				{:else}
					<div class="card bg-base-100 border-base-300 border">
						<div class="card-body p-4">
							<p class="text-sm opacity-70">Clothing recommendations will appear after analysis</p>
						</div>
					</div>
				{/if}

				{#if segments.length > 0}
					<TripTimeline
						{segments}
						{pauses}
						tripStart={tripStartDateTime!}
						expanded={showTimeline}
						onToggle={() => (showTimeline = !showTimeline)}
					/>
				{:else}
					<div class="card bg-base-100 border-base-300 border">
						<div class="card-body p-4">
							<p class="text-sm opacity-70">Timeline will appear after analysis completes</p>
						</div>
					</div>
				{/if}

				{#if weatherData.length > 0}
					<WeatherForecast
						{weatherData}
						expanded={showWeather}
						onToggle={() => (showWeather = !showWeather)}
					/>
				{:else}
					<div class="card bg-base-100 border-base-300 border">
						<div class="card-body p-4">
							<p class="text-sm opacity-70">Weather forecast will appear after analysis</p>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
