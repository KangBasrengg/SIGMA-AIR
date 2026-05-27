import { NextResponse } from "next/server";

const WORLDTIDES_BASE_URL = "http://www.worldtides.info/api/v3";

type WorldTidesHeight = {
  dt?: number;
  date?: string;
  height?: number;
};

type WorldTidesExtreme = {
  dt?: number;
  date?: string;
  height?: number;
  type?: string;
};

type WorldTidesResponse = {
  heights?: WorldTidesHeight[];
  extremes?: WorldTidesExtreme[];
  error?: string;
};

function nearestHeight(heights: WorldTidesHeight[]) {
  const now = Date.now() / 1000;

  return heights.reduce<WorldTidesHeight | null>((nearest, item) => {
    if (!item.dt) return nearest;
    if (!nearest?.dt) return item;
    return Math.abs(item.dt - now) < Math.abs(nearest.dt - now) ? item : nearest;
  }, null);
}

export async function GET(request: Request) {
  const apiKey = process.env.WORLDTIDES_API_KEY;
  const { searchParams } = new URL(request.url);
  const latitude = Number(searchParams.get("lat"));
  const longitude = Number(searchParams.get("lng"));

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return NextResponse.json({ error: "Latitude and longitude are required." }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "WorldTides API key is not configured.",
        requiresEnv: "WORLDTIDES_API_KEY"
      },
      { status: 503 }
    );
  }

  const params = new URLSearchParams({
    key: apiKey,
    lat: latitude.toString(),
    lon: longitude.toString(),
    heights: "",
    extremes: "",
    date: "today",
    days: "1",
    localtime: ""
  });

  const response = await fetch(`${WORLDTIDES_BASE_URL}?${params.toString()}`, {
    next: { revalidate: 1800 }
  });

  if (!response.ok) {
    return NextResponse.json({ error: "WorldTides request failed." }, { status: 502 });
  }

  const payload = (await response.json()) as WorldTidesResponse;

  if (payload.error) {
    return NextResponse.json({ error: payload.error }, { status: 502 });
  }

  const closest = nearestHeight(payload.heights ?? []);
  const nextExtreme = (payload.extremes ?? []).find((item) => item.dt && item.dt > Date.now() / 1000) ?? null;

  return NextResponse.json({
    source: "WorldTides",
    observedAt: closest?.date ?? null,
    tideHeightM: closest?.height ?? null,
    tideHeightCm: typeof closest?.height === "number" ? Math.round(closest.height * 100) : null,
    nextExtreme: nextExtreme
      ? {
          type: nextExtreme.type ?? null,
          at: nextExtreme.date ?? null,
          heightM: nextExtreme.height ?? null,
          heightCm: typeof nextExtreme.height === "number" ? Math.round(nextExtreme.height * 100) : null
        }
      : null
  });
}
