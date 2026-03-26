<!-- src/lib/components/TripMap.svelte -->
<script lang="ts">
	import { Map, TileLayer, Marker, Polyline } from 'sveaflet';
	import type { TrackPoint } from '$lib/utils/gpx';
	import type { Pause } from '$lib/utils/calculator';

	interface Props {
		points: TrackPoint[];
		pauses: Pause[];
		onPauseAdd?: (lat: number, lon: number, distanceKm: number) => void;
		interactive?: boolean;
	}

	let { points, pauses, onPauseAdd, interactive = true }: Props = $props();

	let mapElement = $state<any>(null);
	let mapInstance = $state<any>(null);

	// Calculate map center and bounds
	const mapCenter = $derived.by(() => {
		if (!points || points.length === 0) return [51.505, -0.09] as [number, number];
		const lats = points.map((p) => p.lat);
		const lons = points.map((p) => p.lon);
		const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
		const centerLon = (Math.min(...lons) + Math.max(...lons)) / 2;
		return [centerLat, centerLon] as [number, number];
	});

	const bounds = $derived.by(() => {
		if (!points || points.length === 0) return null;
		const lats = points.map((p) => p.lat);
		const lons = points.map((p) => p.lon);
		return [
			[Math.min(...lats), Math.min(...lons)],
			[Math.max(...lats), Math.max(...lons)]
		] as [[number, number], [number, number]];
	});

	// Route coordinates for polyline
	const routeCoordinates = $derived(points.map((p) => [p.lat, p.lon] as [number, number]));

	// Handle map instance when it's ready
	function handleMapReady(e: any) {
		// The map instance might be in e.detail or e.target
		mapInstance = e?.detail?.map || e?.detail || mapElement?.getMap?.();
		fitMapBounds();
	}

	// Fit bounds to show entire route
	function fitMapBounds() {
		if (!mapInstance || !bounds) return;

		try {
			// Try different ways to access the map and fitBounds
			if (typeof mapInstance.fitBounds === 'function') {
				mapInstance.fitBounds(bounds, { padding: [50, 50] });
			} else if (mapInstance._map && typeof mapInstance._map.fitBounds === 'function') {
				mapInstance._map.fitBounds(bounds, { padding: [50, 50] });
			}
		} catch (err) {
			console.warn('Error fitting bounds:', err);
		}
	}

	// Refit bounds when points change
	$effect(() => {
		if (bounds && mapInstance) {
			setTimeout(fitMapBounds, 100);
		}
	});

	function handleMapClick(e: CustomEvent) {
		if (!onPauseAdd || !interactive) return;

		try {
			// Handle different event structures
			const latlng = e.detail?.latlng || e.detail;
			if (!latlng) return;

			const { lat, lng } = latlng;

			// Find closest point on route
			let minDist = Infinity;
			let closestDistance = 0;
			let accumulated = 0;

			for (let i = 0; i < points.length; i++) {
				const dist = Math.sqrt(Math.pow(lat - points[i].lat, 2) + Math.pow(lng - points[i].lon, 2));

				if (dist < minDist) {
					minDist = dist;
					closestDistance = accumulated;
				}

				if (i > 0) {
					const dx = points[i].lat - points[i - 1].lat;
					const dy = points[i].lon - points[i - 1].lon;
					accumulated += Math.sqrt(dx * dx + dy * dy) * 111;
				}
			}

			onPauseAdd(lat, lng, closestDistance);
		} catch (err) {
			console.error('Error handling map click:', err);
		}
	}
</script>

{#if points && points.length > 0}
	<div class="h-full min-h-[400px] w-full overflow-hidden rounded-lg">
		<Map
			bind:this={mapElement}
			options={{
				center: mapCenter,
				zoom: 13
			}}
			onclick={handleMapClick}
			onLoad={handleMapReady}
		>
			<!-- Cycle map tile layer -->
			<TileLayer
				url={'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png'}
				options={{
					attribution:
						'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | <a href="https://www.cyclosm.org">CyclOSM</a>',
					subdomains: ['a', 'b', 'c'],
					maxZoom: 20
				}}
			/>

			<!-- Route polyline -->
			<Polyline
				latLngs={routeCoordinates}
				options={{
					color: '#3b82f6',
					weight: 4,
					opacity: 0.8
				}}
			/>

			<!-- Start marker -->
			<Marker latLng={[points[0].lat, points[0].lon]}>
				<div class="marker-simple marker-start">
					<div class="marker-dot"></div>
					<div class="marker-label">Start</div>
				</div>
			</Marker>

			<!-- End marker -->
			<Marker latLng={[points[points.length - 1].lat, points[points.length - 1].lon]}>
				<div class="marker-simple marker-end">
					<div class="marker-dot"></div>
					<div class="marker-label">Finish</div>
				</div>
			</Marker>

			<!-- Pause markers -->
			{#each pauses as pause, i (i)}
				<Marker latLng={[pause.point.lat, pause.point.lon]}>
					<div class="marker-simple marker-pause">
						<div class="marker-dot">{i + 1}</div>
						<div class="marker-label">Pause {i + 1}</div>
					</div>
				</Marker>
			{/each}
		</Map>
	</div>
{:else}
	<div class="bg-base-200 flex h-full min-h-[400px] items-center justify-center rounded-lg">
		<p class="text-sm opacity-50">No route data available</p>
	</div>
{/if}

<style>
	/* Simple marker styling */
	.marker-simple {
		position: relative;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		transition: transform 0.2s;
	}

	.marker-simple:hover {
		transform: scale(1.1);
	}

	.marker-dot {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		border: 3px solid white;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 12px;
		font-weight: bold;
		color: white;
	}

	.marker-label {
		font-size: 11px;
		font-weight: 600;
		background: white;
		padding: 2px 6px;
		border-radius: 4px;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
		white-space: nowrap;
		display: none;
	}

	.marker-simple:hover .marker-label {
		display: block;
	}

	.marker-start .marker-dot {
		background: #10b981;
	}

	.marker-end .marker-dot {
		background: #ef4444;
	}

	.marker-pause .marker-dot {
		background: #f59e0b;
		width: 22px;
		height: 22px;
		font-size: 11px;
	}
</style>
