

# Postservice — Goldener Pfad: Bestellung, Einrichtung, Zustellung

## Ueberblick: Was passiert hier?

Der Postservice ist ein digitaler Nachsendeauftrag. Ein Nutzer bestellt ihn in seinem DMS, ein Admin richtet ihn ein, und ab dann wird eingehende Post automatisch in das digitale Postfach des Nutzers zugestellt.

**Wichtig — zwei Klarstellungen vom Auftraggeber:**
1. Die Zuordnung erfolgt ueber die **Tenant-ID** (nicht per E-Mail-Adresse). Jeder Tenant hat eine eindeutige Postfach-Nummer, die von Anfang an existiert — die Tenant-ID selbst.
2. **Billing/Credit-Ledger wird notiert, aber nicht in diesem Sprint gebaut.** Es existieren bereits `armstrong_billing_events`, `billing_usage` und `valuation_credits` als Billing-Grundlage. Die Postservice-Kosten werden dort spaeter integriert.

---

## Der Goldene Pfad — Schritt fuer Schritt

### Schritt 1: Nutzer bestellt den Postservice

**Wo:** Zone 2, DMS, Reiter "Einstellungen"

Der Nutzer oeffnet seine DMS-Einstellungen. Dort sieht er drei Kacheln:

| Kachel | Beschreibung |
|--------|-------------|
| **Speicherplatz** | Wie viel Platz ist belegt, Upgrade-Option |
| **Digitaler Postservice** | Nachsendeauftrag bestellen oder Status einsehen |
| **Dokumenten-Auslesung** | OCR/KI-Extraktion ein-/ausschalten |

Er klickt auf "Digitaler Postservice" und sieht ein Bestellformular:
- Seine Adresse (vorbelegt aus dem Profil)
- Kostenhinweis: "30 Credits/Monat, Mindestlaufzeit 12 Monate"
- Button "Auftrag einreichen"

Nach dem Absenden sieht er: **"Auftrag eingereicht — Einrichtung erfolgt durch den Administrator."**

Was im Hintergrund passiert: Ein neuer Datensatz in `postservice_mandates` wird erstellt mit `status = 'requested'` und der `tenant_id` des Nutzers.

---

### Schritt 2: Admin sieht den Auftrag in Zone 1

**Wo:** Zone 1, /admin/inbox, neuer Tab "Auftraege"

Der Admin oeffnet den Inbox-Bereich. Statt bisher 2 Tabs gibt es jetzt 3:

| Tab | Inhalt |
|-----|--------|
| **Posteingang** | Eingehende Post — jedes Stueck mit ID, Datum, Uhrzeit, Empfaenger |
| **Routing-Regeln** | Regeln, die bestimmen wohin Post automatisch zugestellt wird |
| **Auftraege** | Alle Mandate/Bestellungen aus Zone 2 |

Im Tab "Auftraege" erscheint der neue Auftrag mit Status "Eingereicht" (gelbe Badge).

---

### Schritt 3: Admin richtet den Postservice ein

Der Admin oeffnet den Auftrag und:
1. Setzt den Status auf **"In Bearbeitung"** (blaue Badge)
2. Prueft die Daten (Adresse, Tenant-Name)
3. Klickt **"Routing-Regel anlegen"** — das System erstellt automatisch eine Regel:
   - Empfaenger-Kriterium: Tenant-ID des Bestellers
   - Ziel: DMS-Posteingang dieses Tenants in Zone 2
4. Setzt den Status auf **"Aktiv"** (gruene Badge)

Ab diesem Moment ist der Postservice aktiv. Jede Post, die in Zone 1 fuer diese Tenant-ID eingeht, wird automatisch weitergeleitet.

---

### Schritt 4: Post kommt an und wird zugestellt

Eingehende Post (gescannt oder digital) landet im Zone-1-Posteingang. Der Admin sieht pro Eintrag:

| Spalte | Beschreibung |
|--------|-------------|
| ID | Eindeutige Kennung |
| Datum | Eingangsdatum |
| Uhrzeit | Eingangszeit |
| Empfaenger | Tenant-ID / Tenant-Name |

Das System prueft automatisch: "Gibt es eine aktive Routing-Regel fuer diesen Empfaenger?"
- **Ja:** Post wird automatisch in den DMS-Posteingang des Nutzers in Zone 2 kopiert. Status wechselt zu "Zugestellt".
- **Nein:** Admin kann manuell zuweisen (wie bisher).

---

### Schritt 5: Nutzer sieht die Post in Zone 2

Der Nutzer oeffnet seinen DMS-Posteingang und sieht die zugestellten Dokumente — genau wie heute schon E-Mail-Anhaenge dort erscheinen.

Optional kann er:
- **Dokumenten-Auslesung** starten (wenn in Einstellungen aktiviert)
- Im **Sortieren**-Tab Dokumente den richtigen Ordnern zuordnen

---

## Was sich technisch aendert

### 1. Datenbank-Migration

**Neue Tabelle: `postservice_mandates`**

Speichert alle Nachsendeauftraege:

| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| id | UUID | Primaerschluessel |
| tenant_id | UUID | Wer hat bestellt |
| requested_by_user_id | UUID | Welcher User hat bestellt |
| type | TEXT | 'postservice_forwarding' |
| status | TEXT | requested / setup_in_progress / active / paused / cancelled |
| contract_terms | JSONB | { duration_months: 12, monthly_credits: 30 } |
| payload_json | JSONB | Adresse, Startdatum etc. |
| notes | TEXT | Admin-Notizen |
| created_at / updated_at | TIMESTAMPTZ | Zeitstempel |

RLS: Platform-Admins voller Zugriff; Nutzer sehen nur eigene Mandate.

**Aenderungen an `inbound_routing_rules`:**
- Neue Spalte `mandate_id` (UUID, nullable) — Verknuepfung zum Mandat
- Neue Spalte `target_tenant_id` (UUID, nullable) — Ziel-Tenant fuer Zone-2-Zustellung

**Aenderungen an `inbound_items`:**
- Neue Spalte `mandate_id` (UUID, nullable)
- Neue Spalte `routed_to_zone2_at` (TIMESTAMPTZ, nullable) — Zeitstempel der Zustellung

**Kein neuer Credit-Ledger.** Die bestehenden Tabellen `armstrong_billing_events` und `billing_usage` werden spaeter um Postservice-Eintraege erweitert. Das Kostenmodell (30 Credits/Monat, 3 Credits/Brief, 1 Credit/OCR) wird als Notiz dokumentiert, aber in diesem Sprint nicht implementiert.

### 2. Zone 1 — Inbox.tsx erweitern (3 Tabs)

**Tab "Posteingang" (bestehend, angepasst):**
- Tabellen-Spalten vereinfacht auf: ID, Datum, Uhrzeit, Empfaenger (Tenant-Name)
- Neuer Button "Routen" bei offenen Eintraegen — fuehrt die Zustellung an Zone 2 durch
- Routing-Logik: Prueft `inbound_routing_rules` nach passender Tenant-ID, erstellt Dokument + Link in Zone 2 DMS

**Tab "Routing-Regeln" (bestehend, erweitert):**
- CRUD-Funktionalitaet: Erstellen, Bearbeiten, Loeschen von Regeln
- Formular: Name, Ziel-Tenant (Dropdown), Mandat-Verknuepfung (optional), Aktiv/Inaktiv Toggle

**Tab "Auftraege" (neu):**
- Tabelle aller `postservice_mandates`
- Pro Zeile: Status-Badge, Tenant-Name, Typ, Erstellt am
- Detail-Dialog: Status aendern, Notizen, Button "Routing-Regel anlegen"

### 3. Zone 2 — EinstellungenTab.tsx umbauen (3 Kacheln)

Die bestehenden 3 Kacheln (Extraktion, Cloud-Connectors, Speicher) werden ersetzt durch:

**Kachel A: Speicherplatz** — wie bisher (Fortschrittsbalken, 5 GB frei)

**Kachel B: Digitaler Postservice** (neu)
- Ohne aktives Mandat: Bestellformular (Adresse, Laufzeit, Kosten-Info, Button "Einreichen")
- Mit Mandat: Status-Anzeige (requested/setup_in_progress/active) + Widerrufs-Button

**Kachel C: Dokumenten-Auslesung** (umbenannt von "Extraktion")
- Toggle wie bisher
- Zusaetzlicher Hinweis "1 Credit pro Dokument"

### 4. Routing-Engine (src/lib/postRouting.ts, neu)

Hilfsfunktionen fuer die Zustellung:
- `matchRoutingRule(tenantId, rules)` — findet passende Regel anhand der Tenant-ID
- `routeToZone2(inboundItemId, targetTenantId)` — erstellt Dokument + document_link im DMS-Posteingang des Ziel-Tenants, setzt `routed_to_zone2_at`

### 5. Sortieren-Tab Gate (src/pages/portal/dms/SortierenTab.tsx)

- Prueft ob Dokumenten-Auslesung aktiviert ist
- Wenn nein: Zeigt Hinweis "Bitte aktiviere die Dokumenten-Auslesung in den Einstellungen"

### Dateien-Uebersicht

| Datei | Art der Aenderung |
|-------|-------------------|
| SQL Migration | 1 neue Tabelle + ALTER auf 2 bestehende |
| `src/pages/admin/Inbox.tsx` | Erweitern: 3 Tabs, CRUD, Routing-Button |
| `src/pages/portal/dms/EinstellungenTab.tsx` | Umbauen: 3 Kacheln (Speicher, Postservice, OCR) |
| `src/lib/postRouting.ts` | Neu: Routing-Engine |
| `src/pages/portal/dms/SortierenTab.tsx` | Aendern: Gate fuer OCR-Aktivierung |

### Umsetzungsreihenfolge

1. Datenbank-Migration (neue Tabelle + Spalten)
2. Zone 1 Inbox erweitern (3 Tabs + Auftraege + Routing-CRUD)
3. Zone 2 Einstellungen umbauen (3 Kacheln + Bestellformular)
4. Routing-Engine + Zustellungslogik
5. Sortieren-Tab Gate

