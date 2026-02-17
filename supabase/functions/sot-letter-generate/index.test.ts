import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/sot-letter-generate`;

Deno.test("CORS preflight returns 200", async () => {
  const res = await fetch(FUNCTION_URL, { method: "OPTIONS", headers: { "Origin": "http://localhost:3000", "Access-Control-Request-Method": "POST" } });
  assertEquals(res.status, 200);
  await res.text();
});

Deno.test("Missing required fields returns 400", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` },
    body: JSON.stringify({ recipient: { name: "" }, prompt: "" }),
  });
  assertEquals(res.status, 400);
  const data = await res.json();
  assertExists(data.error);
});

Deno.test("Successful letter generation", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` },
    body: JSON.stringify({
      recipient: { name: "Max Mustermann", company: "Test GmbH", salutation: "Herr" },
      subject: "Mieterhöhung",
      prompt: "Bitte informieren Sie den Mieter über eine Mieterhöhung von 50 Euro ab dem nächsten Quartal.",
    }),
  });
  assertEquals(res.status, 200);
  const data = await res.json();
  assertExists(data.body);
  assertEquals(typeof data.body, "string");
});
