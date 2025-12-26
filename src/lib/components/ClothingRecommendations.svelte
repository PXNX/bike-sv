<!-- src/lib/components/ClothingRecommendations.svelte -->
<script lang="ts">
	import FluentEmojiTShirt from '~icons/fluent-emoji/t-shirt';
	import FluentEmojiCoat from '~icons/fluent-emoji/coat';
	import FluentEmojiGloves from '~icons/fluent-emoji/gloves';
	import FluentEmojiSunglasses from '~icons/fluent-emoji/sunglasses';
	import FluentEmojiWarning from '~icons/fluent-emoji/warning';
	import FluentEmojiJeans from '~icons/fluent-emoji/jeans';
	import FluentEmojiRunningShoe from '~icons/fluent-emoji/running-shoe';
	import IconChevronDown from '~icons/fluent/chevron-down-20-regular';
	import IconChevronUp from '~icons/fluent/chevron-up-20-regular';
	import type { ClothingRecommendation } from '$lib/utils/clothing';

	interface Props {
		recommendations: ClothingRecommendation[];
		expanded?: boolean;
		onToggle?: () => void;
	}

	let { recommendations, expanded = true, onToggle }: Props = $props();

	function getCategoryIcon(category: string) {
		if (category.includes('Base')) return FluentEmojiTShirt;
		if (category.includes('Outer')) return FluentEmojiCoat;
		if (category.includes('Accessories')) return FluentEmojiGloves;
		if (category.includes('Sun')) return FluentEmojiSunglasses;
		if (category.includes('Safety') || category.includes('Warning')) return FluentEmojiWarning;
		if (category.includes('Leg')) return FluentEmojiJeans;
		if (category.includes('Foot')) return FluentEmojiRunningShoe;
		return FluentEmojiTShirt;
	}

	function getCategoryColor(category: string): string {
		if (category.includes('Safety') || category.includes('Warning'))
			return 'bg-error/10 border-error/30';
		if (category.includes('Base')) return 'bg-blue-500/10 border-blue-500/30';
		if (category.includes('Outer')) return 'bg-orange-500/10 border-orange-500/30';
		if (category.includes('Accessories')) return 'bg-purple-500/10 border-purple-500/30';
		if (category.includes('Sun')) return 'bg-yellow-500/10 border-yellow-500/30';
		return 'bg-base-200 border-base-300';
	}
</script>

<div class="card bg-base-100 border-base-300 border">
	<div class="card-body p-4">
		{#if onToggle}
			<button onclick={onToggle} class="flex w-full items-center justify-between text-left">
				<h2 class="card-title flex items-center gap-2 text-base md:text-lg">
					<FluentEmojiTShirt class="text-xl" />
					Clothing
				</h2>
				{#if expanded}
					<IconChevronUp class="text-xl" />
				{:else}
					<IconChevronDown class="text-xl" />
				{/if}
			</button>
		{:else}
			<h2 class="card-title flex items-center gap-2 text-base md:text-lg">
				<FluentEmojiTShirt class="text-xl" />
				Clothing Recommendations
			</h2>
		{/if}

		{#if expanded}
			<div class="mt-3 space-y-3">
				{#each recommendations as rec, i (i)}
					{@const CategoryIcon = getCategoryIcon(rec.category)}
					<div
						class="rounded-lg border p-4 transition-shadow hover:shadow-md {getCategoryColor(
							rec.category
						)}"
					>
						<div class="mb-2 flex items-center gap-2">
							<CategoryIcon class="text-2xl" />
							<h3 class="font-semibold">{rec.category}</h3>
						</div>

						<p class="mb-3 text-sm opacity-70">{rec.reason}</p>

						<div class="flex flex-wrap gap-2">
							{#each rec.items as item, j (j)}
								<span class="badge badge-lg gap-1 font-normal">
									{item}
								</span>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
