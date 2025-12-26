<!-- src/lib/components/SavedTripsList.svelte -->
<script lang="ts">
	import IconChevronDown from '~icons/fluent/chevron-down-20-regular';
	import IconChevronUp from '~icons/fluent/chevron-up-20-regular';

	interface Trip {
		id: string;
		name: string;
		startTime: Date;
	}

	interface Props {
		trips: Trip[];
		expanded?: boolean;
		onToggle?: () => void;
		onTripClick: (tripId: string) => void;
	}

	let { trips, expanded = false, onToggle, onTripClick }: Props = $props();
</script>

{#if trips.length > 0}
	<div class="card bg-base-100 border-base-300 border">
		<div class="card-body p-4">
			{#if onToggle}
				<button onclick={onToggle} class="flex w-full items-center justify-between text-left">
					<h2 class="card-title text-base md:text-lg">Your Trips ({trips.length})</h2>
					{#if expanded}
						<IconChevronUp class="text-xl" />
					{:else}
						<IconChevronDown class="text-xl" />
					{/if}
				</button>
			{:else}
				<h2 class="card-title text-base md:text-lg">Your Trips ({trips.length})</h2>
			{/if}

			{#if expanded}
				<div class="mt-2 space-y-2">
					{#each trips as trip}
						<button
							onclick={() => onTripClick(trip.id)}
							class="btn btn-sm btn-ghost w-full justify-start text-left"
						>
							<span class="truncate">{trip.name}</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}
