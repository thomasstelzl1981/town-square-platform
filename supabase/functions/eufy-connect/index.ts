import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EUFY_LOGIN_URL = "https://mysecurity.eufylife.com/api/v1/passport/login";
const EUFY_DEVICE_LIST_URL = "https://mysecurity.eufylife.com/api/v1/app/get_devs_list";

interface EufyLoginResponse {
  code: number;
  msg: string;
  data?: {
    auth_token?: string;
    token_expires_at?: number;
    user_id?: string;
    email?: string;
    domain?: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Nicht autorisiert" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Nicht autorisiert" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, email, password, tenant_id } = await req.json();

    if (action === "login") {
      if (!email || !password || !tenant_id) {
        return new Response(
          JSON.stringify({ error: "E-Mail, Passwort und Tenant-ID erforderlich" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Authenticate with eufy Cloud API
      const loginRes = await fetch(EUFY_LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const loginData: EufyLoginResponse = await loginRes.json();

      if (loginData.code !== 0 || !loginData.data?.auth_token) {
        return new Response(
          JSON.stringify({
            error: "eufy Login fehlgeschlagen",
            detail: loginData.msg || "Ungültige Zugangsdaten",
          }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const token = loginData.data.auth_token;
      const domain = loginData.data.domain;

      // Store/update token in DB
      const { error: upsertError } = await supabase
        .from("miety_eufy_accounts")
        .upsert(
          {
            user_id: user.id,
            tenant_id,
            email,
            token,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,tenant_id" }
        );

      if (upsertError) {
        console.error("DB upsert error:", upsertError);
      }

      // Fetch device list
      const devBaseUrl = domain
        ? `https://${domain}/api/v1/app/get_devs_list`
        : EUFY_DEVICE_LIST_URL;

      const devRes = await fetch(devBaseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
        body: JSON.stringify({ device_sn: "", num: 100, orderby: "", page: 0, station_sn: "" }),
      });

      const devData = await devRes.json();

      const devices = (devData.data?.device_list || []).map((d: any) => ({
        name: d.device_name,
        model: d.device_model,
        serial: d.device_sn,
        status: d.device_status === 0 ? "online" : "offline",
        type: d.device_type,
      }));

      const stations = (devData.data?.station_list || []).map((s: any) => ({
        name: s.station_name,
        model: s.station_model,
        serial: s.station_sn,
        status: s.member?.family_id ? "online" : "offline",
      }));

      return new Response(
        JSON.stringify({
          success: true,
          devices,
          stations,
          account_email: email,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "devices") {
      // Load stored token and fetch devices
      const { data: account } = await supabase
        .from("miety_eufy_accounts")
        .select("token, email")
        .eq("user_id", user.id)
        .eq("tenant_id", tenant_id)
        .single();

      if (!account?.token) {
        return new Response(
          JSON.stringify({ error: "Kein eufy-Konto verbunden" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const devRes = await fetch(EUFY_DEVICE_LIST_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": account.token,
        },
        body: JSON.stringify({ device_sn: "", num: 100, orderby: "", page: 0, station_sn: "" }),
      });

      const devData = await devRes.json();

      if (devData.code !== 0) {
        return new Response(
          JSON.stringify({ error: "Token abgelaufen — bitte erneut verbinden", expired: true }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const devices = (devData.data?.device_list || []).map((d: any) => ({
        name: d.device_name,
        model: d.device_model,
        serial: d.device_sn,
        status: d.device_status === 0 ? "online" : "offline",
        type: d.device_type,
      }));

      return new Response(
        JSON.stringify({ success: true, devices, account_email: account.email }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "disconnect") {
      await supabase
        .from("miety_eufy_accounts")
        .delete()
        .eq("user_id", user.id)
        .eq("tenant_id", tenant_id);

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unbekannte Aktion" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("eufy-connect error:", err);
    return new Response(
      JSON.stringify({ error: "Interner Fehler", detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
