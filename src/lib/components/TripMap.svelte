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
	let maplibregl: any;
	let startMarker: any;
	let endMarker: any;
	let pauseMarkers: any[] = [];

	onMount(async () => {
		maplibregl = await import('maplibre-gl');
		await import('maplibre-gl/dist/maplibre-gl.css');

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

			// Add start marker (green)
			const startEl = document.createElement('div');
			startEl.className = 'marker-start';
			startEl.innerHTML = `
				<div style="
					width: 28px;
					height: 28px;
					background: #10b981;
					border-radius: 50%;
					border: 3px solid white;
					box-shadow: 0 2px 8px rgba(0,0,0,0.3);
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 16px;
				">🚴</div>
			`;

			startMarker = new maplibregl.Marker({ element: startEl, anchor: 'center' })
				.setLngLat([points[0].lon, points[0].lat])
				.setPopup(new maplibregl.Popup({ offset: 25 }).setText('Start'))
				.addTo(map);

			// Add end marker (red)
			const endEl = document.createElement('div');
			endEl.className = 'marker-end';
			endEl.innerHTML = `
				<div style="
					width: 28px;
					height: 28px;
					background: #ef4444;
					border-radius: 50%;
					border: 3px solid white;
					box-shadow: 0 2px 8px rgba(0,0,0,0.3);
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 16px;
				">🏁</div>
			`;

			endMarker = new maplibregl.Marker({ element: endEl, anchor: 'center' })
				.setLngLat([points[points.length - 1].lon, points[points.length - 1].lat])
				.setPopup(new maplibregl.Popup({ offset: 25 }).setText('Finish'))
				.addTo(map);

			// Initial pause markers
			updatePauseMarkers();
		});

		// Handle map clicks for adding pauses
		if (onPauseAdd && interactive) {
			map.on('click', (e: any) => {
				const { lng, lat } = e.lngLat;

				// Find closest point on route
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
						accumulated += Math.sqrt(dx * dx + dy * dy) * 111;
					}
				}

				onPauseAdd(lat, lng, closestDistance);
			});
		}

		return () => {
			if (map) {
				map.remove();
			}
		};
	});

	function updatePauseMarkers() {
		if (!map || !maplibregl) return;

		// Remove old pause markers
		pauseMarkers.forEach((marker) => marker.remove());
		pauseMarkers = [];

		// Add pause markers (amber/orange)
		pauses.forEach((pause, index) => {
			const el = document.createElement('div');
			el.className = 'marker-pause';
			el.innerHTML = `
				<div style="
					width: 24px;
					height: 24px;
					background: #f59e0b;
					border-radius: 50%;
					border: 3px solid white;
					box-shadow: 0 2px 8px rgba(0,0,0,0.3);
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 12px;
					font-weight: bold;
					color: white;
				">${index + 1}</div>
			`;

			const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
				.setLngLat([pause.point.lon, pause.point.lat])
				.setPopup(
					new maplibregl.Popup({ offset: 25 }).setHTML(
						`<div style="font-size: 12px;">
							<strong>Pause ${index + 1}</strong><br/>
							${pause.distanceKm.toFixed(1)} km<br/>
							${pause.durationMinutes} min
						</div>`
					)
				)
				.addTo(map);

			pauseMarkers.push(marker);
		});
	}

	// Update pause markers when pauses change
	$effect(() => {
		if (pauses && map && maplibregl) {
			updatePauseMarkers();
		}
	});
</script>

<div bind:this={mapContainer} class="h-full min-h-[400px] w-full rounded-lg"></div>

<style>
	:global(.maplibregl-map) {
		font-family: inherit;
	}

	:global(.marker-start),
	:global(.marker-end),
	:global(.marker-pause) {
		cursor: pointer;
		transition: transform 0.2s;
	}

	:global(.marker-start:hover),
	:global(.marker-end:hover),
	:global(.marker-pause:hover) {
		transform: scale(1.15);
	}
</style>
