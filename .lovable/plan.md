
# Zone 3 FutureRoom: Vollstaendige Finanzierungseinreichung mit zweistufigem Kunden-Flow

## Zusammenfassung

Die FutureRoom Website (Zone 3) erhaelt einen vollstaendigen Finanzierungs-Workflow. Der Kunde durchlaeuft einen klaren Stufenprozess mit zwei moeglichen Endpunkten. Zone 1 erhaelt eine erweiterte Submenue-Struktur.

---

## Kunden-Flow (zwei Pfade)

```text
WEBSITE-BESUCHER
       |
       v
[Finanzierung starten]  (oeffentlich, kein Login)
       |
       v
+------------------------------------------+
| SCHRITT 1: Schnellerfassung              |
| Kontaktdaten + Objektdaten + Eckdaten    |
| (erweitertes FutureRoomBonitat)          |
| + Finanzierungskalkulator                |
| + Ueberschlaegiges Angebot              |
| + Kapitaldienstfaehigkeit               |
+------------------------------------------+
       |
       v
+------------------------------------------+
| SCHRITT 2: ENTSCHEIDUNG                  |
|                                          |
| Option A: "Direkt absenden"              |
|   → Kontaktanfrage an Zone 1             |
|   → Kein Login noetig                    |
|   → Kein Datenbaum                       |
|   → Daten als Snapshot an Zone 1         |
|                                          |
| Option B: "Konto erstellen & Akte        |
|            selber pflegen"               |
|   → Login/Registrierung (E-Mail + PW)   |
|   → Selbstauskunft ausfuellen            |
|   → Datenbaum wird erzeugt              |
|   → Dokumente hochladen                 |
|   → Dann erst einreichen                |
+------------------------------------------+
```

### Option A: Schnelleinreichung (ohne Login)

- Kunde fuellt die erweiterte Bonitat-Seite aus (Kontakt, Objekt, Eckdaten, Kalkulator, Angebot, KDF)
- Klickt "Kontakt mit Finanzierungsmanager aufnehmen"
- System speichert alle Daten als JSON-Snapshot in `finance_requests` (Status: `submitted_to_zone1`, source: `zone3_quick`)
- Erstellt `finance_mandate` (Status: `new`)
- Kunde sieht Bestaetigungsseite mit Referenznummer
- Kein Login, kein Datenbaum, kein Dokument-Upload

### Option B: Vollstaendige Akte (mit Login)

- Kunde klickt "Konto erstellen und Akte selber pflegen"
- Registrierung mit E-Mail + Passwort (im FutureRoom-Design)
- Nach Login: Selbstauskunft ausfuellen (Sektionen 1-7)
- Datenbaum wird erzeugt (storage_nodes fuer MOD_07)
- Dokumente hochladen (StorageFileManager)
- Dann "Finanzierung einreichen" — erstellt Snapshot + Mandate
- Status: `submitted_to_zone1`, source: `zone3_website`
- Kunde kann Status verfolgen

---

## Teil 1: Erweitertes FutureRoomBonitat (Schritt 1 — oeffentlich)

### Aktuelle Struktur (4 Steps)

contact → property → income → summary

### Neue Struktur (6 Steps mit MOD-11 Kacheln)

```text
1. Kontakt        — Name, E-Mail, Telefon
2. Objekt          — FinanceObjectCard (Kaufy-Suche moeglich)
3. Eckdaten        — FinanceRequestCard (Kaufpreis, EK, Wunschrate)
4. Kalkulator      — FinanceCalculatorCard + FinanceOfferCard
5. Haushalt        — HouseholdCalculationCard (KDF)
6. Entscheidung    — Option A (Direkt absenden) oder Option B (Konto erstellen)
```

Alle Kacheln werden im FutureRoom-Design (Teal/Mint, Banking-Stil) gerendert. Die Daten werden im lokalen State gehalten bis zur Entscheidung.

### Aenderung in `FutureRoomBonitat.tsx`

Komplett neu aufgebaut mit den MOD-11 Komponenten, angepasst an das FR-Design. Die bestehende einfache Formular-Logik wird ersetzt.

---

## Teil 2: Login und geschuetzter Bereich (Option B)

### Neue Dateien

| Datei | Zweck |
|---|---|
| `src/pages/zone3/futureroom/FutureRoomLogin.tsx` | Login/Register im FR-Design (E-Mail + Passwort) |
| `src/pages/zone3/futureroom/FutureRoomAuthGuard.tsx` | Route-Guard fuer `/akte/*` |
| `src/pages/zone3/futureroom/FutureRoomAkte.tsx` | Geschuetzter Bereich: Selbstauskunft + Dokumente + Status |

### FutureRoomAkte.tsx — Interne Tabs

```text
[Selbstauskunft] [Dokumente] [Status]
```

- **Selbstauskunft**: SelbstauskunftFormV2 (Sektionen 1-7) — hier fuellt der Kunde seine permanente Selbstauskunft aus
- **Dokumente**: StorageFileManager (identisch zu MOD-07/MOD-11 Design, Spaltenansicht)
- **Status**: Tracking nach Einreichung (Referenznummer, aktueller Status, Kontaktdaten des zugewiesenen FM)

### Login-Trigger

Der Login wird erst dann ausgeloest, wenn der Kunde auf Option B klickt. Die bereits erfassten Daten (aus Schritt 1-5) werden im localStorage zwischengespeichert und nach dem Login in die Datenbank uebernommen.

---

## Teil 3: Edge Function fuer Schnelleinreichung (Option A)

