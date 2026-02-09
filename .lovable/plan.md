

# Armstrong WhatsApp-Befehlsausfuehrung — Korrekturplan

---

## Befund: 3 Probleme identifiziert

### Problem 1: MOD-00 Widget-Actions fordern unnoetig Bestaetigung

Alle 5 Dashboard-Widget-Actions (`CREATE_REMINDER`, `CREATE_NOTE`, `CREATE_IDEA`, `CREATE_PROJECT`, `CREATE_TASK`) haben aktuell `execution_mode: 'execute_with_confirmation'`.

Das widerspricht der Anforderung: **Interne Aktionen sollen sofort ausgefuehrt werden, ohne Bestaetigung.** Eine Notiz erstellen, eine Erinnerung anlegen — das sind risikolose interne Operationen. Armstrong soll das einfach tun.

**Fix:** Diese 5 Actions auf `execution_mode: 'execute'` aendern. Das ist K3-konform, weil:
- `risk_level: 'low'` (erfuellt)
- `cost_model: 'free'` (erfuellt)
- `data_scopes_write: ['widgets']` — technisch ein Write, aber rein intern. Keine externen Konsequenzen.

Die K3-Regel wird um einen Kommentar ergaenzt: interne Widget-Writes gelten nicht als schutzbeduerftiger Schreibzugriff.

### Problem 2: `WA_COMMAND_EXECUTE` hat `execution_mode: 'draft_only'`

Das bedeutet: Armstrong darf via WhatsApp **nur Entwuerfe erstellen, nie ausfuehren**. Das ist zu restriktiv.

**Fix:** `execution_mode` auf `'execute'` aendern und `risk_level` auf `'low'`. Die Logik wird stattdessen im Runtime entschieden:
- Befehl ergibt interne Aktion (Widget, Notiz, Erinnerung)? → **Sofort ausfuehren**
- Befehl ergibt externe Aktion (Brief senden, E-Mail schicken)? → **Widget/Aufgabe erstellen zur manuellen Freigabe im Portal**

Die Entscheidung trifft nicht der Manifest-Eintrag, sondern die Armstrong Command Pipeline anhand der `side_effects` der Ziel-Aktion.

### Problem 3: Dashboard-Widgets sind Demodaten ohne DB-Persistenz

`PortalDashboard.tsx` (Zeile 68) verwendet `useState(DEMO_TASK_WIDGETS)` — hardcodierte Testdaten. Es gibt **keine `task_widgets` Tabelle** in der Datenbank. Nur `widget_preferences` (fuer System-Widgets wie Wetter/Globus).

Das bedeutet: Selbst wenn Armstrong via WhatsApp einen Befehl bekommt und ein Widget erstellen will, gibt es keinen Ort, um es zu persistieren. Nach einem Page-Refresh waeren alle erstellten Widgets weg.

**Fix:** Neue Tabelle `task_widgets` erstellen:

```text
task_widgets
├── id (uuid, PK)
├── tenant_id (uuid, FK tenants)
├── user_id (uuid, FK auth.users)
├── type (text: letter|email|reminder|task|research|note|project|idea)
├── title (text)
├── description (text, nullable)
├── status (text: pending|executing|completed|cancelled)
├── risk_level (text: low|medium|high)
├── cost_model (text: free|metered|premium)
├── action_code (text, nullable — Referenz auf armstrongManifest)
├── parameters (jsonb, nullable)
├── source (text: chat|whatsapp|system)
├── source_ref (uuid, nullable — z.B. armstrong_command_events.id)
├── completed_at (timestamptz, nullable)
├── created_at (timestamptz)
└── updated_at (timestamptz)
```

RLS: Tenant-Isolation via `get_user_tenant_id()` + Realtime fuer Live-Updates auf dem Dashboard.

---

## Aenderungsplan (4 Schritte)

### Schritt 1: DB-Migration — `task_widgets` Tabelle

Neue Tabelle mit RLS-Policies (tenant_isolation + user-level fuer eigene Widgets), Indizes, und Realtime.

### Schritt 2: armstrongManifest.ts — execution_mode korrigieren

| Action | Vorher | Nachher |
|--------|--------|---------|
| `ARM.MOD00.CREATE_REMINDER` | `execute_with_confirmation` | `execute` |
| `ARM.MOD00.CREATE_NOTE` | `execute_with_confirmation` | `execute` |
| `ARM.MOD00.CREATE_IDEA` | `execute_with_confirmation` | `execute` |
| `ARM.MOD00.CREATE_PROJECT` | `execute_with_confirmation` | `execute` |
| `ARM.MOD00.CREATE_TASK` | `execute_with_confirmation` | `execute` |
| `ARM.MOD02.WA_COMMAND_EXECUTE` | `draft_only` | `execute` |

Zusaetzlich: K3-Kommentar aktualisieren, dass interne Widget-Writes erlaubt sind.

### Schritt 3: PortalDashboard.tsx — DB statt Demodaten

- `DEMO_TASK_WIDGETS` entfernen
- Neuer Hook `useTaskWidgets()` der aus `task_widgets` Tabelle liest
- Realtime-Subscription fuer neue Widgets (Armstrong erstellt Widget → erscheint sofort auf Dashboard)
- `handleConfirm` und `handleCancel` schreiben in die DB statt in lokalen State

### Schritt 4: Webhook Command Pipeline — Sofort-Ausfuehrung

Im `sot-whatsapp-webhook` den `armstrong_command_events`-Insert ergaenzen:
- Bei internen Actions (keine `sends_external_communication` in side_effects): Status direkt auf `'completed'` setzen + Widget in `task_widgets` erstellen
- Bei externen Actions: Status auf `'planned'` + Widget mit `status: 'pending'` erstellen (erfordert manuelle Freigabe im Portal)

---

## Entscheidungslogik (Runtime)

```text
WhatsApp Owner-Control Nachricht eingehend
    │
    ▼
Armstrong erkennt Intent → mappt auf action_code
    │
    ▼
Lookup action in armstrongManifest
    │
    ├── side_effects enthält 'sends_external_communication'?
    │       │
    │       ├── JA → Widget mit status='pending' erstellen
    │       │         (User muss im Portal bestaetigen)
    │       │
    │       └── NEIN → Widget mit status='completed' erstellen
    │                   (sofort ausgefuehrt, Armstrong meldet Erfolg via WhatsApp)
    │
    ▼
armstrong_command_events loggen (Audit/Billing)
```

---

## Dateien die geaendert werden

| Datei | Aktion |
|-------|--------|
| DB Migration (neu) | `task_widgets` Tabelle + RLS + Indizes + Realtime |
| `src/manifests/armstrongManifest.ts` | 6 Actions execution_mode aendern |
| `src/pages/portal/PortalDashboard.tsx` | DB-Hook statt DEMO_TASK_WIDGETS |
| `src/hooks/useTaskWidgets.ts` | NEU: CRUD + Realtime fuer task_widgets |
| `src/types/widget.ts` | DEMO_TASK_WIDGETS entfernen |
| `supabase/functions/sot-whatsapp-webhook/index.ts` | Command Pipeline mit Sofort-Ausfuehrung |

