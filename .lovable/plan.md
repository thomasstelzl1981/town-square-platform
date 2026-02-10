
# Phase 1: Globaler Outbound-Mail-Fundament-Baustein

## Zusammenfassung

Dieser Plan implementiert eine zentrale Outbound-E-Mail-Identitaet pro User, verankert im Profil (MOD-01) und genutzt von allen Outbound-Features in Zone 2. Resend bleibt die Versandinfrastruktur, aber die sichtbare Absenderadresse ("From") kommt aus der Profil-Outbound-Kennung.

---

## Architektur-Uebersicht

```text
+-------------------------------------------------------------------+
|  PROFIL (MOD-01)                                                  |
|  +-------------------------------------------------------------+  |
|  | Outbound-Widget (NEU)                                       |  |
|  | - Brand-Dropdown (gefiltert nach Rolle)                     |  |
|  | - From-Email (readonly, aus Brand-Preset)                   |  |
|  | - Display-Name (editierbar)                                 |  |
|  | - Info-Text                                                 |  |
|  +-------------------------------------------------------------+  |
+-------------------------------------------------------------------+
         |
         v
+-------------------------------------------------------------------+
|  DB: user_outbound_identities                                     |
|  user_id | brand_key | from_email | display_name | is_active      |
+-------------------------------------------------------------------+
         |
         v
+-------------------------------------------------------------------+
|  Edge Function: sot-system-mail-send (NEU)                        |
|  - Laedt Active Outbound Identity                                 |
|  - Setzt From + Reply-To                                          |
|  - Sendet via Resend API                                          |
+-------------------------------------------------------------------+
         |
         v
+-------------------------------------------------------------------+
|  Bestehende Features (Refactor):                                  |
|  - sot-renovation-outbound -> nutzt sot-system-mail-send          |
|  - Serien-E-Mail (MOD-14) -> nutzt sot-system-mail-send           |
+-------------------------------------------------------------------+
```

---

## Schritt 1: Datenbank-Migration

### 1a. Tabelle `user_outbound_identities`

```sql
CREATE TABLE public.user_outbound_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_key TEXT NOT NULL,
  from_email TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Nur eine aktive Identity pro User
CREATE UNIQUE INDEX idx_user_outbound_active 
  ON public.user_outbound_identities (user_id) 
  WHERE is_active = true;

-- RLS
ALTER TABLE public.user_outbound_identities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own outbound identity"
  ON public.user_outbound_identities FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own outbound identity"
  ON public.user_outbound_identities FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own outbound identity"
  ON public.user_outbound_identities FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role full access"
  ON public.user_outbound_identities FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

### 1b. RPC-Funktion fuer Edge Functions

```sql
CREATE OR REPLACE FUNCTION public.get_active_outbound_identity(p_user_id UUID)
RETURNS TABLE(brand_key TEXT, from_email TEXT, display_name TEXT)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT brand_key, from_email, display_name
  FROM public.user_outbound_identities
  WHERE user_id = p_user_id AND is_active = true
  LIMIT 1;
