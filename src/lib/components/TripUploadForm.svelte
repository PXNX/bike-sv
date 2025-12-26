<!-- src/lib/components/TripUploadForm.svelte -->
<script lang="ts">
	import IconSave from '~icons/fluent/save-20-regular';
	import type { TrackPoint } from '$lib/utils/gpx';

	interface Props {
		gpxData: { points: TrackPoint[]; totalDistanceKm: number } | null;
		tripName: string;
		startDate: string;
		startTime: string;
		isPublic: boolean;
		saving: boolean;
		onNameChange: (name: string) => void;
		onDateChange: (date: string) => void;
		onTimeChange: (time: string) => void;
		onPublicChange: (isPublic: boolean) => void;
		onSave: () => void;
		onFileUpload: (e: Event) => void;
	}

	let {
		gpxData,
		tripName,
		startDate,
		startTime,
		isPublic,
		saving,
		onNameChange,
		onDateChange,
		onTimeChange,
		onPublicChange,
		onSave,
		onFileUpload
	}: Props = $props();
</script>

<div class="card bg-base-100 border-base-300 border">
	<div class="card-body p-4">
		<h2 class="card-title mb-2 text-base md:text-lg">Trip Settings</h2>

		<div class="grid grid-cols-1 gap-3">
			<div class="form-control">
				<label class="label py-1">
					<span class="label-text text-sm">GPX File</span>
				</label>
				<input
					type="file"
					accept=".gpx"
					onchange={onFileUpload}
					class="file-input file-input-bordered file-input-sm w-full"
				/>
			</div>

			{#if gpxData}
				<div class="form-control">
					<label class="label py-1">
						<span class="label-text text-sm">Trip Name</span>
					</label>
					<input
						type="text"
						value={tripName}
						oninput={(e) => onNameChange((e.target as HTMLInputElement).value)}
						class="input input-bordered input-sm"
						placeholder="My bike trip"
					/>
				</div>

				<div class="grid grid-cols-2 gap-2">
					<div class="form-control">
						<label class="label py-1">
							<span class="label-text text-sm">Start Date</span>
						</label>
						<input
							type="date"
							value={startDate}
							oninput={(e) => onDateChange((e.target as HTMLInputElement).value)}
							class="input input-bordered input-sm"
						/>
					</div>

					<div class="form-control">
						<label class="label py-1">
							<span class="label-text text-sm">Start Time</span>
						</label>
						<input
							type="time"
							value={startTime}
							oninput={(e) => onTimeChange((e.target as HTMLInputElement).value)}
							class="input input-bordered input-sm"
						/>
					</div>
				</div>

				<div class="form-control">
					<label class="label cursor-pointer py-2">
						<span class="label-text text-sm">Make trip public (shareable link)</span>
						<input
							type="checkbox"
							checked={isPublic}
							onchange={(e) => onPublicChange((e.target as HTMLInputElement).checked)}
							class="checkbox checkbox-sm"
						/>
					</label>
				</div>

				<button
					onclick={onSave}
					disabled={saving || !tripName}
					class="btn btn-primary btn-sm w-full"
				>
					<IconSave />
					{saving ? 'Saving...' : 'Save Trip'}
				</button>

				<div class="stats stats-vertical md:stats-horizontal text-sm shadow-sm">
					<div class="stat p-3">
						<div class="stat-title text-xs">Distance</div>
						<div class="stat-value text-lg">{gpxData.totalDistanceKm.toFixed(1)} km</div>
					</div>
					<div class="stat p-3">
						<div class="stat-title text-xs">Points</div>
						<div class="stat-value text-lg">{gpxData.points.length}</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
