// src/lib/utils/gpx.ts
export interface TrackPoint {
	lat: number;
	lon: number;
	ele?: number;
	time?: Date;
}

export interface ParsedGPX {
	points: TrackPoint[];
	totalDistanceKm: number;
	bounds: {
		minLat: number;
		maxLat: number;
		minLon: number;
		maxLon: number;
	};
}

export function parseGPX(gpxString: string): ParsedGPX {
	const parser = new DOMParser();
	const doc = parser.parseFromString(gpxString, 'text/xml');

	const trkpts = doc.querySelectorAll('trkpt');
	const points: TrackPoint[] = [];

	trkpts.forEach((pt) => {
		const lat = parseFloat(pt.getAttribute('lat') || '0');
		const lon = parseFloat(pt.getAttribute('lon') || '0');
		const eleEl = pt.querySelector('ele');
		const timeEl = pt.querySelector('time');

		points.push({
			lat,
			lon,
			ele: eleEl ? parseFloat(eleEl.textContent || '0') : undefined,
			time: timeEl ? new Date(timeEl.textContent || '') : undefined
		});
	});

	const totalDistanceKm = calculateTotalDistance(points);
	const bounds = calculateBounds(points);

	return { points, totalDistanceKm, bounds };
}

function calculateTotalDistance(points: TrackPoint[]): number {
	let total = 0;
	for (let i = 1; i < points.length; i++) {
		total += haversineDistance(points[i - 1], points[i]);
	}
	return total;
}

export function haversineDistance(p1: TrackPoint, p2: TrackPoint): number {
	const R = 6371; // Earth radius in km
	const dLat = toRad(p2.lat - p1.lat);
	const dLon = toRad(p2.lon - p1.lon);

	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(toRad(p1.lat)) * Math.cos(toRad(p2.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

function toRad(deg: number): number {
	return deg * (Math.PI / 180);
}

function calculateBounds(points: TrackPoint[]) {
	return {
		minLat: Math.min(...points.map((p) => p.lat)),
		maxLat: Math.max(...points.map((p) => p.lat)),
		minLon: Math.min(...points.map((p) => p.lon)),
		maxLon: Math.max(...points.map((p) => p.lon))
	};
}

export function interpolatePointAtDistance(
	points: TrackPoint[],
	targetDistanceKm: number
): TrackPoint | null {
	let accumulated = 0;

	for (let i = 1; i < points.length; i++) {
		const segmentDist = haversineDistance(points[i - 1], points[i]);

		if (accumulated + segmentDist >= targetDistanceKm) {
			const remaining = targetDistanceKm - accumulated;
			const ratio = remaining / segmentDist;

			return {
				lat: points[i - 1].lat + (points[i].lat - points[i - 1].lat) * ratio,
				lon: points[i - 1].lon + (points[i].lon - points[i - 1].lon) * ratio
			};
		}

		accumulated += segmentDist;
	}

	return points[points.length - 1];
}
