
# MOD-05 MSV — Konsolidierter Umsetzungsplan nach Revert

## Analyse: IST-Zustand nach Revert

### Was existiert (funktionsfaehig)

| Bereich | Status | Details |
|---------|--------|---------|
| **MSVPage.tsx** | OK | 4-Tab-Struktur (Objekte, Mieteingang, Vermietung, Einstellungen) |
| **ObjekteTab.tsx** | OK | 8-Spalten-Tabelle mit Action-Dropdown (Mahnung, Kuendigung, Mieterhoehung, Datenanforderung) |
| **MieteingangTab.tsx** | OK | Premium-Tab mit Accordion, PaywallBanner, Stats-Cards |
| **VermietungTab.tsx** | OK | Vermietungsexpose + Scout24/Kleinanzeigen Publishing |
| **EinstellungenTab.tsx** | OK | Premium-Status, Automatisierung, Mietkonten (Stub), E-Mail-Versand |
| **TemplateWizard.tsx** | OK | Template-basierte Briefgenerierung mit Platzhaltern |
| **LeaseFormDialog.tsx** | OK | Minimal-Formular fuer Mietvertragsanlage |
| **PaywallBanner.tsx** | OK | Premium-Upsell-Komponente |

### Datenbank-Tabellen (alle vorhanden)

| Tabelle | Status | Spalten |
|---------|--------|---------|
| leases | OK | tenant_id, unit_id, tenant_contact_id, monthly_rent, start_date, end_date, status, deposit_amount, notice_date, rent_increase, tenant_since, renter_org_id |
| msv_enrollments | OK | tenant_id, property_id, tier, status, blocked_reason, readiness_snapshot, scope_type, settings, credits_per_unit |
| msv_readiness_items | OK | tenant_id, enrollment_id, requirement_code, status, details, requested_at, resolved_at |
| msv_communication_prefs | OK | tenant_id, scope_type, scope_id, preferred_channel, fallback_channel, require_confirmation, reminder_day, report_day, auto_reminder_enabled, auto_report_enabled |
| msv_templates | OK | tenant_id, template_code, title, content, placeholders, locale, version, is_active |
| msv_bank_accounts | OK | tenant_id, account_name, iban, bank_name, finapi_account_id, is_default, status |
| rent_payments | OK | tenant_id, lease_id, amount, due_date, paid_date, status, payment_method, notes, expected_amount, matched_amount, matched_source, matched_transaction_id, period_start, period_end |
| rent_reminders | OK | tenant_id, lease_id, payment_id, reminder_type, stage, content_text, channel, status, document_id, sent_at, confirmed_by, auto_sent |
| rental_listings | OK | tenant_id, property_id, unit_id, status, cold_rent, warm_rent, utilities_estimate, deposit_months, available_from, minimum_term_months, pets_allowed, description, expose_document_id, public_id |
| rental_publications | OK | tenant_id, rental_listing_id, channel (scout24, kleinanzeigen), status, external_url, external_id, published_at, expires_at, error_message |

### Edge Functions (vorhanden)

| Function | Status | Funktion |
|----------|--------|----------|
| sot-msv-reminder-check | OK | Automatische Mahnungspruefung am 10. des Monats |
| sot-msv-rent-report | OK | Automatischer Mietbericht am 15. des Monats |
| sot-listing-publish | OK | Vermietungsinserat veroeffentlichen |

---

## Identifizierte Luecken (Was fehlt/nicht funktioniert)

### 1. Fehlende Datenbankanbindung in UI-Komponenten

| Komponente | Problem | Loesung |
|------------|---------|---------|
| EinstellungenTab | States sind lokal (useState), nicht mit DB verbunden | Query/Mutation fuer msv_communication_prefs hinzufuegen |
| EinstellungenTab | isPremium ist hardcoded false | Query auf msv_enrollments hinzufuegen |
| MieteingangTab | isPremium ist hardcoded false | Analog zu EinstellungenTab |
| ObjekteTab | Premium-Aktivierung Button funktioniert nicht | ReadinessChecklist + Activation Flow implementieren |

### 2. Fehlende Premium-Aktivierung

| Feature | Status | Loesung |
|---------|--------|---------|
| ReadinessChecklist | Komponente existiert, aber nicht eingebunden | In ObjekteTab bei "Premium aktivieren" oeffnen |
| Readiness-Check | Kein API-Call | Edge Function oder DB-Query implementieren |
| Enrollment erstellen | Kein Flow | msv_enrollments INSERT bei Aktivierung |

### 3. Templates nicht vorhanden

