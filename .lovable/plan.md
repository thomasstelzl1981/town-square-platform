
# MOD-05 MSV — Korrekturplan

## Zusammenfassung der Probleme

| Problem | Fundstelle | Korrektur |
|---------|-----------|-----------|
| Falscher Name "Mieter-Selbstverwaltung" | MSVPage.tsx Zeile 42 | → "Mietsonderverwaltung" |
| DashboardTab noch vorhanden | index.ts, DashboardTab.tsx | Löschen |
| ObjekteTab falsche Spalten | ObjekteTab.tsx | 8 Spalten gemäß Spec |
| MieteingangTab Struktur | MieteingangTab.tsx | Objekt-zentriert + Accordion |
| EinstellungenTab unvollständig | EinstellungenTab.tsx | FinAPI + Aktionsverwaltung |
| Dokumentation veraltet | MOD-05_MSV.md | 4-Tab Struktur |

---

## Teil 1: Dateien löschen/bereinigen

| Datei | Aktion |
|-------|--------|
| `src/pages/portal/msv/DashboardTab.tsx` | **Löschen** |
| `src/pages/portal/msv/index.ts` | DashboardTab-Export entfernen |

---

## Teil 2: MSVPage.tsx korrigieren

**Zeile 42:** 
```
// ALT:
<p className="text-muted-foreground">Mieter-Selbstverwaltung und Zahlungsübersicht</p>

// NEU:
<p className="text-muted-foreground">Mietsonderverwaltung - Zahlungen, Mahnungen und Mietberichte</p>
```

---

## Teil 3: ObjekteTab.tsx — Neue Spaltenstruktur

### Geforderte Spalten

| # | Spalte | DB-Quelle | Beschreibung |
|---|--------|-----------|--------------|
| 1 | Objekt-ID | `properties.code` | Kurzcode |
| 2 | Objektadresse | `properties.address` | Straße, Nr, Ort |
| 3 | Mieter | `contacts.last_name` (via lease) | Name des Mieters |
| 4 | Kaltmiete | `lease_components.amount` (type=base_rent) oder `leases.monthly_rent` | Nettokaltmiete |
| 5 | Warmmiete | Berechnet: Kaltmiete + NK + Vorauszahlung | Gesamtmiete |
| 6 | Nebenkosten | `lease_components.amount` (type=utilities) | NK-Vorauszahlung |
| 7 | Vorauszahlung | `lease_components.amount` (type=prepayment) | Sonstige |
| 8 | Aktionen | Dropdown | Briefe erstellen |

### Action-Buttons (bereits korrekt)
- Kündigung schreiben → Briefgenerator
- Mieterhöhung schreiben → Briefgenerator  
- Datenanforderung → Briefgenerator
- Mietvertrag anlegen (bei Leerstand)
- Premium aktivieren
- Objekt öffnen (MOD-04)

### Hinweis zur Datenquelle
Da `lease_components` verwendet werden soll (granulare Abrechnung), müssen die Komponenten abgefragt werden. Falls keine Komponenten existieren, Fallback auf `leases.monthly_rent`.

---

## Teil 4: MieteingangTab.tsx — Premium-Tab Redesign

### Konzept

Der Tab zeigt eine **Objekt-zentrierte** Liste mit Mieteingangsstatus.

### Haupttabelle (collapsed)

| # | Spalte | Beschreibung |
|---|--------|--------------|
| 1 | Objektnummer | properties.code |
| 2 | Adresse | properties.address |
| 3 | Sollmiete | leases.monthly_rent |
| 4 | Mieteingang | SUM der gebuchten Zahlungen (aktueller Monat) |
| 5 | Status | Badge: Bezahlt/Offen/Überfällig |
| 6 | Expandieren | ChevronDown Icon |

### Expandierte Zeile (Accordion)

Bei Klick auf eine Zeile öffnet sich ein Bereich mit:
- **Letzte 10 Mieteingänge** (Tabelle: Datum, Betrag, Status, Quelle)
- **Action-Buttons:**
  - Zahlung buchen (manuell)
  - Mahnung erstellen → Template-Wizard
  - Mietbericht senden → Edge Function Trigger

### Premium-Gate
- PaywallBanner wenn nicht Premium
- "Premium aktivieren" Button → Readiness Gate

### FinAPI-Kontoauswahl
- Wenn mehrere Konten hinterlegt sind (in Einstellungen), kann hier das Konto für den Abgleich gewählt werden

---

## Teil 5: EinstellungenTab.tsx — Erweiterte Konfiguration

