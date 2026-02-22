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

    const DEMO_EMAIL = "demo@systemofatown.com";
    const DEMO_PASSWORD = "DemoSoT2026!public";
    const DEMO_TENANT_ID = "a0000000-0000-4000-a000-000000000001";

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((u: any) => u.email === DEMO_EMAIL);

    let userId: string;

    if (existing) {
      userId = existing.id;
      // Update password in case it changed
      await supabase.auth.admin.updateUserById(userId, {
        password: DEMO_PASSWORD,
        email_confirm: true,
      });
    } else {
      // Create user
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
      JSON.stringify({ 
        success: true, 
        userId,
        message: "Demo account ready" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