| Problem | Details |
|---------|---------|
| msv_templates ist leer | Keine System-Templates fuer Kuendigung, Mieterhoehung, Mahnung etc. |
| TemplateWizard zeigt nichts | Query auf msv_templates liefert keine Daten |

### 4. Briefgenerator-Verlinkung fehlt

| Problem | Details |
|---------|---------|
| TemplateWizard speichert in letter_drafts | Kein Uebergang zum MOD-02 Briefgenerator |
| PDF-Download deaktiviert | sot-letter-generate nicht angebunden |
| Versenden deaktiviert | Resend nicht angebunden |

### 5. Manuelles Zahlung buchen fehlt

| Problem | Details |
|---------|---------|
| Button "Zahlung buchen" disabled | Kein Modal/Dialog implementiert |
| rent_payments manuell erstellen | Kein INSERT-Flow |

---

## Umsetzungsplan nach Prioritaet

### Phase 1: Kritische Fixes (P0) — Sofort

#### 1.1 System-Templates einfuegen

```text
Tabelle: msv_templates
Eintraege:
- KUENDIGUNG: Kuendigungsschreiben mit Platzhaltern (mieter_name, adresse, kuendigungsdatum, begruendung)
- MIETERHOEHUNG: Mieterhoehungsschreiben (mieter_name, adresse, alte_miete, neue_miete, erhoehungsdatum, begruendung)
- DATENANFORDERUNG: Datenanforderung (mieter_name, adresse, dokumente_liste, frist)
- MAHNUNG: Zahlungserinnerung (mieter_name, adresse, offener_betrag, faellig_seit)
- MAHNUNG_2: Erste Mahnung
- MAHNUNG_3: Letzte Mahnung
```

#### 1.2 Premium-Status aus DB lesen

```text
Datei: EinstellungenTab.tsx, MieteingangTab.tsx
Aenderung: 
- useQuery auf msv_enrollments (tenant_id, status='active', tier='premium')
- isPremium = enrollments?.length > 0
```

#### 1.3 Automatisierungs-Einstellungen mit DB verbinden

```text
Datei: EinstellungenTab.tsx
Aenderung:
- useQuery auf msv_communication_prefs (scope_type='tenant')
- useMutation fuer UPDATE msv_communication_prefs
- Formular-Werte aus DB laden, bei Aenderung speichern
```

### Phase 2: Premium-Aktivierung (P1)

#### 2.1 Premium-Aktivierungs-Flow

```text
Datei: ObjekteTab.tsx
Aenderung:
- Bei "Premium aktivieren" → ReadinessChecklist oeffnen
- Property-Auswahl wenn mehrere vorhanden
```

#### 2.2 ReadinessChecklist mit Logik

```text
Datei: src/components/msv/ReadinessChecklist.tsx
Aenderung:
- Requirement-Codes pruefen (RENTER_CONTACT_EXISTS, RENTER_EMAIL, COMM_PREF_SET, LEASE_EXISTS)
- Status anzeigen (missing, provided, waived)
- "Aktivieren" Button wenn alle Requirements erfuellt
- INSERT in msv_enrollments bei Aktivierung
```

#### 2.3 Premium-Kosten anzeigen

```text
Datei: ReadinessChecklist.tsx
Aenderung:
- Credits-Berechnung: Anzahl Units * 40 Credits/Monat
- Anzeige vor Aktivierung
```

### Phase 3: Mieteingang funktional (P1)

#### 3.1 Manuelles Zahlung buchen

```text
Neue Datei: src/components/msv/PaymentBookingDialog.tsx
Features:
- Betrag eingeben
- Datum waehlen
- Status waehlen (paid, partial)
- INSERT in rent_payments
```

#### 3.2 MieteingangTab erweitern

```text
Datei: MieteingangTab.tsx
Aenderung:
- "Zahlung buchen" Button oeffnet PaymentBookingDialog
- Nach Buchung: refetch der Zahlungsdaten
```

### Phase 4: Briefgenerator-Integration (P2)

#### 4.1 TemplateWizard zum Briefgenerator

```text
Datei: TemplateWizard.tsx
Aenderung:
- Nach Speichern als Entwurf: Weiterleitung zu /portal/office/brief mit letter_draft_id
- Oder: Modal mit "Zum Briefgenerator" Button
```

#### 4.2 PDF-Generierung aktivieren

```text
Datei: TemplateWizard.tsx
Aenderung:
- Aufruf von sot-letter-generate Edge Function
- Download des generierten PDFs
```

### Phase 5: Vermietung vollstaendig (P2)

#### 5.1 RentalListingWizard erweitern

