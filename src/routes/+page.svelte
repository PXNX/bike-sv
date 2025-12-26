<!-- src/routes/+page.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import IconBike from '~icons/fluent/vehicle-bicycle-20-regular';
	import IconWeather from '~icons/fluent/weather-partly-cloudy-day-20-regular';
	import IconMap from '~icons/fluent/map-20-regular';
	import IconShare from '~icons/fluent/share-20-regular';
</script>

<svelte:head>
	<title>Bike Trip Weather Analyzer</title>
</svelte:head>

<div class="bg-base-200 min-h-screen">
	<div class="container mx-auto max-w-6xl px-6 py-16">
		<div class="mb-16 text-center">
			<div class="bg-primary/10 mb-6 inline-block rounded-full p-4">
				<IconBike class="text-primary text-6xl" />
			</div>
			<h1 class="mb-4 text-5xl font-bold">Bike Trip Weather Analyzer</h1>
			<p class="mx-auto max-w-2xl text-xl opacity-70">
				Plan your bike trips with confidence. Upload your GPX route and get detailed weather
				forecasts, clothing recommendations, and sun timeline analysis.
			</p>
			<div class="mt-8 flex justify-center gap-4">
				<button onclick={() => goto('/trips')} class="btn btn-primary btn-lg"> Get Started </button>
			</div>
		</div>

		<div class="mb-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
			<div class="card bg-base-100 border-base-300 border">
				<div class="card-body items-center text-center">
					<IconMap class="text-primary mb-2 text-4xl" />
					<h3 class="card-title text-lg">Route Mapping</h3>
					<p class="text-sm opacity-70">
						Upload GPX files and visualize your route on an interactive cycling map
					</p>
				</div>
			</div>

			<div class="card bg-base-100 border-base-300 border">
				<div class="card-body items-center text-center">
					<IconWeather class="text-primary mb-2 text-4xl" />
					<h3 class="card-title text-lg">Weather Forecast</h3>
					<p class="text-sm opacity-70">
						Get hourly weather predictions along your route including rain, wind, and temperature
					</p>
				</div>
			</div>

			<div class="card bg-base-100 border-base-300 border">
				<div class="card-body items-center text-center">
					<IconBike class="text-primary mb-2 text-4xl" />
					<h3 class="card-title text-lg">Clothing Guide</h3>
					<p class="text-sm opacity-70">
						Intelligent clothing recommendations based on weather, temperature, and light conditions
					</p>
				</div>
			</div>

			<div class="card bg-base-100 border-base-300 border">
				<div class="card-body items-center text-center">
					<IconShare class="text-primary mb-2 text-4xl" />
					<h3 class="card-title text-lg">Share Trips</h3>
					<p class="text-sm opacity-70">
						Save your trips and share them with friends via a simple link
					</p>
				</div>
			</div>
		</div>

		<div class="card bg-base-100 border-base-300 border">
			<div class="card-body">
				<h2 class="card-title mb-4 text-2xl">How It Works</h2>
				<div class="space-y-4">
					<div class="flex gap-4">
						<div
							class="bg-primary text-primary-content flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-bold"
						>
							1
						</div>
						<div>
							<h3 class="mb-1 font-semibold">Upload Your GPX File</h3>
							<p class="text-sm opacity-70">
								Export your planned bike route from any GPS app or route planner as a GPX file
							</p>
						</div>
					</div>

					<div class="flex gap-4">
						<div
							class="bg-primary text-primary-content flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-bold"
						>
							2
						</div>
						<div>
							<h3 class="mb-1 font-semibold">Set Your Start Time</h3>
							<p class="text-sm opacity-70">
								Choose when you plan to start your ride to get accurate daylight and weather
								predictions
							</p>
						</div>
					</div>

					<div class="flex gap-4">
						<div
							class="bg-primary text-primary-content flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-bold"
						>
							3
						</div>
						<div>
							<h3 class="mb-1 font-semibold">Add Pauses (Optional)</h3>
							<p class="text-sm opacity-70">
								Click on the map to add rest stops and specify how long you'll pause at each
								location
							</p>
						</div>
					</div>

					<div class="flex gap-4">
						<div
							class="bg-primary text-primary-content flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-bold"
						>
							4
						</div>
						<div>
							<h3 class="mb-1 font-semibold">Get Your Analysis</h3>
							<p class="text-sm opacity-70">
								View weather forecasts, sun timeline, clothing recommendations, and save your trip
								for later
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="mt-16 text-center">
			<button onclick={() => goto('/trips')} class="btn btn-primary btn-lg">
				Start Planning Your Trip
			</button>
		</div>
	</div>
</div>
