<!-- src/lib/components/TripMap.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { TrackPoint } from '$lib/utils/gpx';
	import type { Pause } from '$lib/utils/calculator';

	interface Props {
		points: TrackPoint[];
		pauses: Pause[];
		onPauseAdd?: (lat: number, lon: number, distanceKm: number) => void;
		interactive?: boolean;
	}

	let { points, pauses, onPauseAdd, interactive = true }: Props = $props();

	let mapContainer: HTMLDivElement;
	let map: any;

	onMount(async () => {
		const maplibregl = await import('maplibre-gl');

		// Calculate bounds
		const lats = points.map((p) => p.lat);
		const lons = points.map((p) => p.lon);
		const bounds = [
			[Math.min(...lons), Math.min(...lats)],
			[Math.max(...lons), Math.max(...lats)]
		];

		map = new maplibregl.Map({
			container: mapContainer,
			style: 'https://tiles.openfreemap.org/styles/liberty',
			bounds: bounds as any,
			fitBoundsOptions: { padding: 50 }
		});

		map.on('load', () => {
			// Add route line
			map.addSource('route', {
				type: 'geojson',
				data: {
					type: 'Feature',
					properties: {},
					geometry: {
						type: 'LineString',
						coordinates: points.map((p) => [p.lon, p.lat])
					}
				}
			});

			map.addLayer({
				id: 'route',
				type: 'line',
				source: 'route',
				layout: {
					'line-join': 'round',
					'line-cap': 'round'
				},
				paint: {
					'line-color': '#3b82f6',
					'line-width': 4,
					'line-opacity': 0.8
				}
			});

			// Add start marker
			const startEl = document.createElement('div');
			startEl.className = 'marker';
			startEl.style.cssText =
				'width: 12px; height: 12px; background: #10b981; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);';

			new maplibregl.Marker({ element: startEl })
				.setLngLat([points[0].lon, points[0].lat])
				.addTo(map);

			// Add end marker
			const endEl = document.createElement('div');
			endEl.className = 'marker';
			endEl.style.cssText =
				'width: 12px; height: 12px; background: #ef4444; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);';

			new maplibregl.Marker({ element: endEl })
				.setLngLat([points[points.length - 1].lon, points[points.length - 1].lat])
				.addTo(map);

			updatePauseMarkers();
		});

		// Handle map clicks
		if (onPauseAdd && interactive) {
			map.on('click', (e: any) => {
				const { lng, lat } = e.lngLat;

				// Calculate distance along route to clicked point
				let minDist = Infinity;
				let closestDistance = 0;
				let accumulated = 0;

				for (let i = 0; i < points.length; i++) {
					const dist = Math.sqrt(
						Math.pow(lat - points[i].lat, 2) + Math.pow(lng - points[i].lon, 2)
					);

					if (dist < minDist) {
						minDist = dist;
						closestDistance = accumulated;
					}

					if (i > 0) {
						const dx = points[i].lat - points[i - 1].lat;
						const dy = points[i].lon - points[i - 1].lon;
						accumulated += Math.sqrt(dx * dx + dy * dy) * 111; // Rough km conversion
					}
				}

				onPauseAdd(lat, lng, closestDistance);
			});
		}
	});

	let pauseMarkers: any[] = [];

	async function updatePauseMarkers() {
		if (!map) return;

		const maplibregl = await import('maplibre-gl');

		// Remove old pause markers
		pauseMarkers.forEach((marker) => marker.remove());
		pauseMarkers = [];

		// Add pause markers
		pauses.forEach((pause) => {
			const el = document.createElement('div');
			el.className = 'marker';
			el.style.cssText =
				'width: 12px; height: 12px; background: #f59e0b; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);';

			const marker = new maplibregl.Marker({ element: el })
				.setLngLat([pause.point.lon, pause.point.lat])
				.setPopup(new maplibregl.Popup().setText(`Pause: ${pause.durationMinutes} min`))
				.addTo(map);

			pauseMarkers.push(marker);
		});
	}

	// Update pause markers when pauses change
	$effect(() => {
		if (pauses && map) {
			updatePauseMarkers();
		}
	});
</script>

<div bind:this={mapContainer} class="h-full min-h-[400px] w-full rounded-lg"></div>

<style>
	:global(.maplibregl-map) {
		font-family: inherit;
	}
</style>
