import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { regions as fallbackRegions } from "@/lib/data";

// GET /api/regions — fetch region data from Supabase with fallback to static data
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from("regions")
      .select("*")
      .order("name", { ascending: true });

    if (error || !data || data.length === 0) {
      // Fallback to hardcoded data if Supabase table doesn't exist yet
      return NextResponse.json(fallbackRegions);
    }

    // Map Supabase columns to the frontend RegionStatus shape
    const regions = data.map((r: any) => ({
      id: r.id,
      name: r.name,
      province: r.province,
      lat: r.lat,
      lng: r.lng,
      waterLevelCm: r.water_level_cm,
      rainfallMm: r.rainfall_mm,
      tideCm: r.tide_cm,
      reports: r.reports,
      updatedAt: r.updated_at,
      risk: r.risk,
      summary: r.summary,
    }));

    return NextResponse.json(regions);
  } catch {
    return NextResponse.json(fallbackRegions);
  }
}
