// src/lib/utils/clothing.ts
import type { WeatherData, SunTimes } from './weather';

export interface ClothingRecommendation {
	category: string;
	items: string[];
	reason: string;
}

export function getClothingRecommendations(
	weather: WeatherData[],
	sunTimes: SunTimes,
	tripStart: Date,
	tripEnd: Date
): ClothingRecommendation[] {
	const avgTemp = weather.reduce((sum, w) => sum + w.temperature, 0) / weather.length;
	const minTemp = Math.min(...weather.map((w) => w.temperature));
	const maxWind = Math.max(...weather.map((w) => w.windSpeed));
	const totalPrecip = weather.reduce((sum, w) => sum + w.precipitation, 0);

	// Analyze weather conditions
	const hasRain = weather.some((w) => w.weatherCode >= 61 && w.weatherCode <= 65);
	const hasSnow = weather.some((w) => w.weatherCode >= 71 && w.weatherCode <= 77);
	const hasFog = weather.some((w) => w.weatherCode === 45 || w.weatherCode === 48);
	const hasFreezingRain = weather.some((w) => w.weatherCode >= 66 && w.weatherCode <= 67);
	const hasIce = minTemp <= 0 && totalPrecip > 0;
	const hasThunderstorm = weather.some((w) => w.weatherCode >= 95);
	const hasHeavyPrecip = totalPrecip > 10;

	// Check if riding during dark hours
	const startsBeforeSunrise = tripStart < sunTimes.sunrise;
	const endsAfterSunset = tripEnd > sunTimes.sunset;
	const isDark = startsBeforeSunrise || endsAfterSunset;

	const recommendations: ClothingRecommendation[] = [];
	const warnings: string[] = [];

	// Safety warnings
	if (hasIce || hasFreezingRain) {
		warnings.push(
			'⚠️ ICE WARNING: Freezing conditions with precipitation - roads may be icy and extremely dangerous'
		);
	}
	if (hasThunderstorm) {
		warnings.push('⚠️ THUNDERSTORM WARNING: Consider postponing your ride');
	}
	if (maxWind > 50) {
		warnings.push('⚠️ HIGH WIND WARNING: Winds over 50 km/h can be dangerous for cycling');
	}

	// Base layer
	if (avgTemp < 0) {
		recommendations.push({
			category: 'Base Layer',
			items: [
				'Heavy thermal long-sleeve base layer',
				'Thermal bib tights with fleece lining',
				'Merino wool socks'
			],
			reason: `Freezing temperature (${avgTemp.toFixed(1)}°C average)`
		});
	} else if (avgTemp < 5) {
		recommendations.push({
			category: 'Base Layer',
			items: [
				'Thermal long-sleeve base layer',
				'Thermal tights or leg warmers',
				'Winter cycling socks'
			],
			reason: `Cold temperature (${avgTemp.toFixed(1)}°C average)`
		});
	} else if (avgTemp < 15) {
		recommendations.push({
			category: 'Base Layer',
			items: ['Long-sleeve jersey', 'Knee warmers or 3/4 tights'],
			reason: `Cool temperature (${avgTemp.toFixed(1)}°C average)`
		});
	} else if (avgTemp < 25) {
		recommendations.push({
			category: 'Base Layer',
			items: ['Short-sleeve jersey', 'Bib shorts or cycling shorts'],
			reason: `Mild temperature (${avgTemp.toFixed(1)}°C average)`
		});
	} else {
		recommendations.push({
			category: 'Base Layer',
			items: ['Lightweight mesh jersey', 'Bib shorts', 'Arm coolers (optional)'],
			reason: `Warm temperature (${avgTemp.toFixed(1)}°C average)`
		});
	}

	// Outer layer for weather conditions
	const outerLayerItems: string[] = [];
	const outerLayerReasons: string[] = [];

	if (hasSnow) {
		outerLayerItems.push(
			'Insulated waterproof winter jacket',
			'Waterproof winter pants',
			'Neoprene overshoes',
			'Pogies (handlebar mittens)'
		);
		outerLayerReasons.push('snow expected');
	} else if (hasRain || hasHeavyPrecip) {
		outerLayerItems.push(
			'Waterproof breathable jacket',
			'Rain pants or leg covers',
			'Waterproof overshoes'
		);
		outerLayerReasons.push(`${totalPrecip.toFixed(1)}mm precipitation expected`);
	} else if (avgTemp < 10 || maxWind > 20) {
		outerLayerItems.push('Windproof vest or jacket', 'Arm warmers');
		if (avgTemp < 10) outerLayerReasons.push('cold conditions');
		if (maxWind > 20) outerLayerReasons.push(`wind up to ${maxWind.toFixed(0)} km/h`);
	}

	if (outerLayerItems.length > 0) {
		recommendations.push({
			category: 'Outer Layer',
			items: outerLayerItems,
			reason: outerLayerReasons.join(', ')
		});
	}

	// Visibility and safety
	const visibilityItems: string[] = [];
	const visibilityReasons: string[] = [];

	if (isDark) {
		visibilityItems.push(
			'Front white light (min 200 lumens)',
			'Rear red light (flashing mode)',
			'Reflective vest or bands',
			'Reflective ankle bands'
		);
		const darkPeriods = [];
		if (startsBeforeSunrise) darkPeriods.push('before sunrise');
		if (endsAfterSunset) darkPeriods.push('after sunset');
		visibilityReasons.push(`riding ${darkPeriods.join(' and ')}`);
	}

	if (hasFog) {
		if (!isDark) visibilityItems.push('Front and rear lights');
		visibilityItems.push('High-visibility clothing');
		visibilityReasons.push('fog reduces visibility');
	}

	if (visibilityItems.length > 0) {
		recommendations.push({
			category: 'Visibility & Safety',
			items: visibilityItems,
			reason: visibilityReasons.join(', ')
		});
	}

	// Accessories
	const accessories: string[] = [];
	const accessoryReasons: string[] = [];

	if (avgTemp < 0) {
		accessories.push(
			'Insulated winter gloves or pogies',
			'Balaclava or neck warmer',
			'Thermal cap under helmet'
		);
		accessoryReasons.push('freezing protection');
	} else if (avgTemp < 10) {
		accessories.push('Full-finger gloves', 'Ear warmer or cap under helmet', 'Neck warmer');
		accessoryReasons.push('cold protection');
	} else if (avgTemp < 18) {
		accessories.push('Light gloves');
	}

	if (avgTemp > 20 || weather.some((w) => w.weatherCode <= 2)) {
		accessories.push('Sunglasses (UV protection)', 'Sunscreen SPF 30+');
		accessoryReasons.push('sun protection');
	}

	if (hasRain || hasSnow) {
		accessories.push('Waterproof gloves', 'Helmet cover or cap with visor');
		accessoryReasons.push(hasSnow ? 'snow protection' : 'rain protection');
	}

	if (hasFog) {
		accessories.push('Clear or yellow-tinted glasses');
		accessoryReasons.push('fog visibility');
	}

	// Always include essentials
	accessories.push(
		'Cycling cap or buff',
		'Spare tube and tools',
		'Water bottles',
		'Pump or CO2 cartridges'
	);

	if (avgTemp < 5) {
		accessories.push('Insulated water bottles');
	}

	recommendations.push({
		category: 'Accessories',
		items: accessories,
		reason: accessoryReasons.length > 0 ? accessoryReasons.join(', ') : 'Essential cycling gear'
	});

	// Add tire and safety recommendations for harsh conditions
	if (hasSnow || hasIce || avgTemp < 0) {
		recommendations.push({
			category: 'Equipment & Safety',
			items: [
				'Winter tires or studded tires (for ice)',
				'Lower tire pressure for better traction',
				'Fenders (mudguards)',
				'Emergency blanket',
				'Fully charged phone',
				'Route planning with bail-out options'
			],
			reason: hasIce ? 'Icy conditions - extreme caution required' : 'Winter cycling safety'
		});
	} else if (hasRain || hasFog) {
		recommendations.push({
			category: 'Equipment & Safety',
			items: [
				'Fenders (mudguards)',
				'Increase following distance',
				'Test brakes before descent',
				'Waterproof phone case or bag'
			],
			reason: 'Wet weather safety'
		});
	}

	// Add warnings at the beginning if any exist
	if (warnings.length > 0) {
		recommendations.unshift({
			category: 'Safety Warnings',
			items: warnings,
			reason: 'Hazardous conditions detected'
		});
	}

	return recommendations;
}
