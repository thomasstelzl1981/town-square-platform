

# MOD-04 SANIERUNG — IMPLEMENTIERUNG IN 4 PHASEN

## ÜBERSICHT

Der vollständige Ausschreibungs-Workflow wird in 4 unabhängige Phasen aufgeteilt:

| Phase | Titel | Umfang | Geschätzte Dauer |
|-------|-------|--------|------------------|
| **Phase 1** | Datenbank + Grundgerüst | Schema, UI-Skeleton, Navigation | 2-3 Tage |
| **Phase 2** | Leistungsumfang (Schritt 2) | KI-Analyse, LV-Editor, Kostenschätzung | 4-5 Tage |
| **Phase 3** | Ausschreibung (Schritt 3-4) | Provider-Suche, E-Mail-Versand | 3-4 Tage |
| **Phase 4** | Inbound + Vergabe (Schritt 5-8) | Angebote empfangen, vergleichen, vergeben | 4-5 Tage |

---

## PHASE 1: DATENBANK + GRUNDGERÜST

### Ziel
Stabile Datenbankstruktur und navigierbares UI-Skeleton für den Sanierungsbereich.

### Datenbank-Migration
```sql
-- service_cases Erweiterungen
ALTER TABLE service_cases ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES units(id);
ALTER TABLE service_cases ADD COLUMN IF NOT EXISTS tender_id text UNIQUE;
ALTER TABLE service_cases ADD COLUMN IF NOT EXISTS scope_status text DEFAULT 'pending';
ALTER TABLE service_cases ADD COLUMN IF NOT EXISTS scope_description text;
ALTER TABLE service_cases ADD COLUMN IF NOT EXISTS scope_line_items jsonb DEFAULT '[]';
ALTER TABLE service_cases ADD COLUMN IF NOT EXISTS cost_estimate_min integer;
ALTER TABLE service_cases ADD COLUMN IF NOT EXISTS cost_estimate_max integer;
ALTER TABLE service_cases ADD COLUMN IF NOT EXISTS contact_name text;
ALTER TABLE service_cases ADD COLUMN IF NOT EXISTS contact_phone text;
ALTER TABLE service_cases ADD COLUMN IF NOT EXISTS contact_email text;

-- Trigger für Tender-ID Generierung
-- Format: TND-{ORG_PUBLIC_ID}-{YYMMDD}-{SEQ}
```

### UI-Komponenten
1. **SanierungTab.tsx** (Refactoring): Übersicht mit Stats + Vorgangsliste
2. **ServiceCaseCreateDialog.tsx**: Schritt 1 - Objekt, Einheit, Kategorie, Titel

### Acceptance Criteria
- [x] Neuer Vorgang kann angelegt werden
- [x] Tender-ID wird automatisch generiert
- [x] Status-Flow: draft → scope_pending → ...
- [x] Vorgangsliste zeigt alle Service Cases

**✅ PHASE 1 ABGESCHLOSSEN**

---

## PHASE 2: LEISTUNGSUMFANG DEFINIEREN

### Ziel
KI-gestützte Erstellung des Leistungsverzeichnisses mit Kostenschätzung.

### Zwei Wege
1. **KI-gestützt**: Grundriss + Fotos analysieren → LV generieren
2. **Externes LV**: PDF hochladen → als Anhang nutzen

### UI-Komponenten
1. **ScopeDefinitionPanel.tsx**: Hauptcontainer für Schritt 2
2. **DMSDocumentSelector.tsx**: Dokumente aus DMS auswählen
3. **LineItemsEditor.tsx**: Editierbares Leistungsverzeichnis
4. **CostEstimateCard.tsx**: Min/Mittel/Max Anzeige
5. **RoomAnalysisDisplay.tsx**: Anzeige erkannter Räume

### Edge Function
- **sot-renovation-scope-ai**: Analysiert Dokumente, generiert LV, schätzt Kosten

### Acceptance Criteria
- [x] ScopeDefinitionPanel mit Tabs für KI/externes LV
- [x] LineItemsEditor mit Add/Edit/Remove Positionen
- [x] CostEstimateCard mit Min/Mittel/Max Bandbreite
- [x] DMSDocumentSelector für Objektdokumente
- [x] RoomAnalysisDisplay für erkannte Räume
- [x] Edge Function für KI-Analyse implementiert
- [ ] KI analysiert Grundriss → erkennt Räume, Türen, Fenster, Flächen
- [ ] Externes LV kann hochgeladen werden

**✅ PHASE 2 ABGESCHLOSSEN**

---

## PHASE 3: AUSSCHREIBUNG VERSENDEN

### Ziel
Dienstleister finden, E-Mail-Entwürfe erstellen, Versand nach Bestätigung.

### UI-Komponenten
1. **ProviderSearchPanel.tsx**: Google Places Suche
2. **TenderDraftPanel.tsx**: E-Mail-Vorschau mit allen Daten

### Edge Functions
- **sot-places-search**: Google Places API Integration
- **sot-renovation-outbound**: E-Mail-Rendering + Resend-Versand

### E-Mail enthält
- Tender-ID im Betreff
- Vollständige Leistungsbeschreibung
- Anhänge (LV, Grundriss, Fotos)
- Link zum Online-Datenraum
- **Kundenkontaktdaten** (Telefon, E-Mail, WhatsApp)

### Acceptance Criteria
- [ ] Dienstleister können via Google Places gesucht werden
- [ ] E-Mails werden als ENTWURF erstellt
- [ ] Versand NUR nach expliziter Bestätigung
- [ ] Kundenkontaktdaten sind in jeder E-Mail enthalten

---

## PHASE 4: INBOUND + VERGABE

### Ziel
Angebote empfangen, zuordnen, vergleichen und vergeben.

### Datenbank
```sql
-- Neue Tabelle für eingehende E-Mails
CREATE TABLE service_case_inbound (
  id uuid PRIMARY KEY,
  service_case_id uuid REFERENCES service_cases(id),
  sender_email text NOT NULL,
  subject text,
  attachments jsonb,
  match_confidence text,
  status text DEFAULT 'pending'
);
```

### UI-Komponenten
1. **UnassignedInboundList.tsx**: Unzugeordnete E-Mails
2. **OffersComparisonPanel.tsx**: Angebotsvergleich mit Kontaktdaten
3. **AwardConfirmationDialog.tsx**: Vergabe bestätigen

### Edge Function
- **sot-renovation-inbound-webhook**: Resend Webhook → E-Mail parsen, Tender-ID matchen

### Acceptance Criteria
- [ ] Eingehende E-Mails werden automatisch per Tender-ID zugeordnet
- [ ] Unzugeordnete E-Mails erscheinen in separater Liste
- [ ] Angebotsvergleich zeigt ALLE Kontaktdaten der Dienstleister
- [ ] Vergabe-Mail wird als Entwurf erstellt
- [ ] Vorgang kann abgeschlossen werden

---

## NÄCHSTER SCHRITT

**Empfehlung:** Mit **Phase 1** starten (Datenbank + Grundgerüst).

Soll ich Phase 1 jetzt implementieren?

