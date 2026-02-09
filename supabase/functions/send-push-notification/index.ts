import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PushNotificationRequest {
  user_id: string;
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, unknown>;
  url?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: PushNotificationRequest = await req.json();
    const { user_id, title, body, icon, data, url } = payload;

    if (!user_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: user_id, title, body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: tokens, error: tokensError } = await supabase
      .from("push_notification_tokens")
      .select("token, platform")
      .eq("pet_master_id", user_id)
      .eq("is_active", true);

    if (tokensError) {
      throw tokensError;
    }

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active push tokens found for user" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const notificationPayload = {
      title,
      body,
      icon: icon || "/icon-192.png",
      data: {
        ...data,
        url: url || "/",
        timestamp: Date.now(),
      },
    };

    const webTokens = tokens.filter(t => t.platform === "web");

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const tokenData of webTokens) {
      try {
        const response = await fetch(`https://fcm.googleapis.com/fcm/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: tokenData.token,
            notification: notificationPayload,
          }),
        });

        if (response.ok) {
          results.sent++;
        } else {
          results.failed++;
          const errorText = await response.text();
          results.errors.push(`Token ${tokenData.token.substring(0, 10)}...: ${errorText}`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`Token ${tokenData.token.substring(0, 10)}...: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    await supabase.from("notifications").insert({
      pet_master_id: user_id,
      type: "push",
      title,
      message: body,
      data: notificationPayload.data,
      is_read: false,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Push notifications processed`,
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error sending push notification:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
