

# MOD-13 Vertrieb: Verkaufsauftrag-Flow nach MOD-04 Vorbild

## Problem

Die aktuelle `SalesApprovalSection` (83 Zeilen) ist ein simples 3-Karten-Layout mit einem einzelnen Button "An Sales Desk senden". Es fehlt der komplette Verkaufsauftrag-Flow, wie er in MOD-04 (`VerkaufsauftragTab.tsx`, 717 Zeilen) implementiert ist:

- Kein expandierendes Agreement-Panel
- Keine Checkboxen fuer Vereinbarungen
- Kein Provisions-Slider
- Kein Consent-Logging in `user_consents` / `agreement_templates`
- Keine Projektdaten-Zusammenfassung zur Bestaetigung
- Kein Widerrufs-Flow

## Was MOD-04 genau macht (Referenz)

Wenn der User in MOD-04 den Switch "Vermarktung aktivieren" anklickt:

1. Ein Panel expandiert mit:
   - **Objektdaten-Box**: Adresse + Kaufpreis (read-only Zusammenfassung)
   - **Provisions-Slider**: 3-15% netto, Brutto-Anzeige inkl. MwSt.
   - **3 Checkboxen** (alle muessen gesetzt sein):
     - "Ich bestaetige die Richtigkeit aller Angaben im Expose." (DATA_ACCURACY_CONSENT)
     - "Ich erteile den Verkaufsauftrag gemaess den AGB." (SALES_MANDATE_V2)
     - "Ich akzeptiere die Systemgebuehr von 2.000 EUR netto bei erfolgreichem Abschluss." (SYSTEM_SUCCESS_FEE)
   - **Buttons**: "Abbrechen" + "Vermarktung aktivieren" (disabled bis alle Checkboxen gesetzt)

2. Bei Klick auf "Vermarktung aktivieren":
   - Listing wird erstellt/aktiviert in `listings`
   - `public_id` wird generiert
   - `listing_publications` Eintrag fuer `partner_network` wird erstellt
   - `property_features` wird auf `status: active` gesetzt
   - **3 Consents werden geloggt**: Fuer jeden Template-Code wird aus `agreement_templates` die aktive Version geholt und ein `user_consents`-Eintrag erstellt mit `tenant_id`, `user_id`, `template_id`, `template_version`, `status: accepted`, `consented_at`

3. Diese Consents erscheinen dann in Zone 1 unter "Vertraege & Vereinbarungen" (`VertraegeTab.tsx`) und koennen dort auditiert werden.

## Adaptation fuer MOD-13

Der Flow wird fuer Projekte (statt Einzelimmobilien) adaptiert:

### Expandierendes Panel — Inhalt

Wenn der User "Vertrieb aktivieren" anklickt, expandiert ein Panel:

```text
┌─────────────────────────────────────────────────┐
│  VEREINBARUNG ZUR PROJEKTVERMARKTUNG            │
│                                                 │
│  Mit der Aktivierung erteilen Sie den Auftrag,  │
│  dieses Projekt ueber unser Vertriebsnetzwerk   │
│  zu vermarkten.                                 │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │  PROJEKTDATEN                           │    │
│  │  Projekt: Residenz am Stadtpark         │    │
│  │  Adresse: Am Stadtpark 12, 80331 Mue.   │    │
│  │  Einheiten: 24 WE                       │    │
│  │  Projektvolumen: 7.200.000 EUR          │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  Kaeufer-Provision: ████████░░░░░  7,0% netto   │
│  Brutto: 8,33% inkl. MwSt.                     │
│                                                 │
│  ☐ Ich bestaetige die Richtigkeit aller         │
│    Projektdaten und der Preisliste.             │
│                                                 │
│  ☐ Ich erteile den Vertriebsauftrag gemaess    │
│    den Allgemeinen Geschaeftsbedingungen.       │
│                                                 │
│  ☐ Ich akzeptiere die Systemgebuehr von         │
│    2.000 EUR netto pro verkaufter Einheit.      │
│                                                 │
│  [Abbrechen]   [Vertrieb aktivieren]            │
│                (disabled bis alle ☑)            │
└─────────────────────────────────────────────────┘
```

### Aktivierungs-Logik (was bei Klick passiert)

1. **`sales_desk_requests` Insert** — mit `project_id`, `tenant_id`, `requested_by`, `commission_agreement: { rate: 7.0, gross: 8.33 }`
2. **Consent-Logging** — Fuer jeden der 3 Template-Codes (`SALES_MANDATE_V2`, `DATA_ACCURACY_CONSENT`, `SYSTEM_SUCCESS_FEE`):
   - `agreement_templates` abfragen (aktive Version holen)
   - `user_consents` Insert mit `tenant_id`, `user_id`, `template_id`, `template_version`, `status: accepted`, `consented_at`
3. **Toast**: "Vertriebsauftrag erteilt — Freigabe durch Sales Desk ausstehend"
4. **Status wechselt auf "Ausstehend"** (pending) — Projekt wartet auf Zone 1

