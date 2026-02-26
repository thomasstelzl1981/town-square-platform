/**
 * sot-onetime-welcome-mail — One-time Armstrong welcome email to rr@unitys.com
 * This function sends a single welcome email and then refuses further calls.
 * Self-destructing: after successful send, it marks completion in DB.
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if already sent (idempotency guard)
    const { data: existing } = await supabase
      .from("admin_outbound_emails")
      .select("id")
      .eq("to_email", "rr@unitys.com")
      .eq("subject", "Willkommen bei System of a Town — Dein neuer KI-Assistent Armstrong stellt sich vor")
      .eq("status", "sent")
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ success: true, message: "Already sent", email_id: existing.id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const routingToken = crypto.randomUUID();
    
    const bodyHtml = `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 640px; margin: 0 auto; background: #ffffff; color: #1a1a2e;"><div style="background: linear-gradient(135deg, #0f0c29, #302b63, #24243e); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;"><h1 style="color: #ffffff; font-size: 28px; margin: 0 0 8px 0; font-weight: 700;">🚀 Willkommen, Ralph!</h1><p style="color: #a0a0cc; font-size: 14px; margin: 0;">Dein KI-Assistent Armstrong meldet sich zum Dienst</p></div><div style="padding: 30px;"><p style="font-size: 16px; line-height: 1.6;">Hallo Ralph,</p><p style="font-size: 16px; line-height: 1.6;">herzlich willkommen im Team! Mein Name ist <strong>Armstrong</strong> — ich bin Dein neuer KI-Assistent auf der <strong>System of a Town</strong> Plattform.</p><p style="font-size: 16px; line-height: 1.6;">Ich wurde entwickelt, um Dich bei Deiner täglichen Arbeit zu unterstützen: von Immobilienanalysen über Finanzierungsberechnungen bis hin zur Dokumentenverwaltung. Ich bin rund um die Uhr für Dich da. 💪</p><div style="background: #f0f0ff; border-left: 4px solid #302b63; padding: 20px; border-radius: 8px; margin: 24px 0;"><h2 style="font-size: 18px; margin: 0 0 16px 0; color: #302b63;">🔐 Deine Zugänge</h2><table style="width: 100%; font-size: 15px; line-height: 1.8;"><tr><td style="padding: 4px 0;">🌐 <strong>Plattform:</strong></td><td><a href="https://systemofatown.com" style="color: #302b63;">systemofatown.com</a></td></tr><tr><td style="padding: 4px 0;">🏠 <strong>Kaufy:</strong></td><td><a href="https://kaufy.immo" style="color: #302b63;">kaufy.immo</a></td></tr><tr><td style="padding: 4px 0;">🔑 <strong>Zugangscode:</strong></td><td><code style="background: #e0e0f0; padding: 2px 8px; border-radius: 4px; font-size: 16px; font-weight: bold;">2710</code></td></tr><tr><td style="padding: 4px 0;">📧 <strong>Login:</strong></td><td><code style="background: #e0e0f0; padding: 2px 8px; border-radius: 4px;">rr@unitys.com</code></td></tr></table><p style="margin: 12px 0 0 0; font-size: 13px; color: #cc0000;">⚠️ <strong>Bitte ändere Dein Passwort NICHT</strong>, da wir den Account für die weitere Entwicklung benötigen.</p></div><h2 style="font-size: 18px; color: #302b63; margin: 28px 0 16px 0;">📦 Deine Module im Überblick</h2><div style="margin-bottom: 8px; background: #fafafa; padding: 12px 16px; border-radius: 8px; font-size: 14px;">📋 <strong>MOD-01 Stammdaten</strong> — Kontakte, Adressen, Firmendaten</div><div style="margin-bottom: 8px; background: #fafafa; padding: 12px 16px; border-radius: 8px; font-size: 14px;">🤖 <strong>MOD-02 KI Office</strong> — E-Mail, Briefe, Kontakte, Kalender, Videocalls</div><div style="margin-bottom: 8px; background: #fafafa; padding: 12px 16px; border-radius: 8px; font-size: 14px;">📁 <strong>MOD-03 DMS</strong> — Dokumentenmanagement mit KI-Erkennung</div><div style="margin-bottom: 8px; background: #fafafa; padding: 12px 16px; border-radius: 8px; font-size: 14px;">🏢 <strong>MOD-04 Immobilien</strong> — Objektverwaltung &amp; Bewirtschaftung</div><div style="margin-bottom: 8px; background: #fafafa; padding: 12px 16px; border-radius: 8px; font-size: 14px;">💰 <strong>MOD-07 Finanzierung</strong> — Finanzierungsrechner &amp; Bankanbindung</div><div style="margin-bottom: 8px; background: #fafafa; padding: 12px 16px; border-radius: 8px; font-size: 14px;">📊 <strong>MOD-08 Investment-Suche</strong> — Renditeanalyse &amp; Objektvergleich</div><div style="margin-bottom: 8px; background: #fafafa; padding: 12px 16px; border-radius: 8px; font-size: 14px;">💹 <strong>MOD-18 Finanzen</strong> — BWA, Kontoübersicht, Budgetplanung</div><div style="margin-bottom: 8px; background: #fafafa; padding: 12px 16px; border-radius: 8px; font-size: 14px;">☀️ <strong>MOD-19 Photovoltaik</strong> — PV-Anlagen &amp; Monitoring</div><div style="margin-bottom: 8px; background: #fafafa; padding: 12px 16px; border-radius: 8px; font-size: 14px;">🛒 <strong>MOD-16 Shop</strong> — Produkte &amp; Services</div><div style="margin-bottom: 8px; background: #fafafa; padding: 12px 16px; border-radius: 8px; font-size: 14px;">🎓 <strong>MOD-15 Fortbildung</strong> — Weiterbildung &amp; Kurse</div><div style="margin-bottom: 8px; background: #fafafa; padding: 12px 16px; border-radius: 8px; font-size: 14px;">🏡 <strong>MOD-20 Miety</strong> — Smart Home &amp; Mietverwaltung</div><h3 style="font-size: 16px; color: #666; margin: 20px 0 12px 0;">Partner-Module</h3><div style="margin-bottom: 6px; background: #f5f5f5; padding: 10px 16px; border-radius: 6px; font-size: 13px;">🤝 MOD-09 Vertriebspartner-Katalog · 📈 MOD-10 Leads · 💼 MOD-11 Finanzierungsmanager</div><div style="margin-bottom: 6px; background: #f5f5f5; padding: 10px 16px; border-radius: 6px; font-size: 13px;">🔍 MOD-12 Akquise-Manager · 📐 MOD-13 Projekte · 📣 MOD-14 Communication Pro</div><div style="margin-bottom: 6px; background: #f5f5f5; padding: 10px 16px; border-radius: 6px; font-size: 13px;">🚗 MOD-17 Cars · 🐾 MOD-22 Pet Manager</div><div style="margin-top: 32px; padding: 20px; background: linear-gradient(135deg, #f0f0ff, #e8e8ff); border-radius: 12px; text-align: center;"><p style="font-size: 16px; margin: 0 0 8px 0;">Ich freue mich darauf, Dich kennenzulernen und bei allem zu unterstützen! 🎯</p><p style="font-size: 14px; color: #666; margin: 0;">Wenn Du Fragen hast — ich bin immer nur einen Klick entfernt.</p></div><div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;"><p style="font-size: 14px; color: #666; margin: 0;">Dein KI-Assistent <strong>Armstrong</strong> 🤖</p><p style="font-size: 13px; color: #999; margin: 4px 0 0 0;">im Auftrag von Ralph Reinhold · System of a Town</p></div></div></div>`;

    const bodyText = `Hallo Ralph,\n\nherzlich willkommen im Team! Mein Name ist Armstrong — ich bin Dein neuer KI-Assistent auf der System of a Town Plattform.\n\nIch wurde entwickelt, um Dich bei Deiner täglichen Arbeit zu unterstützen.\n\nDeine Zugänge:\n🌐 Plattform: https://systemofatown.com\n🏠 Kaufy: https://kaufy.immo\n🔑 Zugangscode: 2710\n📧 Login: rr@unitys.com\n⚠️ WICHTIG: Bitte ändere Dein Passwort NICHT\n\nDein KI-Assistent Armstrong\nim Auftrag von Ralph Reinhold · System of a Town`;

    // Create outbound record
    const { data: emailRecord, error: insertError } = await supabase
      .from("admin_outbound_emails")
      .insert({
        to_email: "rr@unitys.com",
        to_name: "Ralph Reinhold",
        subject: "Willkommen bei System of a Town — Dein neuer KI-Assistent Armstrong stellt sich vor",
        body_html: bodyHtml,
        body_text: bodyText,
        routing_token: routingToken,
        status: "queued",
        created_by: "d028bc99-6e29-4fa4-b038-d03015faf222", // Thomas Stelzl
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Failed to create email record");
    }

    // Send via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Armstrong · System of a Town <noreply@systemofatown.com>",
        to: "Ralph Reinhold <rr@unitys.com>",
        reply_to: "ralph.reinhold@systemofatown.com",
        subject: "Willkommen bei System of a Town — Dein neuer KI-Assistent Armstrong stellt sich vor",
        html: bodyHtml,
        text: bodyText,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend error:", resendData);
      await supabase.from("admin_outbound_emails").update({ status: "failed", error_message: resendData.message }).eq("id", emailRecord.id);
      throw new Error(`Resend error: ${resendData.message}`);
    }

    // Mark as sent
    await supabase.from("admin_outbound_emails").update({
      resend_message_id: resendData.id,
      status: "sent",
      sent_at: new Date().toISOString(),
    }).eq("id", emailRecord.id);

    console.log(`✅ Armstrong welcome email sent to rr@unitys.com: ${resendData.id}`);

    return new Response(
      JSON.stringify({ success: true, email_id: emailRecord.id, resend_id: resendData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Error:", msg);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
