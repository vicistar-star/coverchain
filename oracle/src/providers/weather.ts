export interface WeatherData {
  location: string;
  lat: number;
  lng: number;
  rainfallMm: number;
  timestamp: number;
  humidity: number;
  windSpeed: number;
  description: string;
  source: string;
}

export interface WeatherConfig {
  apiKey?: string;
  baseUrl: string;
  mockMode: boolean;
  mockRainfallMm?: number;
}

const DEFAULT_CONFIG: WeatherConfig = {
  apiKey: process.env.OPENWEATHER_API_KEY,
  baseUrl: "https://api.openweathermap.org/data/2.5",
  mockMode: !process.env.OPENWEATHER_API_KEY,
};

const LAGOS = { lat: 6.5244, lng: 3.3792 };
const PORT_HARCOURT = { lat: 4.8156, lng: 7.0498 };
const KANO = { lat: 12.0, lng: 8.5167 };
const IBADAN = { lat: 7.3775, lng: 3.9470 };
const ABUJA = { lat: 9.0765, lng: 7.3986 };

const MOCK_LOCATIONS: Record<string, { lat: number; lng: number }> = {
  LAGOS,
  "PORT HARCOURT": PORT_HARCOURT,
  KANO,
  IBADAN,
  ABUJA,
};

function getMockRainfall(location: string): number {
  const baseByCity: Record<string, number> = {
    LAGOS: 180,
    "PORT HARCOURT": 240,
    KANO: 60,
    IBADAN: 140,
    ABUJA: 110,
  };
  const base = baseByCity[location.toUpperCase()] || 100;
  const variance = (Math.random() - 0.5) * 80;
  return Math.max(0, Math.round((base + variance) * 10) / 10);
}

function getMockHumidity(location: string): number {
  const baseByCity: Record<string, number> = {
    LAGOS: 85,
    "PORT HARCOURT": 90,
    KANO: 40,
    IBADAN: 75,
    ABUJA: 65,
  };
  const base = baseByCity[location.toUpperCase()] || 70;
  const variance = (Math.random() - 0.5) * 20;
  return Math.max(0, Math.min(100, Math.round(base + variance)));
}

function getMockWindSpeed(): number {
  return Math.round((Math.random() * 30 + 5) * 10) / 10;
}

function getMockDescription(rainfallMm: number): string {
  if (rainfallMm > 150) return "heavy intensity rain";
  if (rainfallMm > 80) return "moderate rain";
  if (rainfallMm > 20) return "light rain";
  if (rainfallMm > 0) return "overcast clouds";
  return "clear sky";
}

function generateMockData(location: string): WeatherData {
  const coords = MOCK_LOCATIONS[location.toUpperCase()] || { lat: 6.5, lng: 3.4 };
  const rainfallMm = getMockRainfall(location);

  return {
    location: location.toUpperCase(),
    lat: coords.lat,
    lng: coords.lng,
    rainfallMm,
    timestamp: Math.floor(Date.now() / 1000),
    humidity: getMockHumidity(location),
    windSpeed: getMockWindSpeed(),
    description: getMockDescription(rainfallMm),
    source: "mock",
  };
}

async function fetchFromOpenWeatherMap(location: string, config: WeatherConfig): Promise<WeatherData> {
  const coords = MOCK_LOCATIONS[location.toUpperCase()];
  if (!coords) {
    throw new Error(`Unknown location: ${location}`);
  }

  const url = `${config.baseUrl}/weather?lat=${coords.lat}&lon=${coords.lng}&appid=${config.apiKey}&units=metric`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`OpenWeatherMap API error: ${response.statusText}`);
  }

  const data: any = await response.json();

  return {
    location: location.toUpperCase(),
    lat: coords.lat,
    lng: coords.lng,
    rainfallMm: (data.rain?.["1h"] || data.rain?.["3h"] || 0),
    timestamp: data.dt,
    humidity: data.main?.humidity || 0,
    windSpeed: data.wind?.speed || 0,
    description: data.weather?.[0]?.description || "unknown",
    source: "openweathermap",
  };
}

export async function getWeatherData(
  location: string,
  configOverride?: Partial<WeatherConfig>
): Promise<WeatherData> {
  const config: WeatherConfig = { ...DEFAULT_CONFIG, ...configOverride };

  if (config.mockMode) {
    if (config.mockRainfallMm !== undefined) {
      const coords = MOCK_LOCATIONS[location.toUpperCase()] || { lat: 6.5, lng: 3.4 };
      return {
        location: location.toUpperCase(),
        lat: coords.lat,
        lng: coords.lng,
        rainfallMm: config.mockRainfallMm,
        timestamp: Math.floor(Date.now() / 1000),
        humidity: 75,
        windSpeed: 15,
        description: getMockDescription(config.mockRainfallMm),
        source: "mock",
      };
    }
    return generateMockData(location);
  }

  if (!config.apiKey) {
    throw new Error("OPENWEATHER_API_KEY not configured and mockMode is disabled");
  }

  return fetchFromOpenWeatherMap(location, config);
}

export function getKnownLocations(): string[] {
  return Object.keys(MOCK_LOCATIONS);
}
