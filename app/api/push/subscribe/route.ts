import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// POST /api/push/subscribe — save push subscription
export async function POST(req: Request) {
  try {
    const { subscription, regionId } = await req.json();

    if (!subscription?.endpoint) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    await supabase.from("push_subscriptions").upsert(
      {
        endpoint: subscription.endpoint,
        keys_p256dh: subscription.keys.p256dh,
        keys_auth: subscription.keys.auth,
        region_id: regionId ?? null,
        active: true,
      },
      { onConflict: "endpoint" }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Push Subscribe]", err);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}

// DELETE /api/push/subscribe — remove push subscription
export async function DELETE(req: Request) {
  try {
    const { endpoint } = await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    await supabase
      .from("push_subscriptions")
      .update({ active: false })
      .eq("endpoint", endpoint);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Push Unsubscribe]", err);
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
  }
}