```text
Datei: src/components/msv/RentalListingWizard.tsx
Aenderung:
- Property/Unit-Auswahl aus MOD-04
- Daten aus property/unit uebernehmen
- Expose-Felder erweitern (Energieausweis, Baujahr, etc.)
```

#### 5.2 Scout24-Veroeffentlichung

```text
Datei: src/components/msv/RentalPublishDialog.tsx, sot-listing-publish
Aenderung:
- Pflichtfelder-Check gemaess Scout24 API
- Status-Updates in rental_publications
- Hinweis auf Coming Soon (API-Integration Phase 2)
```

---

## Zusammenfassung der Aenderungen

### Datenbank-Migrationen

| Aktion | Details |
|--------|---------|
| INSERT msv_templates | 6 System-Templates (Kuendigung, Mieterhoehung, Datenanforderung, Mahnung 1-3) |

### Frontend-Dateien zu aendern

| Datei | Aenderungen |
|-------|-------------|
| EinstellungenTab.tsx | DB-Queries fuer Premium-Status + Communication Prefs |
| MieteingangTab.tsx | DB-Query fuer Premium-Status, PaymentBookingDialog einbinden |
| ObjekteTab.tsx | ReadinessChecklist bei Premium-Aktivierung oeffnen |
| TemplateWizard.tsx | Briefgenerator-Verlinkung, PDF-Download aktivieren |
| ReadinessChecklist.tsx | Komplette Implementierung mit Requirement-Checks |

### Neue Dateien

| Datei | Zweck |
|-------|-------|
| src/components/msv/PaymentBookingDialog.tsx | Manuelles Buchen von Zahlungen |

### Edge Functions (keine neuen noetig)

Bestehende Functions sind ausreichend:
- sot-msv-reminder-check: Mahnungspruefung
- sot-msv-rent-report: Mietbericht
- sot-listing-publish: Vermietungsinserat
- sot-letter-generate: PDF-Generierung

---

## Implementierungs-Reihenfolge

```text
Schritt 1: System-Templates einfuegen (Migration)
Schritt 2: EinstellungenTab mit DB verbinden
Schritt 3: Premium-Status in MieteingangTab + ObjekteTab
Schritt 4: ReadinessChecklist implementieren
Schritt 5: PaymentBookingDialog erstellen
Schritt 6: TemplateWizard → Briefgenerator Verlinkung
Schritt 7: PDF-Download aktivieren
```

---

## Technische Details

### Premium-Status Query (wiederverwendbar)

```typescript
// Hook: src/hooks/useMSVPremium.ts
const { data: isPremium } = useQuery({
  queryKey: ['msv-premium-status'],
  queryFn: async () => {
    const { data } = await supabase
      .from('msv_enrollments')
      .select('id')
      .eq('tier', 'premium')
      .eq('status', 'active')
      .limit(1);
    return (data?.length || 0) > 0;
  }
});
```

### Communication Prefs Query

```typescript
// In EinstellungenTab
const { data: prefs } = useQuery({
  queryKey: ['msv-communication-prefs'],
  queryFn: async () => {
    const { data } = await supabase
      .from('msv_communication_prefs')
      .select('*')
      .eq('scope_type', 'tenant')
      .single();
    return data;
  }
});
```

### Readiness-Check Logik

```typescript
// Requirements pruefen
const requirements = [
  { code: 'LEASE_EXISTS', check: leases?.length > 0 },
  { code: 'RENTER_CONTACT_EXISTS', check: leases?.every(l => l.tenant_contact_id) },
  { code: 'RENTER_EMAIL', check: contacts?.every(c => c.email) },
  { code: 'COMM_PREF_SET', check: !!commPrefs?.preferred_channel }
];
```

---

## Risiken und Abhaengigkeiten

| Risiko | Mitigation |
|--------|------------|
| Templates nicht vorhanden | Migration mit INSERT in msv_templates |
| Resend nicht konfiguriert | E-Mail-Versand als "Coming Soon" markieren |
| FinAPI nicht verfuegbar | Stub UI mit "Coming Soon" Hinweis |
| Scout24 API nicht integriert | Export-Funktion + manuelle Veroeffentlichung |

---

## Aufwandsschaetzung

| Phase | Aufwand |
|-------|---------|
| Phase 1 (Kritische Fixes) | 1-2 Iterationen |
| Phase 2 (Premium-Aktivierung) | 2 Iterationen |
| Phase 3 (Mieteingang) | 1 Iteration |
| Phase 4 (Briefgenerator) | 1-2 Iterationen |
| Phase 5 (Vermietung) | 1-2 Iterationen |
| **Gesamt** | **6-9 Iterationen** |
