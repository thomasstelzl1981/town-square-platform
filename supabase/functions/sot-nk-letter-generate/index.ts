import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

/**
 * SOT NK-Letter-Generate — Runde 3 (P2)
 * 
 * Generates personalized cover letters for NK-Abrechnungen (tenant settlement letters).
 * Uses Gemini to produce legally compliant German text based on settlement results.
 * 
 * Input:
 *   - tenant: { name, salutation, address }
 *   - property: { name, address }
 *   - settlement: { period_start, period_end, result_amount, is_refund, cost_breakdown[] }
 *   - landlord: { name, company, iban?, bank_name? }
 *   - customInstructions?: string
 */

serve(async (req) => {
  if (req.method === "OPTIONS") return handleCorsPreflightRequest(req);
  const cors = getCorsHeaders(req);

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { tenant, property, settlement, landlord, customInstructions } = await req.json();

    if (!tenant?.name || !settlement) {
      return new Response(JSON.stringify({ error: "Mieter und Abrechnungsdaten sind erforderlich" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const isRefund = settlement.result_amount < 0 || settlement.is_refund;
    const absAmount = Math.abs(settlement.result_amount || 0);

    const salutationLine = tenant.salutation === "Herr"
      ? `Sehr geehrter Herr ${tenant.name.split(" ").pop()}`
      : tenant.salutation === "Frau"
        ? `Sehr geehrte Frau ${tenant.name.split(" ").pop()}`
        : `Sehr geehrte/r ${tenant.name}`;

    const costBreakdownText = (settlement.cost_breakdown || [])
      .map((c: { category: string; amount: number }) => `  - ${c.category}: ${c.amount?.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €`)
      .join("\n");

    const systemPrompt = `Du bist ein professioneller Assistent für deutsche Nebenkostenabrechnungen.
Erstelle ein rechtssicheres Anschreiben für eine Betriebskostenabrechnung nach §556 BGB.

STRUKTUR:
1. Anrede
2. Einleitungssatz mit Abrechnungszeitraum
3. Ergebnis: ${isRefund ? "Guthaben" : "Nachzahlung"} von ${absAmount.toLocaleString("de-DE", { minimumFractionDigits: 2 })} EUR
4. ${isRefund ? "Hinweis auf Erstattung (Überweisung auf bekanntes Konto oder Verrechnung)" : "Zahlungsaufforderung mit Frist (30 Tage) und Bankverbindung"}
5. Hinweis auf Belegeinsichtsrecht (§259 BGB) — Frist: 12 Monate
6. Hinweis auf Widerspruchsfrist (12 Monate nach Zugang, §556 Abs. 3 S. 5 BGB)
7. Grußformel + Unterschriftsblock

REGELN:
- Formeller Ton, Sie-Form
- Keine Markdown-Formatierung, reiner Fließtext
- 200-350 Wörter
- KEINE Platzhalter wie [Datum]
- Beträge immer mit Komma und 2 Dezimalstellen`;

    const userPrompt = `Erstelle das NK-Abrechnungs-Anschreiben:

MIETER: ${tenant.name}
${tenant.address ? `ANSCHRIFT: ${tenant.address}` : ""}
ANREDE: ${salutationLine}

OBJEKT: ${property?.name || "Mietobjekt"}, ${property?.address || ""}

ABRECHNUNGSZEITRAUM: ${settlement.period_start || "01.01.2024"} bis ${settlement.period_end || "31.12.2024"}

ERGEBNIS: ${isRefund ? "GUTHABEN" : "NACHZAHLUNG"} von ${absAmount.toLocaleString("de-DE", { minimumFractionDigits: 2 })} EUR

${costBreakdownText ? `KOSTENÜBERSICHT:\n${costBreakdownText}` : ""}

VERMIETER: ${landlord?.name || "Hausverwaltung"}
${landlord?.company ? `FIRMA: ${landlord.company}` : ""}
${landlord?.iban ? `IBAN: ${landlord.iban}` : ""}
${landlord?.bank_name ? `BANK: ${landlord.bank_name}` : ""}

${customInstructions ? `ZUSÄTZLICHE ANWEISUNGEN: ${customInstructions}` : ""}

Beginne direkt mit der Anrede.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.5,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit erreicht" }), {
          status: 429, headers: { ...cors, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Kontingent erschöpft" }), {
          status: 402, headers: { ...cors, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Brief-Generierung fehlgeschlagen" }), {
        status: 500, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const letterBody = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({
      body: letterBody,
      settlement_type: isRefund ? "refund" : "surcharge",
      amount: absAmount,
      model: data.model,
      usage: data.usage,
    }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("NK letter generation error:", error);
    const message = error instanceof Error ? error.message : "Unbekannter Fehler";
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
