// src/routes/trips/[id]/+page.server.ts
import { db } from '$lib/server/db';
import { trips, pauses } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const trip = await db.query.trips.findFirst({
		where: eq(trips.id, params.id)
	});

	if (!trip) {
		throw error(404, 'Trip not found');
	}

	// Check access: owner or public trip
	const user = locals.user!;
	const canView = trip.isPublic === 1 || (user && trip.userId === user.id);

	if (!canView) {
		throw error(403, 'This trip is private');
	}

	const tripPauses = await db.select().from(pauses).where(eq(pauses.tripId, params.id));

	return {
		trip,
		pauses: tripPauses,
		isOwner: user ? trip.userId === user.id : false
	};
};
