import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;

webpush.setVapidDetails(
  "mailto:admin@sigma-air.id",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// POST /api/push/send — send push notification to all subscribers
export async function POST(req: Request) {
  try {
    const { title, body, regionId } = await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch subscriptions, optionally filtered by region
    let query = supabase.from("push_subscriptions").select("*").eq("active", true);
    if (regionId) {
      query = query.or(`region_id.eq.${regionId},region_id.is.null`);
    }
    const { data: subs } = await query;

    if (!subs || subs.length === 0) {
      return NextResponse.json({ sent: 0, message: "No active subscriptions" });
    }

    const payload = JSON.stringify({
      title: title || "⚠️ Peringatan SIGMA AIR",
      body: body || "Ada perubahan kondisi di wilayah pantauan Anda.",
      icon: "/logo.png",
      badge: "/logo.png",
      url: "/",
    });

    let sent = 0;
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
          },
          payload
        );
        sent++;
      } catch (err: any) {
        // If subscription is expired/invalid, deactivate it
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase
            .from("push_subscriptions")
            .update({ active: false })
            .eq("endpoint", sub.endpoint);
        }
      }
    }

    return NextResponse.json({ sent, total: subs.length });
  } catch (err) {
    console.error("[Push Send]", err);
    return NextResponse.json({ error: "Failed to send push" }, { status: 500 });
  }
}
