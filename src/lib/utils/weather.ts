// src/lib/utils/weather.ts
export interface WeatherData {
	time: Date;
	temperature: number;
	windSpeed: number;
	precipitation: number;
	weatherCode: number;
}

export interface SunTimes {
	sunrise: Date;
	sunset: Date;
}

export async function fetchWeatherForPoint(
	lat: number,
	lon: number,
	startTime: Date,
	endTime: Date
): Promise<WeatherData[]> {
	const start = startTime.toISOString().split('T')[0];
	const end = endTime.toISOString().split('T')[0];

	const url =
		`https://api.open-meteo.com/v1/forecast?` +
		`latitude=${lat}&longitude=${lon}&` +
		`hourly=temperature_2m,wind_speed_10m,precipitation,weather_code&` +
		`start_date=${start}&end_date=${end}&timezone=auto`;

	const res = await fetch(url);
	const data = await res.json();

	const weatherData: WeatherData[] = [];
	for (let i = 0; i < data.hourly.time.length; i++) {
		const time = new Date(data.hourly.time[i]);
		if (time >= startTime && time <= endTime) {
			weatherData.push({
				time,
				temperature: data.hourly.temperature_2m[i],
				windSpeed: data.hourly.wind_speed_10m[i],
				precipitation: data.hourly.precipitation[i],
				weatherCode: data.hourly.weather_code[i]
			});
		}
	}

	return weatherData;
}

export async function fetchSunTimes(lat: number, lon: number, date: Date): Promise<SunTimes> {
	const dateStr = date.toISOString().split('T')[0];

	const url =
		`https://api.open-meteo.com/v1/forecast?` +
		`latitude=${lat}&longitude=${lon}&` +
		`daily=sunrise,sunset&` +
		`start_date=${dateStr}&end_date=${dateStr}&timezone=auto`;

	const res = await fetch(url);
	const data = await res.json();

	return {
		sunrise: new Date(data.daily.sunrise[0]),
		sunset: new Date(data.daily.sunset[0])
	};
}

export function getWeatherDescription(code: number): string {
	const descriptions: Record<number, string> = {
		0: 'Clear sky',
		1: 'Mainly clear',
		2: 'Partly cloudy',
		3: 'Overcast',
		45: 'Foggy',
		48: 'Foggy',
		51: 'Light drizzle',
		53: 'Drizzle',
		55: 'Heavy drizzle',
		61: 'Light rain',
		63: 'Rain',
		65: 'Heavy rain',
		71: 'Light snow',
		73: 'Snow',
		75: 'Heavy snow',
		95: 'Thunderstorm'
	};

	return descriptions[code] || 'Unknown';
}
