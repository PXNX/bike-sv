// src/lib/utils/calculator.ts
import type { TrackPoint } from './gpx';

export interface TripSegment {
	distanceKm: number;
	startTime: Date;
	endTime: Date;
	point: TrackPoint;
}

export interface Pause {
	distanceKm: number;
	durationMinutes: number;
	point: TrackPoint;
}

const AVG_SPEED_KMH = 20; // Average cycling speed

export function calculateTripSegments(
	points: TrackPoint[],
	totalDistanceKm: number,
	startTime: Date,
	pauses: Pause[]
): TripSegment[] {
	const segments: TripSegment[] = [];
	const sortedPauses = [...pauses].sort((a, b) => a.distanceKm - b.distanceKm);

	let currentTime = new Date(startTime);
	let lastDistance = 0;

	// Create segments between pauses
	for (const pause of sortedPauses) {
		const distanceToTravel = pause.distanceKm - lastDistance;
		const travelTimeHours = distanceToTravel / AVG_SPEED_KMH;
		const endTime = new Date(currentTime.getTime() + travelTimeHours * 60 * 60 * 1000);

		segments.push({
			distanceKm: pause.distanceKm,
			startTime: new Date(currentTime),
			endTime,
			point: pause.point
		});

		// Add pause time
		currentTime = new Date(endTime.getTime() + pause.durationMinutes * 60 * 1000);
		lastDistance = pause.distanceKm;
	}

	// Final segment to end
	const remainingDistance = totalDistanceKm - lastDistance;
	const travelTimeHours = remainingDistance / AVG_SPEED_KMH;
	const endTime = new Date(currentTime.getTime() + travelTimeHours * 60 * 60 * 1000);

	segments.push({
		distanceKm: totalDistanceKm,
		startTime: new Date(currentTime),
		endTime,
		point: points[points.length - 1]
	});

	return segments;
}

export function formatTime(date: Date): string {
	return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

export function formatDuration(minutes: number): string {
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;
	return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}
