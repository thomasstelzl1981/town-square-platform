# Vollständiger Korrektur- und Erweiterungsplan

## ✅ STATUS: IMPLEMENTIERT (2026-02-06)

Alle Änderungen wurden erfolgreich umgesetzt.

---

## Zusammenfassung der Änderungen

### 1. Datenbank-Migration ✅
- `landlord_contexts`: `tax_rate_percent` (Default 30%) bereits vorhanden
- `context_members`: `tax_class`, `profession`, `gross_income_yearly`, `church_tax` werden jetzt genutzt
- Seed-Daten für Familie Mustermann mit Steuerklassen (III/V), Berufen und Einkommen aktualisiert

### 2. CreateContextDialog → 2-Schritt-Wizard ✅
- **Schritt 1 (Grunddaten)**: Name, Typ (Privat/Gesellschaft), Steuersatz (Default 30%), Adresse
- **Schritt 2a (PRIVATE)**: Eigentümer mit Steuerklasse, Beruf, Bruttoeinkommen, Kirchensteuer
- **Schritt 2b (BUSINESS)**: Rechtsform, Geschäftsführer, HRB, USt-ID + Firmenadresse
- **Edit-Modus**: Vollständig implementiert mit Laden bestehender Daten

### 3. KontexteTab → Vermietereinheiten ✅
- **Bearbeiten-Button** auf jeder Karte hinzugefügt
- Erweiterte Kartenanzeige mit:
  - Steuersatz prominent angezeigt
  - Eigentümer mit Steuerklasse, Beruf, Einkommen
  - Eigentumsanteile
  - Adresse der Vermietereinheit

### 4. PortfolioTab ✅
- **Chart-Farben explizit gesetzt**:
  - Objektwert: `hsl(210, 70%, 50%)` (Blau)
  - Netto-Vermögen: `hsl(142, 70%, 45%)` (Grün)
  - Restschuld: `hsl(0, 70%, 50%)` (Rot)
- **10-Jahres-Investmentkalkulation Tabelle** nach Summenzeile hinzugefügt
- Toggle "Alle Jahre anzeigen" für 30-Jahres-Ansicht

### 5. Golden Path Seeds ✅
- Max Mustermann: Steuerklasse III, Software-Entwickler, 72.000 € Brutto
- Lisa Mustermann: Steuerklasse V, Marketing-Managerin, 54.000 € Brutto
- `tax_regime` für Private Kontexte auf NULL gesetzt

---

## Datenfeld-Alignment MOD-04 ↔ MOD-07

| Entity | Feld | MOD-04 (Vermietereinheit) | MOD-07 (Selbstauskunft) |
|--------|------|---------------------------|-------------------------|
| Person | Vorname/Nachname | `context_members.first_name/last_name` | `applicant_profiles.first_name/last_name` |
| Person | Geburtsdatum | `context_members.birth_date` | `applicant_profiles.birth_date` |
| Person | Adresse | `context_members.street/city` | `applicant_profiles.address_*` |
| Person | Steuerklasse | `context_members.tax_class` | — (nicht in Selbstauskunft) |
| Person | Bruttoeinkommen | `context_members.gross_income_yearly` | `applicant_profiles.net_income_monthly` (Netto) |
| Person | Beruf | `context_members.profession` | `applicant_profiles.position` |
| Firma | Rechtsform | `landlord_contexts.legal_form` | `applicant_profiles.company_legal_form` |
| Firma | HRB | `landlord_contexts.hrb_number` | `applicant_profiles.company_register_number` |
| Firma | USt-ID | `landlord_contexts.ust_id` | `applicant_profiles.company_vat_id` |
| Firma | GF | `landlord_contexts.managing_director` | — |

---

## Betroffene Dateien

| Datei | Änderungen |
|-------|------------|
| `supabase/migrations/` | ✅ Seed-Daten aktualisiert (Steuerklassen, Berufe, Einkommen) |
| `src/components/shared/CreateContextDialog.tsx` | ✅ Komplettes Refactoring: 2-Schritt-Wizard, Edit-Modus, Steuerdaten |
| `src/pages/portal/immobilien/KontexteTab.tsx` | ✅ Bearbeiten-Button, erweiterte Kartenanzeige |
| `src/pages/portal/immobilien/PortfolioTab.tsx` | ✅ Chart-Farben, 10-Jahres-Tabelle |
| `.lovable/plan.md` | ✅ Dokumentation aktualisiert |

---

## Validierung (Audit-Checkliste)

### CreateContextDialog
- [x] Steuersatz-Feld im Schritt 1 (Default 30%)
- [x] PRIVATE: Eigentümer-Felder mit Steuerklasse, Beruf, Bruttoeinkommen, Kirchensteuer
- [x] BUSINESS: Firmenadresse-Felder (Straße, Nr., PLZ, Ort)
- [x] BUSINESS: Nur ein Gesamtsteuersatz (kein Split in KSt/GewSt)
- [x] Edit-Modus lädt existierende Daten korrekt
- [x] Speichern funktioniert für Anlegen UND Bearbeiten

### KontexteTab
- [x] Bearbeiten-Button auf jeder Karte sichtbar
- [x] Karten zeigen Steuerklasse, Beruf, Einkommen pro Eigentümer
- [x] BUSINESS-Karten zeigen Firmenadresse
- [x] Klick auf Bearbeiten öffnet Dialog mit Daten

### PortfolioTab
- [x] Chart hat explizite Farben (blau/grün/rot)
- [x] Restschuld-Linie liegt ÜBER den Areas
- [x] 10-Jahres-Tabelle erscheint unter Summenzeile
- [x] "Alle Jahre anzeigen" Toggle funktioniert

### Golden Path Seeds
- [x] Familie Mustermann hat Steuerklassen (III/V)
- [x] Berufe und Einkommen sind befüllt
- [x] church_tax = false für beide
