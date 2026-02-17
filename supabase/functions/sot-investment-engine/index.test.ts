import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/sot-investment-engine`;

Deno.test("CORS preflight returns 200", async () => {
  const res = await fetch(FUNCTION_URL, { method: "OPTIONS", headers: { "Origin": "http://localhost:3000", "Access-Control-Request-Method": "POST" } });
  assertEquals(res.status, 200);
  await res.text();
});

Deno.test("Successful calculation with standard input", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` },
    body: JSON.stringify({
      purchasePrice: 250000,
      monthlyRent: 800,
      equity: 50000,
      termYears: 15,
      repaymentRate: 2,
      taxableIncome: 60000,
      maritalStatus: "single",
      hasChurchTax: false,
      afaModel: "linear",
      buildingShare: 0.8,
      managementCostMonthly: 30,
      valueGrowthRate: 2,
      rentGrowthRate: 1.5,
    }),
  });
  assertEquals(res.status, 200);
  const data = await res.json();
  assertExists(data.summary);
  assertExists(data.projection);
  assertEquals(data.projection.length, 40);
  assertEquals(typeof data.summary.monthlyBurden, "number");
});
