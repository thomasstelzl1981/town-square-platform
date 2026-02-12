

# Vertriebsbeauftragung angleichen: Public Intake an MOD-13 Standard

## Analyse-Ergebnis

### MOD-13 SalesApprovalSection (Referenz/SOLL)
- **Provisions-Slider**: 3-15%, Schrittweite 0.5%, Standard 7%
- **Brutto-Anzeige**: Automatische Berechnung x1.19 MwSt
- **3 Consent-Checkboxes**: Datenrichtigkeit, Vertriebsauftrag-AGB, Systemgebuehr (2.000 EUR netto/Einheit)
- **Kanal-Steuerung**: Vertriebsfreigabe (Pflicht) dann optional Kaufy-Marktplatz und Landingpage
- **Persistenz**: `sales_desk_requests` mit `commission_agreement { rate, gross_rate }`
- **Listing-Erstellung**: Automatische Erstellung von `listings` + `listing_publications` pro Einheit

### Public Intake Kaufy2026Verkaeufer.tsx (IST - ABWEICHUNGEN)
- **Provision fest auf 3%** -- kein Slider, nicht einstellbar
- **Nur 1 Checkbox** statt 3 separater Consents
- **Keine Brutto-Anzeige**
- **Keine Kanal-Auswahl** (Partnernetzwerk vs. Kaufy-Website)
- **Anforderung 5-15% wird NICHT erfuellt**

---

## Aenderungsplan

### 1. Provisions-Slider einbauen (Step 5: Agreement)

Ersetze den festen "3% Provision"-Text durch einen interaktiven Slider:

- **Min**: 5% (statt 3% im MOD-13, da oeffentlicher Kanal hoehere Mindestprovision)
- **Max**: 15%
- **Step**: 0.5%
- **Default**: 7% (wie MOD-13)
- **Brutto-Anzeige**: `{rate * 1.19}% inkl. MwSt` darunter
- Paragraph 3 im Vertragstext wird dynamisch: "...in Hoehe von {commissionRate}% des Netto-Kaufpreises..."

### 2. Drei separate Consent-Checkboxes (wie MOD-13)

Ersetze die einzelne Checkbox durch 3 Checkboxen analog zur SalesApprovalSection:

1. "Ich bestaetige die Richtigkeit aller Projektdaten und der hochgeladenen Unterlagen."
2. "Ich erteile den Vertriebsauftrag gemaess den Allgemeinen Geschaeftsbedingungen."
3. "Ich akzeptiere die Systemgebuehr von 2.000 EUR netto pro verkaufter Einheit."

Submit-Button wird erst aktiv, wenn alle 3 akzeptiert sind.

### 3. Kanal-Auswahl hinzufuegen

Nach den Consents eine Kanal-Auswahl (zwei Toggles, analog MOD-13 Feature-Toggles):

- **Finanzvertrieb / Partnernetzwerk** (Standard: aktiv) -- Leads gehen an Zone 1 Partnernetzwerk
- **Kaufy-Website** (optional) -- Projekt wird zusaetzlich auf kaufy.app gelistet

Beide koennen gleichzeitig aktiv sein. Mindestens einer muss gewaehlt werden.

### 4. Dynamischen Vertragstext anpassen

Paragraph 3 im Agreement-Card wird dynamisch:
- Von: "...eine Vertriebsprovision in Hoehe von 3%..."
- Zu: "...eine Vertriebsprovision in Hoehe von {commissionRate}%..."

### 5. Submission-Payload erweitern

Das `commission_agreement`-Objekt im Submit an die Edge Function wird analog zum MOD-13 Format:

```text
commission_agreement: {
  rate: commissionRate,
  gross_rate: commissionRate * 1.19,
  channels: ['partner_network', 'kaufy'] // je nach Auswahl
}
```

Die bestehende `public_project_submissions`-Tabelle hat bereits ein JSONB-Feld `submission_data`, in dem dies gespeichert werden kann.

### 6. Edge Function anpassen

Die Edge Function `sot-public-project-intake` (Mode `submit`) erhaelt die erweiterten Felder und speichert sie korrekt in `submission_data`.

---

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/zone3/kaufy2026/Kaufy2026Verkaeufer.tsx` | Slider + 3 Checkboxes + Kanal-Toggles + dynamischer Vertragstext |
| `supabase/functions/sot-public-project-intake/index.ts` | Erweiterte `commission_agreement` im Submit-Payload verarbeiten |

### Keine Datenbank-Aenderungen noetig

Die bestehende `public_project_submissions`-Tabelle speichert alles in `submission_data` (JSONB). Keine Migration erforderlich.

