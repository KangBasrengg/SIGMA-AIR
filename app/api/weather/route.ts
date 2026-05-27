import { NextResponse } from "next/server";

type OpenMeteoResponse = {
  current?: {
    time: string;
    temperature_2m?: number;
    relative_humidity_2m?: number;
    precipitation?: number;
    rain?: number;
    wind_speed_10m?: number;
  };
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latitude = Number(searchParams.get("lat"));
  const longitude = Number(searchParams.get("lng"));

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return NextResponse.json({ error: "Latitude and longitude are required." }, { status: 400 });
  }

  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current: "temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m",
    timezone: "Asia/Jakarta"
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
    next: { revalidate: 900 }
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Open-Meteo request failed." }, { status: 502 });
  }

  const payload = (await response.json()) as OpenMeteoResponse;

  if (!payload.current) {
    return NextResponse.json({ error: "Open-Meteo current weather is unavailable." }, { status: 502 });
  }

  return NextResponse.json({
    source: "Open-Meteo",
    observedAt: payload.current.time,
    temperatureC: payload.current.temperature_2m ?? null,
    humidityPercent: payload.current.relative_humidity_2m ?? null,
    precipitationMm: payload.current.precipitation ?? payload.current.rain ?? 0,
    rainMm: payload.current.rain ?? 0,
    windKmh: payload.current.wind_speed_10m ?? null
  });
}
