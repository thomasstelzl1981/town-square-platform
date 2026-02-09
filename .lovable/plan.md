

# WhatsApp Integration — Analyse-Ergebnis

## Gesamtbewertung: Solide, 2 Fixes noetig

Die Implementierung ist zu 95% sauber. Es gibt **2 konkrete Probleme**, die behoben werden muessen, und **1 kosmetischen Punkt**.

---

## BEFUND 1 (KRITISCH): config.toml fehlt die 3 WhatsApp Edge Functions

Die 3 neuen Edge Functions (`sot-whatsapp-webhook`, `sot-whatsapp-send`, `sot-whatsapp-media`) sind **nicht** in `supabase/config.toml` eingetragen. Alle anderen 30+ Functions haben dort einen `[functions.xxx] verify_jwt = false` Eintrag. Ohne diesen Eintrag koennten die Functions beim Deployment Probleme machen.

**Fix:** 3 Eintraege in `supabase/config.toml` ergaenzen:
```toml
[functions.sot-whatsapp-webhook]
verify_jwt = false

[functions.sot-whatsapp-send]
verify_jwt = false

[functions.sot-whatsapp-media]
verify_jwt = false
```

---

## BEFUND 2 (MITTEL): `increment_field` RPC existiert nicht

Im Webhook (Zeile 174) wird `supabase.rpc("increment_field", ...)` aufgerufen. Diese Funktion existiert **nicht** in der Datenbank. Der Code hat zwar einen Fallback (`.catch()`), aber dieser Fallback ist fehlerhaft — er nutzt `conv.unread_count` das zu dem Zeitpunkt nicht aus dem Upsert-Result verfuegbar ist.

**Fix:** Den `increment_field`-Aufruf durch ein direktes SQL-Pattern ersetzen:
```typescript
// Statt RPC: Atomares Inkrement via raw update
await supabase
  .from("whatsapp_conversations")
  .update({ unread_count: (await supabase.from("whatsapp_conversations").select("unread_count").eq("id", conv.id).single()).data?.unread_count + 1 || 1 })
  .eq("id", conv.id);
```

Oder besser: Eine `increment_unread` RPC-Funktion in der naechsten Migration erstellen:
```sql
CREATE OR REPLACE FUNCTION public.increment_unread(conversation_uuid uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE whatsapp_conversations
  SET unread_count = COALESCE(unread_count, 0) + 1
  WHERE id = conversation_uuid;
$$;
```

---

## BEFUND 3 (KOSMETISCH): plan.md erwaehnt `deleted_at` das nicht existiert

Der Plan erwaehnt `deleted_at` Spalten fuer GDPR auf `whatsapp_messages` und `whatsapp_accounts`. Diese Spalten wurden in der Migration **nicht erstellt**. Das ist kein akutes Problem (GDPR-Loeschung ist Phase 3+), aber die Dokumentation sollte den Ist-Zustand widerspiegeln.

**Fix:** Entweder `deleted_at` Spalten nachtragen oder plan.md aktualisieren.

---

## Was KORREKT ist (Checkliste)

| Pruefpunkt | Status | Detail |
|------------|--------|--------|
| 6 Tabellen erstellt | OK | whatsapp_accounts, _user_settings, _conversations, _messages, _attachments, armstrong_command_events |
| RLS auf allen 6 Tabellen | OK | 18 Policies korrekt angelegt |
| Tenant-Isolation (get_user_tenant_id) | OK | Alle Policies nutzen die SECURITY DEFINER Funktion |
| User-Isolation (whatsapp_user_settings) | OK | user_id = auth.uid() zusaetzlich zu tenant_id |
| Indizes | OK | 8 Indizes auf die richtigen Spalten (tenant_id, conversation_id, wa_message_id) |
| Realtime auf whatsapp_messages | OK | In Migration enthalten |
| UNIQUE Constraints | OK | (tenant_id) auf accounts, (tenant_id, wa_contact_e164) auf conversations, (tenant_id, user_id) auf settings |
| Webhook: Meta Verify (GET) | OK | Token-Vergleich korrekt |
| Webhook: Inbound (POST) | OK | Tenant-Lookup, Upsert, Deduplizierung, Owner-Control Gate |
| Webhook: Return 200 bei Fehler | OK | Verhindert Meta-Webhook-Deaktivierung |
| Send: Auth + Tenant-Aufloesung | OK | Ueber Auth-Header oder Body-Parameter |
| Media: DMS-Ablage | OK | WhatsApp Eingang / YYYY-MM-DD / Dateiname |
| Media: Storage + storage_nodes | OK | Korrekte Verknuepfung |
| UI: Conversation List + Chat Thread | OK | Saubere 2-Spalten-Ansicht |
| UI: Owner-Control Pinning | OK | Sortierung + Star-Badge + Armstrong-Label |
| UI: Realtime Subscription | OK | INSERT + UPDATE Events |
| UI: Send Mutation via Edge Function | OK | supabase.functions.invoke korrekt |
| UI: WhatsApp Settings in ProfilTab | OK | Owner-Control Nr., Auto-Reply Toggle+Text, Webhook-Status |
| routesManifest.ts | OK | 6. Tile "whatsapp" in MOD-02 |
| armstrongManifest.ts | OK | WA_SEND_REPLY + WA_COMMAND_EXECUTE mit korrekten Metadaten |
| OfficePage.tsx | OK | Route + Import korrekt |
| office/index.ts | OK | Export WhatsAppTab |
| Auto-Reply Loop-Schutz | OK | 30-Minuten-Fenster im Webhook |
| Auto-Reply: Nicht fuer Owner-Control | OK | if (!isOwnerControl) Pruefung |

---

## Hinweis: deleted_at Spalten (Phase 3+)
Die GDPR-Spalten `deleted_at` auf `whatsapp_messages` und `whatsapp_accounts` werden in Phase 3+ nachgetragen. Aktuell nicht in der Migration enthalten.

---

## Umsetzungsplan (2 Schritte) — ERLEDIGT

### Schritt 1: config.toml aktualisieren
3 Function-Eintraege ergaenzen (verify_jwt = false fuer alle 3 WhatsApp Functions).

### Schritt 2: increment_field Fix im Webhook
Option A: Einfacher direkter Update (kein RPC noetig)
Option B: Neue `increment_unread` RPC-Funktion per Migration + Webhook-Code anpassen

Empfehlung: **Option A** (einfacher, kein neuer DB-Eintrag noetig).

### Optional Schritt 3: deleted_at in plan.md als "Phase 3+" markieren
Reine Dokumentationsanpassung.

---

## Zusammenfassung

| Befund | Schwere | Fix-Aufwand |
|--------|---------|-------------|
| config.toml fehlt 3 Functions | Kritisch | 1 Minute |
| increment_field RPC existiert nicht | Mittel | 5 Minuten |
| deleted_at Doku-Diskrepanz | Kosmetisch | 1 Minute |

Alles andere — Tabellen, RLS, Edge Functions, UI, Manifest, Realtime — ist **korrekt und konsistent** implementiert.