$$;
```

---

## Schritt 2: Brand-Konfiguration (Frontend-Konstante)

Neue Datei: `src/config/outboundBrands.ts`

Definiert:
- `OUTBOUND_BRANDS`: Array mit brand_key, label, domain, default_from_template
- `ROLE_TO_ALLOWED_BRANDS`: Mapping von app_role/org_role auf erlaubte brand_keys
- `ROLE_TO_DEFAULT_BRAND`: Default-Brand pro Rolle

Konkrete Brands:
| brand_key | Label | Domain | Rollen |
|-----------|-------|--------|--------|
| SOT | System of a Town | systemofatown.com | user (default), alle |
| KAUFY | Kaufy | kaufi.de | sales_partner |
| ACQUIARY | Acquiary | acquiary.com | akquise_manager |
| FUTUREROOM | FutureRoom | futureroom.de | finance_manager |

Logik: User sieht nur Brands, die seiner Rolle entsprechen. Hat ein User mehrere Rollen (z.B. user + sales_partner), sieht er die Union.

---

## Schritt 3: UI — Outbound-Widget im Profil (ProfilTab.tsx)

Neues `OutboundWidget` als `ProfileWidget` in der bestehenden ProfilTab-Seite, platziert zwischen "E-Mail-Signatur" und "Briefkopf-Daten".

Elemente:
- **Select/Dropdown**: "Outbound-Kennung" — zeigt nur erlaubte brand_keys (gefiltert ueber Rollen-Query)
- **Readonly Input**: "Absender E-Mail" — automatisch aus Brand-Preset (z.B. `vorname.nachname@kaufi.de`)
- **Editierbares Input**: "Anzeigename" — frei editierbar
- **Info-Box**: Erklaerungstext zum Outbound-Verhalten
- **Speichern-Button**: Upsert in `user_outbound_identities`

Die Rollen werden ueber eine Query auf `user_roles` UND `organization_members` geholt, dann gegen `ROLE_TO_ALLOWED_BRANDS` gefiltert.

---

## Schritt 4: Edge Function — `sot-system-mail-send`

Neue zentrale Edge Function fuer alle System-Outbound-E-Mails.

Ablauf:
1. Auth-Check (Bearer Token)
2. Lade aktive Outbound Identity via `get_active_outbound_identity(user_id)`
3. Fallback: Falls keine Identity, nutze SOT-Default
4. Sende via Resend API mit:
   - `from`: `"${display_name} <${from_email}>"` (Resend unterstuetzt custom From)
   - `reply_to`: `from_email`
   - `to`, `subject`, `html`/`text` aus Request-Body
5. Return success/error

Request-Interface:
```text
{
  to: string | string[],
  subject: string,
  html?: string,
  text?: string,
  context?: string  // z.B. "renovation_tender", "serien_email"
}
```

---

## Schritt 5: Refactor bestehender Outbound-Features

### 5a. `sot-renovation-outbound`

Aktuell: Hardcoded `from: 'Ausschreibung <noreply@systemofatown.de>'`

Aenderung: Statt direkt Resend aufzurufen, laedt die Function die aktive Outbound Identity des sendenden Users und setzt From/Reply-To entsprechend. Die Resend-Logik bleibt in dieser Function (kein Aufruf von sot-system-mail-send aus einer Edge Function heraus), aber die Identity-Aufloesung wird identisch.

### 5b. Frontend-Caller (TenderDraftPanel.tsx)

Keine Aenderung notwendig — der Edge-Function-Call bleibt gleich, die From-Adresse wird serverseitig aufgeloest.

---

## Schritt 6: Auto-Provisioning (Konzept-Ready)

Bei Registrierung oder erstem Login ohne Outbound Identity:
- ProfilTab prueft ob `user_outbound_identities` leer ist
- Falls ja: Auto-Insert mit Default-Brand basierend auf Rolle
- From-Email wird aus Template generiert: `vorname.nachname@domain`
- Display-Name wird aus Profil uebernommen

Dies wird im Frontend (ProfilTab/OutboundWidget) als Auto-Init implementiert, NICHT als Trigger.

---

## Dateien-Uebersicht

| Aktion | Datei | Beschreibung |
|--------|-------|--------------|
| NEU | `src/config/outboundBrands.ts` | Brand-Config + Rollen-Mapping |
| NEU | `supabase/functions/sot-system-mail-send/index.ts` | Zentrale Outbound-Edge-Function |
| EDIT | `src/pages/portal/stammdaten/ProfilTab.tsx` | OutboundWidget hinzufuegen |
| EDIT | `supabase/functions/sot-renovation-outbound/index.ts` | From-Adresse aus Outbound Identity laden |
| DB | Migration | Tabelle + RLS + RPC |

---

## Nicht enthalten (explizit ausgeschlossen)

- Inbox-Tracking / Follow-up-Automatisierung
- Provider-Integration (Google Workspace / Microsoft) fuer Mailbox-Provisioning
- Neue Routen oder Manifest-Aenderungen
- Zone 1 Admin Provisioning-UI
- Aenderungen an MOD-04/MOD-08

---

## Abnahmekriterien

1. Profil hat neuen Bereich "Outbound" mit Brand-Auswahl und Speicherung
2. Rollen-Gating: User sieht nur erlaubte Brands (SOT fuer Standard, KAUFY fuer sales_partner, etc.)
3. DB-Constraint: genau eine aktive Outbound Identity pro User
4. sot-renovation-outbound nutzt die gespeicherte Outbound Identity
5. Zentrale sot-system-mail-send Edge Function existiert und ist einsatzbereit
6. Keine neuen Routen, kein Manifest-Drift
