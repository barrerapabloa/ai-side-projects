import { z } from "zod";

export type GeoPoint = {
  name: string;
  country?: string;
  latitude: number;
  longitude: number;
};

export type WeatherSnapshot = {
  temperatureC?: number;
  windKph?: number;
  highC?: number;
  lowC?: number;
};

export async function geocodeCity(
  name: string,
  country?: string,
): Promise<GeoPoint | null> {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", name);
  url.searchParams.set("count", "5");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString());
  if (!res.ok) return null;
  const json = (await res.json()) as unknown;
  const parsed = z
    .object({
      results: z
        .array(
          z.object({
            name: z.string(),
            country: z.string().optional(),
            latitude: z.number(),
            longitude: z.number(),
          }),
        )
        .optional(),
    })
    .safeParse(json);
  if (!parsed.success || !parsed.data.results?.length) return null;

  const results = parsed.data.results;
  const best =
    country
      ? results.find((r) => (r.country ?? "").toLowerCase() === country.toLowerCase()) ??
        results[0]
      : results[0];

  return {
    name: best.name,
    country: best.country,
    latitude: best.latitude,
    longitude: best.longitude,
  };
}

export async function weatherSnapshot(
  point: GeoPoint,
): Promise<WeatherSnapshot | null> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(point.latitude));
  url.searchParams.set("longitude", String(point.longitude));
  url.searchParams.set("current_weather", "true");
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min");
  url.searchParams.set("forecast_days", "1");
  url.searchParams.set("timezone", "auto");

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return null;
  const json = (await res.json()) as unknown;
  const parsed = z
    .object({
      current_weather: z
        .object({
          temperature: z.number().optional(),
          windspeed: z.number().optional(),
        })
        .optional(),
      daily: z
        .object({
          temperature_2m_max: z.array(z.number()).optional(),
          temperature_2m_min: z.array(z.number()).optional(),
        })
        .optional(),
    })
    .safeParse(json);
  if (!parsed.success) return null;

  const high = parsed.data.daily?.temperature_2m_max?.[0];
  const low = parsed.data.daily?.temperature_2m_min?.[0];

  return {
    temperatureC: parsed.data.current_weather?.temperature,
    windKph: parsed.data.current_weather?.windspeed,
    highC: high,
    lowC: low,
  };
}