### Sektion 1: Premium-Status (bereits vorhanden)
- Credits-Anzeige
- Premium aktivieren Button

### Sektion 2: Automatisierung (erweitert)

| Einstellung | UI-Element | Beschreibung |
|-------------|------------|--------------|
| **Mahntag** | Number Input (1-28) | Wann Mahnung versenden |
| **Kommunikationsweg** | Radio: E-Mail / Brief | Wie wird gemahnt |
| **Auto-Mahnung aktiv** | Switch | Automatischer Versand |
| **Mietbericht-Tag** | Number Input (1-28) | Default: 15 |
| **Auto-Mietbericht** | Switch | Automatischer Versand |

### Sektion 3: Kontoanbindung (FinAPI)

```
┌──────────────────────────────────────────────────────────────┐
│  🏦 Mietkonten                                    [Premium]   │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Verbundene Konten:                                           │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ DE89 3704 0044 0532 0130 00 (Sparkasse)    [Standard]  │   │
│  │ DE12 5001 0517 0648 4898 90 (Commerzbank)  [Aktiv]     │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                               │
│  [+ Konto hinzufügen]                                         │
│                                                               │
│  ℹ️ Coming Soon: Automatische Transaktionserkennung           │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Datenmodell-Erweiterung

Neue Tabelle `msv_bank_accounts`:

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | uuid PK | — |
| tenant_id | uuid FK | Tenant-Isolation |
| account_name | text | Anzeigename |
| iban | text | IBAN (verschlüsselt) |
| bank_name | text | Bankname |
| finapi_account_id | text | FinAPI Referenz |
| is_default | boolean | Standard-Konto |
| status | enum | connected, pending, error |
| created_at | timestamptz | — |

---

## Teil 6: Dokumentation MOD-05_MSV.md

### Zu aktualisierende Abschnitte

**Sektion 4.1 Routen (Zeile 370-379):**

```markdown
| Route | Zweck |
|-------|-------|
| /portal/msv | Redirect zu /portal/msv/objekte |
| /portal/msv/objekte | Objektliste mit Actions (Freemium) |
| /portal/msv/mieteingang | Zahlungsverwaltung (Premium) |
| /portal/msv/vermietung | Vermietungsexposé + Publishing (Freemium) |
| /portal/msv/einstellungen | Konfiguration + Kontoanbindung |
```

**Sektion 4.2 Dashboard:** Komplett löschen

**Sektion 4.3 Listen → Objekte:** Umbenennen und Spalten aktualisieren

**Sektion 4.6 Einstellungen:** FinAPI-Kontoanbindung + Aktionsverwaltung hinzufügen

---

## Technische Implementierung

### Schritt 1: Bereinigung
1. DashboardTab.tsx löschen
2. index.ts: DashboardTab-Export entfernen
3. MSVPage.tsx: Text "Mieter-Selbstverwaltung" → "Mietsonderverwaltung"

### Schritt 2: ObjekteTab.tsx
1. Spalten umstrukturieren auf 8 Spalten
2. Query erweitern für lease_components (falls vorhanden)
3. Warmmiete berechnen: Kaltmiete + NK + Vorauszahlung

### Schritt 3: MieteingangTab.tsx
1. Objekt-zentrierte Ansicht statt Payment-zentriert
2. Collapsible/Accordion für Zahlungshistorie
3. Action-Buttons im expandierten Bereich
4. Premium-Gate und PaywallBanner

### Schritt 4: EinstellungenTab.tsx
1. Mahntag-Konfiguration (Number Input)
2. Kommunikationsweg-Auswahl (E-Mail/Brief)
3. Mietbericht-Tag-Konfiguration
4. FinAPI-Kontoübersicht (Coming Soon Stub)

### Schritt 5: Datenbank
1. Neue Tabelle `msv_bank_accounts` erstellen
2. `msv_automation_settings` erweitern (falls nicht vorhanden):
   - reminder_day
   - reminder_channel (email/letter)
   - report_day
   - auto_reminder_enabled
   - auto_report_enabled

### Schritt 6: Dokumentation
1. MOD-05_MSV.md aktualisieren auf 4-Tab-Struktur
2. Dashboard-Sektion entfernen
3. Routen korrigieren

---

## Zusammenfassung

| Bereich | Änderungen |
|---------|------------|
| Dateien löschen | 1 (DashboardTab.tsx) |
| Frontend-Dateien | 4 Überarbeitungen |
| Datenbank | 1 neue Tabelle, 1 Erweiterung |
| Dokumentation | 1 Datei aktualisieren |
| Edge Functions | Keine neuen (bereits vorhanden) |
