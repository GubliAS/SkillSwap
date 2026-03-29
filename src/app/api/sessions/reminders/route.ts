import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails("mailto:skillswap@knust.edu.gh", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function sendPushToUser(userId: string, title: string, body: string) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;
  const { data: sub } = await supabaseAdmin
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (!sub) return;
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify({ title, body, url: "/dashboard/swaps", tag: `reminder-${userId}` })
    );
  } catch {
    // Subscription expired — clean up
    await supabaseAdmin.from("push_subscriptions").delete().eq("user_id", userId);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in1h = new Date(now.getTime() + 60 * 60 * 1000);

    // Fetch all accepted sessions for this user
    const { data: sessions } = await supabaseAdmin
      .from("sessions")
      .select("*")
      .eq("status", "accepted")
      .or(`teacher_id.eq.${userId},learner_id.eq.${userId}`);

    if (!sessions) return NextResponse.json({ checked: 0 });

    let sent = 0;
    for (const session of sessions) {
      const sessionDateTime = new Date(`${session.date}T${session.time || "00:00"}`);
      const diffMs = sessionDateTime.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      const isTeacher = session.teacher_id === userId;
      const role = isTeacher ? "teaching" : "learning";

      // 24-hour reminder window (between 23h and 25h away)
      if (diffHours >= 23 && diffHours <= 25) {
        await sendPushToUser(
          userId,
          "Session Tomorrow ⏰",
          `You have a ${role} session for ${session.skill} tomorrow at ${session.time}.`
        );
        sent++;
      }

      // 1-hour reminder window (between 55min and 65min away)
      if (diffHours >= 0.9 && diffHours <= 1.1) {
        await sendPushToUser(
          userId,
          "Session in 1 Hour 🔔",
          `Your ${session.skill} session starts in about 1 hour.`
        );
        sent++;
      }

      void in24h; void in1h; // suppress unused variable warnings
    }

    return NextResponse.json({ checked: sessions.length, sent });
  } catch (err) {
    console.error("Reminders error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