### `supabase/functions/sot-futureroom-public-submit/index.ts`

- Erwartet KEINEN Auth-Token (oeffentlich aufrufbar)
- Empfaengt JSON mit Kontakt + Objekt + Eckdaten + Kalkulation + KDF
- Erstellt `finance_requests` (Status: `submitted_to_zone1`, source: `zone3_quick`)
- Speichert alle Daten in `applicant_snapshot` (JSONB)
- Erstellt `finance_mandates` (Status: `new`, source: `zone3_quick`)
- Gibt Referenznummer (public_id) zurueck
- Rate-Limiting: max 3 Einreichungen pro IP/Stunde

---

## Teil 4: Zone 1 FutureRoom Erweiterung

### Aktuelle Tabs (5 + 1 Vorlagen)

Inbox | Zuweisung | Manager | Bankkontakte | Monitoring | Vorlagen

### Neue Tabs (8 total)

```text
Inbox | Website-Leads | Zuweisung | Manager | Bankkontakte | Contracts | Monitoring | Vorlagen
```

| Neuer Tab | Zweck |
|---|---|
| **Website-Leads** | Eingehende Anfragen aus Zone 3 (source: `zone3_quick` und `zone3_website`), getrennt vom Portal-Inbox |
| **Contracts** | Mandatsvertraege, Lead-Uebernahme, Vertragsstatus |

### Aenderungen in `FutureRoomLayout.tsx` (Zone 1)

- TabsList auf 8 Tabs erweitern (grid-cols-8)
- `getActiveTab()` um `website-leads` und `contracts` ergaenzen
- Neues Badge fuer Website-Leads Anzahl

### Neue Dateien

| Datei | Zweck |
|---|---|
| `src/pages/admin/futureroom/FutureRoomWebLeads.tsx` | Tabelle der Website-Anfragen mit Quick-Preview und Zuweisungsfunktion |
| `src/pages/admin/futureroom/FutureRoomContracts.tsx` | Vertragsverwaltung und Lead-Uebersicht |

---

## Teil 5: Datenbank-Migration

### Neue Spalten

| Tabelle | Spalte | Typ | Zweck |
|---|---|---|---|
| `finance_requests` | `source` | `text DEFAULT 'portal'` | Herkunft: `portal`, `zone3_quick`, `zone3_website` |
| `finance_mandates` | `source` | `text DEFAULT 'portal'` | Gleiche Herkunft fuer Filterung in Zone 1 |

### RLS-Anpassungen

- Neue Policy fuer `finance_requests`: Oeffentliches INSERT ueber Edge Function (service_role)
- Bestehende Policies bleiben unveraendert

---

## Teil 6: Navigation Zone 3 (FutureRoomLayout.tsx)

### Dynamische Navigation

| Label | Href | Sichtbarkeit |
|---|---|---|
| Start | `/website/futureroom` | Immer |
| Finanzierung starten | `/website/futureroom/bonitat` | Immer |
| Meine Finanzierung | `/website/futureroom/akte` | Nur eingeloggt |
| FM werden | `/website/futureroom/karriere` | Immer |
| FAQ | `/website/futureroom/faq` | Immer |

### CTA-Button

- Nicht eingeloggt: "Jetzt starten" → `/bonitat`
- Eingeloggt: "Meine Akte" → `/akte`
- Neuer Login/Logout Button im Header

---

## Teil 7: Routen-Manifest Updates

### Zone 3 (website)

```text
futureroom: {
  routes: [
    { path: "", component: "FutureRoomHome" },
    { path: "bonitat", component: "FutureRoomBonitat" },
    { path: "karriere", component: "FutureRoomKarriere" },
    { path: "faq", component: "FutureRoomFAQ" },
    { path: "login", component: "FutureRoomLogin" },             // NEU
    { path: "akte", component: "FutureRoomAkte" },                // NEU (geschuetzt)
  ],
}
```

### Zone 1 (admin)

```text
futureroom: [
  ...,
  { path: "futureroom/website-leads", component: "FutureRoomWebLeads" },    // NEU
  { path: "futureroom/contracts", component: "FutureRoomContracts" },        // NEU
]
```

---

## Zusammenfassung aller Dateien

| Datei | Typ | Aenderung |
|---|---|---|
| SQL Migration | Neu | `source` Spalte in `finance_requests` + `finance_mandates` |
| `sot-futureroom-public-submit/index.ts` | Neu | Edge Function fuer Schnelleinreichung (Option A) |
| `FutureRoomBonitat.tsx` | Umbau | 6-Schritte-Wizard mit MOD-11 Kacheln + Entscheidungsseite |
| `FutureRoomLogin.tsx` | Neu | Login/Register im FR-Design |
| `FutureRoomAuthGuard.tsx` | Neu | Auth-Schutz fuer Akte-Bereich |
| `FutureRoomAkte.tsx` | Neu | Geschuetzter Bereich: Selbstauskunft, Dokumente, Status |
| `FutureRoomLayout.tsx` (Zone 3) | Edit | Dynamische Nav, Auth-State, Login/Logout |
| `FutureRoomHome.tsx` | Edit | Dynamische CTAs basierend auf Auth-State |
| `FutureRoomLayout.tsx` (Zone 1) | Edit | 8 Tabs, neue Badges |
| `FutureRoomWebLeads.tsx` | Neu | Website-Anfragen Inbox in Zone 1 |
| `FutureRoomContracts.tsx` | Neu | Vertragsverwaltung in Zone 1 |
| `routesManifest.ts` | Edit | Neue Routen Zone 1 + Zone 3 |
