import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { logDataEvent } from "../_shared/ledger.ts";

// ── HARDCODED PROTECTION ──────────────────────────────────────────────
// This user ID can NEVER be deleted, even if passed by mistake.
const PROTECTED_USER_IDS = [
  "d028bc99-6e29-4fa4-b038-d03015faf222", // thomas.stelzl@systemofadown.com
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleCorsPreflightRequest(req);
  const cors = getCorsHeaders(req);

  try {
    // ── Gate 1: JWT + platform_admin ──────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // User client for auth check
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabaseUser.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: cors });
    }
    const callerUserId = claimsData.claims.sub as string;

    // Admin client for all operations
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Check platform_admin role
    const { data: roleCheck } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", callerUserId)
      .eq("role", "platform_admin")
      .maybeSingle();

    if (!roleCheck) {
      return new Response(JSON.stringify({ error: "Forbidden: platform_admin required" }), { status: 403, headers: cors });
    }

    // ── Parse body ───────────────────────────────────────────────────
    const { emails } = await req.json();
    if (!Array.isArray(emails) || emails.length === 0) {
      return new Response(JSON.stringify({ error: "emails array required" }), { status: 400, headers: cors });
    }

    const results: Record<string, unknown>[] = [];

    for (const email of emails) {
      const report: Record<string, unknown> = { email, steps: [] };

      // Resolve user from auth
      const { data: { users }, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

      if (listErr) {
        report.error = `Failed to list users: ${listErr.message}`;
        results.push(report);
        continue;
      }

      const user = users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (!user) {
        report.error = "User not found in auth.users";
        results.push(report);
        continue;
      }

      const userId = user.id;

      // ── Gate 2: Hardcoded protect-list ─────────────────────────────
      if (PROTECTED_USER_IDS.includes(userId)) {
        report.error = "BLOCKED: This user is on the hardcoded protect-list and cannot be deleted.";
        results.push(report);
        continue;
      }

      // Get tenant_id from profile (may be null if already cleaned)
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("active_tenant_id")
        .eq("id", userId)
        .maybeSingle();

      const tenantId = profile?.active_tenant_id;
      
      // If no profile/tenant found, just delete auth user and move on
      if (!tenantId) {
        const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
        report.steps = [{ table: "auth.users", deleted: deleteErr ? 0 : 1 }];
        report.success = !deleteErr;
        if (deleteErr) report.authDeleteError = deleteErr.message;
        report.note = "Profile/tenant already cleaned, only auth.users remaining";
        results.push(report);
        continue;
      }

      // ── Gate 3: Business data check ────────────────────────────────
      const bizTables = ["properties", "contacts", "documents", "finance_requests"];
      for (const table of bizTables) {
        const { count } = await supabaseAdmin
          .from(table)
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId);

        if (count && count > 0) {
          report.error = `BLOCKED: Tenant has ${count} rows in ${table}. Cannot delete.`;
          results.push(report);
          continue;
        }
      }
      if (report.error) {
        results.push(report);
        continue;
      }

      // ── Cascading delete ───────────────────────────────────────────
      const steps: { table: string; deleted: number }[] = [];

      // Step 0: household_persons (trigger-created, blocks org delete)
      const { count: c0 } = await supabaseAdmin
        .from("household_persons")
        .delete({ count: "exact" })
        .eq("tenant_id", tenantId);
      steps.push({ table: "household_persons", deleted: c0 ?? 0 });

      // Step 1: widget_preferences
      const { count: c1 } = await supabaseAdmin
        .from("widget_preferences")
        .delete({ count: "exact" })
        .eq("user_id", userId);
      steps.push({ table: "widget_preferences", deleted: c1 ?? 0 });

      // Step 2: inbound_mailboxes
      const { count: c2 } = await supabaseAdmin
        .from("inbound_mailboxes")
        .delete({ count: "exact" })
        .eq("tenant_id", tenantId);
      steps.push({ table: "inbound_mailboxes", deleted: c2 ?? 0 });

      // Step 3: storage_nodes
      const { count: c3 } = await supabaseAdmin
        .from("storage_nodes")
        .delete({ count: "exact" })
        .eq("tenant_id", tenantId);
      steps.push({ table: "storage_nodes", deleted: c3 ?? 0 });

      // Step 4: tenant_tile_activation
      const { count: c4 } = await supabaseAdmin
        .from("tenant_tile_activation")
        .delete({ count: "exact" })
        .eq("tenant_id", tenantId);
      steps.push({ table: "tenant_tile_activation", deleted: c4 ?? 0 });

      // Step 5: memberships
      const { count: c5 } = await supabaseAdmin
        .from("memberships")
        .delete({ count: "exact" })
        .eq("user_id", userId);
      steps.push({ table: "memberships", deleted: c5 ?? 0 });

      // Step 6: user_roles
      const { count: c6 } = await supabaseAdmin
        .from("user_roles")
        .delete({ count: "exact" })
        .eq("user_id", userId);
      steps.push({ table: "user_roles", deleted: c6 ?? 0 });

      // Step 7: data_event_ledger (blocks org delete via FK)
      const { count: c7a } = await supabaseAdmin
        .from("data_event_ledger")
        .delete({ count: "exact" })
        .eq("tenant_id", tenantId);
      steps.push({ table: "data_event_ledger", deleted: c7a ?? 0 });

      // DSGVO Ledger BEFORE deleting profile/org (tenant_id still valid)
      try {
        await logDataEvent(supabaseAdmin, {
          tenant_id: tenantId,
          zone: "Z1",
          actor_user_id: callerUserId,
          actor_role: "platform_admin",
          event_type: "account.cleanup_initiated",
          direction: "delete",
          source: "sot-cleanup-orphan-accounts",
          entity_type: "user",
          entity_id: userId,
          payload: { email },
        }, req);
      } catch (_) { /* fire-and-forget */ }

      // Step 8: Delete auth user FIRST — cascade may handle profile
      const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (deleteErr) {
        steps.push({ table: "auth.users (cascade attempt)", deleted: 0 });
        report.authDeleteNote = deleteErr.message;
      } else {
        steps.push({ table: "auth.users", deleted: 1 });
      }

      // Step 9: Clean up profile if still exists
      const { count: c7 } = await supabaseAdmin
        .from("profiles")
        .delete({ count: "exact" })
        .eq("id", userId);
      steps.push({ table: "profiles", deleted: c7 ?? 0 });

      // Step 10: Clean up any new ledger entries (from triggers)
      await supabaseAdmin
        .from("data_event_ledger")
        .delete()
        .eq("tenant_id", tenantId);

      // Step 11: organizations
      const { count: c8 } = await supabaseAdmin
        .from("organizations")
        .delete({ count: "exact" })
        .eq("id", tenantId);
      steps.push({ table: "organizations", deleted: c8 ?? 0 });

      report.steps = steps;
      report.tenantId = tenantId;
      report.userId = userId;
      report.success = true;

      results.push(report);
    }

    return new Response(JSON.stringify({ results }, null, 2), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
