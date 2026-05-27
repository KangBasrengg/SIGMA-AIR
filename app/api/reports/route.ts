import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { regions } from "@/lib/data";

export async function POST(req: Request) {
  try {
    const { regionId, description, mediaUrl } = await req.json();

    if (!description) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Auto-calculate confidence (mock for now, or you could call Groq here)
    const confidence = 85; 

    // Insert the report
    const { error, data: report } = await supabase
      .from("citizen_reports")
      .insert({
        region_id: regionId,
        description: description.trim(),
        media_url: mediaUrl,
        confidence,
      })
      .select()
      .single();

    if (error) throw error;

    // Auto-Alert Trigger: if confidence > 80 and the description implies danger
    const isDangerous = description.toLowerCase().includes("banjir") || description.toLowerCase().includes("naik") || description.toLowerCase().includes("parah");
    
    if (confidence > 80 && isDangerous) {
      const region = regions.find(r => r.id === regionId);
      const alertTitle = `🚨 Laporan Darurat: ${region?.name ?? regionId}`;
      const alertBody = `Warga melaporkan: "${description.substring(0, 100)}..."`;

      // Call our own push/send API with the service token
      const baseUrl = req.url.split("/api")[0];
      await fetch(`${baseUrl}/api/push/send`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-service-token": process.env.ADMIN_PASSWORD ?? ""
        },
        body: JSON.stringify({
          title: alertTitle,
          body: alertBody,
          regionId: regionId
        })
      });

      // Also trigger Telegram if configured
      if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_TOKEN !== "your_telegram_bot_token_here") {
        await fetch(`${baseUrl}/api/telegram/alert`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            regionName: region?.name ?? regionId,
            risk: "high",
            summary: alertBody
          })
        });
      }
    }

    return NextResponse.json({ ok: true, report });
  } catch (err) {
    console.error("[Report Submit Error]", err);
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}
