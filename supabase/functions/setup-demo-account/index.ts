import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { action } = await req.json().catch(() => ({ action: "setup-demo" }));

    if (action === "setup-robyn") {
      // Set password for Robyn's existing account
      const ROBYN_EMAIL = "robyn@lennoxandfriends.app";
      const ROBYN_PASSWORD = "SoT-Robyn2026!";

      const { data: users } = await supabase.auth.admin.listUsers();
      const robyn = users?.users?.find((u: any) => u.email === ROBYN_EMAIL);

      if (!robyn) {
        return new Response(
          JSON.stringify({ success: false, error: "Robyn account not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await supabase.auth.admin.updateUserById(robyn.id, {
        password: ROBYN_PASSWORD,
        email_confirm: true,
      });

      return new Response(
        JSON.stringify({ success: true, userId: robyn.id, email: ROBYN_EMAIL, message: "Robyn password set" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "setup-otto") {
      const OTTO_ID = "f3456165-e065-4df1-85c4-65d7fed08f21";
      const OTTO_PASSWORD = "ZLwohnbau2025!Sot";

      await supabase.auth.admin.updateUserById(OTTO_ID, {
        password: OTTO_PASSWORD,
        email_confirm: true,
      });

      return new Response(
        JSON.stringify({ success: true, userId: OTTO_ID, email: "otto.stelzl@zl-wohnbau.de", message: "Otto password set" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Default: setup demo account
    const DEMO_EMAIL = "demo@systemofatown.com";
    const DEMO_PASSWORD = "DemoSoT2026!public";
    const DEMO_TENANT_ID = "c3123104-e2ec-47ca-9f0a-616808557ece";

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((u: any) => u.email === DEMO_EMAIL);

    let userId: string;

    if (existing) {
      userId = existing.id;
      await supabase.auth.admin.updateUserById(userId, {
        password: DEMO_PASSWORD,
        email_confirm: true,
      });
    } else {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
      });

      if (createError) throw createError;
      userId = newUser.user.id;
    }

    // Ensure profile exists and is linked to demo tenant
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        display_name: "Demo Benutzer",
        first_name: "Demo",
        last_name: "Benutzer",
      }, { onConflict: "id" });

    if (profileError) {
      console.error("Profile error:", profileError);
    }

    // Ensure org membership with viewer role
    const { error: memberError } = await supabase
      .from("organization_members")
      .upsert({
        user_id: userId,
        organization_id: DEMO_TENANT_ID,
        role: "viewer",
      }, { onConflict: "user_id,organization_id" });

    if (memberError) {
      console.error("Member error:", memberError);
    }

    return new Response(
      JSON.stringify({ success: true, userId, message: "Demo account ready" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
