<!-- src/lib/components/ClothingRecommendations.svelte -->
<script lang="ts">
	import FluentEmojiTShirt from '~icons/fluent-emoji/t-shirt';
	import IconChevronDown from '~icons/fluent/chevron-down-20-regular';
	import IconChevronUp from '~icons/fluent/chevron-up-20-regular';
	import type { ClothingRecommendation } from '$lib/utils/clothing';

	interface Props {
		recommendations: ClothingRecommendation[];
		expanded?: boolean;
		onToggle?: () => void;
	}

	let { recommendations, expanded = true, onToggle }: Props = $props();
</script>

<div class="card bg-base-100 border-base-300 border">
	<div class="card-body p-4">
		{#if onToggle}
			<button onclick={onToggle} class="flex w-full items-center justify-between text-left">
				<h2 class="card-title text-base md:text-lg">
					<FluentEmojiTShirt />
					Clothing
				</h2>
				{#if expanded}
					<IconChevronUp class="text-xl" />
				{:else}
					<IconChevronDown class="text-xl" />
				{/if}
			</button>
		{:else}
			<h2 class="card-title text-base md:text-lg">
				<FluentEmojiTShirt />
				Clothing Recommendations
			</h2>
		{/if}

		{#if expanded}
			<div class="mt-2 space-y-3">
				{#each recommendations as rec}
					<div
						class:alert={rec.category === 'Safety Warnings'}
						class:alert-warning={rec.category === 'Safety Warnings'}
						class:p-3={rec.category === 'Safety Warnings'}
					>
						<h3 class="mb-1 text-sm font-semibold">{rec.category}</h3>
						<p class="mb-2 text-xs opacity-70">{rec.reason}</p>
						<ul class="list-inside list-disc space-y-1">
							{#each rec.items as item}
								<li class="text-xs">{item}</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
