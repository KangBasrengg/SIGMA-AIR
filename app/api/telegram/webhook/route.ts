import { NextResponse } from "next/server";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function sendTelegram(chatId: string | number, text: string) {
  return fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
}

// POST /api/telegram/webhook — receives updates from Telegram
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = body.message;
    if (!message?.text) return NextResponse.json({ ok: true });

    const chatId = message.chat.id;
    const text = message.text.trim().toLowerCase();
    const firstName = message.from?.first_name ?? "Warga";

    // /start command — subscribe user
    if (text === "/start") {
      // Store subscriber in Supabase
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      await supabase.from("telegram_subscribers").upsert(
        { chat_id: chatId, first_name: firstName, active: true },
        { onConflict: "chat_id" }
      );

      await sendTelegram(
        chatId,
        `🌊 *Selamat datang di SIGMA AIR, ${firstName}!*\n\nAnda sekarang akan menerima notifikasi peringatan banjir & rob secara real-time.\n\n📋 *Perintah yang tersedia:*\n/status — Lihat ringkasan kondisi seluruh wilayah\n/stop — Berhenti berlangganan notifikasi`
      );
      return NextResponse.json({ ok: true });
    }

    // /stop command — unsubscribe
    if (text === "/stop") {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      await supabase
        .from("telegram_subscribers")
        .update({ active: false })
        .eq("chat_id", chatId);

      await sendTelegram(
        chatId,
        `✅ Anda telah berhenti berlangganan notifikasi SIGMA AIR.\n\nKirim /start kapan saja untuk berlangganan kembali.`
      );
      return NextResponse.json({ ok: true });
    }

    // /status command — show all region status
    if (text === "/status") {
      const riskEmoji: Record<string, string> = {
        high: "🔴 SIAGA",
        medium: "🟡 WASPADA",
        low: "🟢 NORMAL",
      };

      // Import regions data
      const { regions } = await import("@/lib/data");

      let statusText = "📊 *Status Wilayah SIGMA AIR*\n\n";
      for (const r of regions) {
        statusText += `${riskEmoji[r.risk] ?? "⚪"} *${r.name}*\n`;
        statusText += `   💧 Air: ${r.waterLevelCm} cm | 🌧 Hujan: ${r.rainfallMm} mm\n`;
        statusText += `   🌊 Pasang: ${r.tideCm} cm | 📝 ${r.reports} laporan\n`;
        statusText += `   _${r.summary}_\n\n`;
      }

      await sendTelegram(chatId, statusText);
      return NextResponse.json({ ok: true });
    }

    // Default response for unknown commands
    await sendTelegram(
      chatId,
      `❓ Perintah tidak dikenali.\n\n📋 *Perintah yang tersedia:*\n/start — Berlangganan notifikasi\n/status — Lihat kondisi wilayah\n/stop — Berhenti berlangganan`
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Telegram Webhook]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
