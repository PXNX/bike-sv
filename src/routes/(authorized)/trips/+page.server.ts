// src/routes/trips/+page.server.ts
import { db } from '$lib/server/db';
import { trips, pauses } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user!;

	const userTrips = await db
		.select()
		.from(trips)
		.where(eq(trips.userId, user.id))
		.orderBy(trips.createdAt);

	return {
		trips: userTrips
	};
};

export const actions = {
	saveTrip: async ({ request, locals }) => {
		const user = locals.user!;
		const formData = await request.formData();

		const name = formData.get('name') as string;
		const gpxData = formData.get('gpxData') as string;
		const startTime = formData.get('startTime') as string;
		const pausesData = formData.get('pauses') as string;
		const isPublic = formData.get('isPublic') === 'true';

		const tripId = nanoid();

		await db.insert(trips).values({
			id: tripId,
			userId: user.id,
			name,
			gpxData,
			startTime: new Date(startTime),
			isPublic: isPublic ? 1 : 0
		});

		const pausesList = JSON.parse(pausesData || '[]');
		if (pausesList.length > 0) {
			await db.insert(pauses).values(
				pausesList.map((p: any) => ({
					id: nanoid(),
					tripId,
					lat: p.lat,
					lon: p.lon,
					durationMinutes: p.durationMinutes,
					distanceKm: p.distanceKm
				}))
			);
		}

		throw redirect(303, `/trips/${tripId}`);
	},

	updateTrip: async ({ request, locals }) => {
		const user = locals.user!;
		const formData = await request.formData();

		const tripId = formData.get('tripId') as string;
		const name = formData.get('name') as string;
		const startTime = formData.get('startTime') as string;
		const pausesData = formData.get('pauses') as string;
		const isPublic = formData.get('isPublic') === 'true';

		// Verify ownership
		const trip = await db.query.trips.findFirst({
			where: eq(trips.id, tripId)
		});

		if (!trip || trip.userId !== user.id) {
			return { error: 'Unauthorized' };
		}

		await db
			.update(trips)
			.set({
				name,
				startTime: new Date(startTime),
				isPublic: isPublic ? 1 : 0,
				updatedAt: new Date()
			})
			.where(eq(trips.id, tripId));

		// Delete old pauses
		await db.delete(pauses).where(eq(pauses.tripId, tripId));

		// Insert new pauses
		const pausesList = JSON.parse(pausesData || '[]');
		if (pausesList.length > 0) {
			await db.insert(pauses).values(
				pausesList.map((p: any) => ({
					id: nanoid(),
					tripId,
					lat: p.lat,
					lon: p.lon,
					durationMinutes: p.durationMinutes,
					distanceKm: p.distanceKm
				}))
			);
		}

		return { success: true };
	},

	deleteTrip: async ({ request, locals }) => {
		const user = locals.user!;
		const formData = await request.formData();
		const tripId = formData.get('tripId') as string;

		const trip = await db.query.trips.findFirst({
			where: eq(trips.id, tripId)
		});

		if (!trip || trip.userId !== user.id) {
			return { error: 'Unauthorized' };
		}

		await db.delete(trips).where(eq(trips.id, tripId));

		return { success: true };
	}
} satisfies Actions;