### Consent-Audit-Trail

Die geloggten Consents erscheinen:
- In Zone 1 unter `/admin/agreements` (bestehende `Agreements.tsx` liest `user_consents`)
- Beim User unter Stammdaten > Vertraege (bestehende `VertraegeTab.tsx` liest `user_consents`)

### Nach Zone 1 Approval

Wenn `sales_desk_requests.status` auf `approved` wechselt:
- Vertriebskanaele werden freigeschaltet (Switch-Toggles fuer Partnernetzwerk, Kaufy, Landingpage)
- Jeder Kanal ist ein eigener Toggle (analog zu MOD-04 `kaufy_sichtbarkeit`)

### Widerrufs-Flow

Switch zurueck auf "aus":
- `sales_desk_requests.status` wird auf `withdrawn` gesetzt
- Abhaengige Kanaele werden deaktiviert
- Toast: "Vertriebsauftrag widerrufen"

---

## Aenderungen — Datei fuer Datei

### 1. `src/pages/portal/projekte/VertriebTab.tsx`

- "Projekt-Status"-Karte entfernen
- `isDemo` Prop von SalesApprovalSection entfernen
- Neue Props an SalesApprovalSection durchreichen: `projectAddress`, `totalUnits`, `projectVolume`

### 2. `src/components/projekte/SalesApprovalSection.tsx` (komplett neu)

Ersetzt die bisherigen 186 Zeilen durch den vollstaendigen Verkaufsauftrag-Flow:

**Props (erweitert):**

```text
projectId?: string
projectName?: string
projectAddress?: string
totalUnits?: number
projectVolume?: number
```

**State:**

```text
expandedFeature: string | null     — welches Feature-Panel offen ist
agreementState: {
  dataAccuracy: boolean            — Checkbox 1
  salesMandate: boolean            — Checkbox 2
  systemFee: boolean               — Checkbox 3
  commissionRate: number[]         — Slider [7.0]
}
isActivating: boolean              — Loading-State
```

**Feature-Konfiguration (3 Features mit Switches):**

| Feature-Code | Label | Agreement noetig? | Abhaengigkeit |
|-------------|-------|-------------------|---------------|
| `vertriebsfreigabe` | Vertrieb aktivieren | Ja (3 Consents + Provision) | — |
| `kaufy_projekt` | Kaufy Marktplatz | Nein (direkter Toggle) | `vertriebsfreigabe` muss approved sein |
| `projekt_landingpage` | Projekt-Landingpage | Nein | `vertriebsfreigabe` muss approved sein |

**Aktivierungs-Funktion `activateVertriebsauftrag()`:**

```text
1. Validiere: alle 3 Checkboxen gesetzt
2. Insert in sales_desk_requests:
   - project_id, tenant_id, requested_by
   - commission_agreement: { rate, gross_rate }
3. Fuer jeden Template-Code in [SALES_MANDATE_V2, DATA_ACCURACY_CONSENT, SYSTEM_SUCCESS_FEE]:
   a. SELECT id, version FROM agreement_templates WHERE code = $code AND is_active = true
   b. INSERT INTO user_consents (tenant_id, user_id, template_id, template_version, status, consented_at)
4. Toast: "Vertriebsauftrag erteilt"
5. Panel schliessen, State zuruecksetzen
6. Query invalidieren → Status "Ausstehend" wird angezeigt
```

**Deaktivierungs-Funktion `deactivateVertriebsauftrag()`:**

```text
1. UPDATE sales_desk_requests SET status = 'withdrawn' WHERE project_id = $projectId
2. Toast: "Vertriebsauftrag widerrufen"
3. Query invalidieren
```

**UI-Struktur:**

```text
Card "Vertriebsauftrag"
├── Feature-Liste (3 Eintraege mit Switch)
│   ├── Vertrieb aktivieren [Switch] — expandiert Agreement-Panel
│   ├── Kaufy Marktplatz [Switch] — disabled bis approved
│   └── Projekt-Landingpage [Switch] — disabled bis approved
├── Expandiertes Agreement-Panel (wenn geoeffnet):
│   ├── Beschreibungstext
│   ├── Projektdaten-Box (Name, Adresse, Einheiten, Volumen)
│   ├── Provisions-Slider (3-15% netto, Brutto-Anzeige)
│   ├── 3 Checkboxen (DATA_ACCURACY, SALES_MANDATE, SYSTEM_FEE)
│   └── [Abbrechen] [Vertrieb aktivieren]
└── Verlauf (Zeitleiste mit Status + Timestamps)
```

---

## Keine DB-Aenderungen

Alle benoetigten Tabellen existieren bereits:
- `sales_desk_requests` (project_id, tenant_id, status, commission_agreement, etc.)
- `agreement_templates` (code, version, is_active)
- `user_consents` (template_id, user_id, tenant_id, status, consented_at)

