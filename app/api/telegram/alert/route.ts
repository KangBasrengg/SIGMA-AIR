import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// POST /api/telegram/alert — broadcast alert to all active subscribers
export async function POST(req: Request) {
  try {
    if (!BOT_TOKEN) {
      return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not configured" }, { status: 500 });
    }

    const { regionName, risk, summary } = await req.json();

    const riskEmoji: Record<string, string> = {
      high: "🔴 SIAGA",
      medium: "🟡 WASPADA",
      low: "🟢 NORMAL",
    };

    const alertText =
      `⚠️ *PERINGATAN SIGMA AIR*\n\n` +
      `📍 *${regionName}*\n` +
      `Status: ${riskEmoji[risk] ?? risk}\n\n` +
      `${summary}\n\n` +
      `_Tetap waspada dan ikuti arahan petugas._`;

    // Fetch all active subscribers
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: subscribers } = await supabase
      .from("telegram_subscribers")
      .select("chat_id")
      .eq("active", true);

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ sent: 0, message: "No active subscribers" });
    }

    // Send message to all subscribers
    let sent = 0;
    for (const sub of subscribers) {
      try {
        await fetch(`${TELEGRAM_API}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: sub.chat_id,
            text: alertText,
            parse_mode: "Markdown",
          }),
        });
        sent++;
      } catch {
        // Skip failed sends
      }
    }

    return NextResponse.json({ sent, total: subscribers.length });
  } catch (err) {
    console.error("[Telegram Alert]", err);
    return NextResponse.json({ error: "Failed to send alerts" }, { status: 500 });
  }
}
