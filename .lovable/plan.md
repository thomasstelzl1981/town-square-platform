
# MOD-11 Restructuring: Dashboard-Mandate-Sektion, "Faelle" wird "Provisionen"

## Uebersicht

Die Navigation des Finanzierungsmanagers wird umstrukturiert:

1. **"Faelle"-Tile entfaellt** als eigenstaendiger Menuepunkt
2. **Dashboard bekommt zwei Sektionen**: (A) "Faelle in Bearbeitung" (klickbar), (B) "Finanzierungsmandate" (neue Mandate aus Zone 1 zum Annehmen)
3. **Neuer Tile "Provisionen"** ersetzt "Faelle" — zeigt Provisionsvereinbarungen (25% Tippgeberprovision an SoT)

## 1. Routing / Manifest aendern

**Datei:** `src/manifests/routesManifest.ts` (Zeilen 366-376)

Vorher:
```
tiles: [Dashboard, Finanzierungsakte, Einreichung, Faelle, Archiv]
```

Nachher:
```
tiles: [Dashboard, Finanzierungsakte, Einreichung, Provisionen, Archiv]
```

- `{ path: "faelle", ... }` wird zu `{ path: "provisionen", component: "FMProvisionen", title: "Provisionen" }`
- Die `dynamic_routes` fuer `faelle/:requestId` bleibt bestehen (Dashboard verlinkt weiterhin auf diese Detail-Route)

**Datei:** `src/pages/portal/FinanzierungsmanagerPage.tsx`

- Route `faelle` wird entfernt (zeigte bisher FMDashboard nochmal)
- Neue Route `provisionen` zeigt `FMProvisionen`
- Route `faelle/:requestId` bleibt fuer Detailansicht

## 2. Dashboard erweitern: Zwei Sektionen

**Datei:** `src/pages/portal/finanzierungsmanager/FMDashboard.tsx`

### Sektion A: "Faelle in Bearbeitung" (bestehende Case-Cards)
- Die bestehenden `FinanceCaseCard`-Widgets bleiben
- Klick navigiert weiterhin zu `faelle/:requestId`
- Ueberschrift: "Faelle in Bearbeitung"

### Sektion B: "Finanzierungsmandate" (NEU)
- Neue Sektion unterhalb der bestehenden Faelle
- Zeigt Mandate aus `future_room_cases` mit Status `delegated` oder `assigned`
- Jedes Mandat zeigt: Public-ID, Antragstellername, Darlehenssumme, Alter
- Zwei Aktions-Buttons: "Annehmen" (setzt Status auf `accepted` und navigiert zur Falldetailseite) und "Ablehnen"
- Nutzt die bestehende `useUpdateMandateStatus` Mutation aus `useFinanceMandate.ts`

## 3. Neue Seite: FMProvisionen

**Neue Datei:** `src/pages/portal/finanzierungsmanager/FMProvisionen.tsx`

Zeigt die Provisionsvereinbarungen des Finanzierungsmanagers:

### Layout

```text
+--- PROVISIONEN ---------------------------------------------------------+
| Ihre Provisionsvereinbarungen mit System of a Town.                      |
+--------------------------------------------------------------------------+
|                                                                          |
| +--- Provisionsvereinbarung (TermsGate) -------------------------------+|
| | [FileText] Tippgeber-Vereinbarung                                    ||
| | Als Finanzierungsmanager fuehren Sie 25% der Finanzierungsprovision   ||
| | als Tippgeberprovision an System of a Town ab.                       ||
| |                                                                      ||
| | Vereinbarung akzeptiert am: 12.02.2026                               ||
| | Status: [Badge: Aktiv]                                               ||
| +----------------------------------------------------------------------+|
|                                                                          |
| +--- Provisionshistorie -----------------------------------------------+|
| | Fall-ID  | Antragsteller | Brutto    | 25% SoT   | Netto    | Status||
| | FR-A8B3  | Max Muster    | 5.000 EUR | 1.250 EUR | 3.750 EUR| offen ||
| | FR-C1D2  | Eva Schmidt   | 3.200 EUR | 800 EUR   | 2.400 EUR| bezahlt|
| +----------------------------------------------------------------------+|
+--------------------------------------------------------------------------+
```

### Datenquellen
- **Vereinbarung**: Liest aus `user_consents` + `agreement_templates` (Template-Code `FINANCE_TIPP_AGREEMENT`)
- **Provisionshistorie**: Liest aus `commissions` Tabelle, gefiltert auf `commission_type = 'finance_tipp'` und `liable_user_id = currentUser.id`
- Falls noch keine Vereinbarung akzeptiert wurde: TermsGate-Button zum Akzeptieren (nutzt bestehende `contractGenerator.ts` Logik)

### Provisionslogik (bereits im System)
- `commissions`-Tabelle hat alle noetigen Felder: `gross_commission`, `platform_share_pct` (25% statt 30% fuer diesen Typ), `platform_fee`, `status`
- `liable_user_id` = der Finanzierungsmanager
- `liable_role` = `finance_manager`
- `reference_type` = `finance_request`
- `commission_type` = `finance_tipp`

## 4. Datenbank

Keine neuen Tabellen noetig. Alle benoetigten Strukturen existieren:
- `commissions` (mit `commission_type`, `platform_share_pct`, `liable_user_id`)
- `user_consents` + `agreement_templates` (fuer TermsGate)

Optional: Ein neues `agreement_templates`-Record mit Code `FINANCE_TIPP_AGREEMENT` per Migration einfuegen, damit die Vereinbarung zur Verfuegung steht.

## 5. Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `routesManifest.ts` | Tile "faelle" wird zu "provisionen" |
| `FinanzierungsmanagerPage.tsx` | Route "faelle" entfernen, Route "provisionen" hinzufuegen |
| `FMDashboard.tsx` | Zweite Sektion "Finanzierungsmandate" mit Annehmen-Button |
| `FMProvisionen.tsx` (NEU) | Provisionsvereinbarung + Provisionshistorie |
| `index.ts` (finanzierungsmanager) | Export von FMProvisionen hinzufuegen, FMFaelle entfernen |
| DB-Migration | INSERT agreement_template fuer `FINANCE_TIPP_AGREEMENT` |
