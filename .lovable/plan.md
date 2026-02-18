

# Armstrong Credit-Preisliste verschieben und Abrechnungsseite ueberarbeiten

## Problem

1. Die Armstrong Info Page (`/portal/armstrong`) enthaelt eine statische, hartcodierte Credit-Preisliste (`freeActions`, `creditActions`), die nicht mit dem Armstrong Manifest (SSOT) uebereinstimmt
2. Die Abrechnungsseite (`/portal/stammdaten/abrechnung`) ist der richtige Ort fuer diese Informationen, praesentiert aber Armstrong bisher nur mit importierten Komponenten aus dem Agenten-Modul
3. Es fehlt der Abgleich zwischen ArmstrongInfoPage, Zone 1 ArmstrongBilling und dem Armstrong Manifest

## Loesung

### 1. ArmstrongInfoPage bereinigen (`/portal/armstrong`)

Die statischen `freeActions` und `creditActions` Arrays werden entfernt. Die Seite bleibt als reine **Erklaerungsseite** bestehen (Was ist Armstrong, wie funktioniert er, USPs, 3-Schritte-Prozess) — ohne Preisliste. Am Ende ein Link-Button "Preise und Verbrauch ansehen" der zu `/portal/stammdaten/abrechnung` fuehrt.

**Entfernt:**
- `freeActions` Array (Zeilen 19-26)
- `creditActions` Array (Zeilen 28-35)
- Card "Kostenlos verfuegbar" (Zeilen 109-130)
- Card "Mit Credits" (Zeilen 132-159)

**Bleibt:**
- Hero-Bereich
- USPs (Kein Abo, Multi-Modul, Datenschutz)
- "Wie Armstrong arbeitet" (3 Schritte)
- CTA — erweitert mit Link zu Abrechnung

### 2. AbrechnungTab ueberarbeiten (`/portal/stammdaten/abrechnung`)

Die Seite wird zur zentralen Armstrong-Praesentation mit Billing-Fokus umgebaut:

**Neuer Aufbau (von oben nach unten):**

1. **Header**: "Abrechnung und Credits" — aufgewerteter Titel
2. **Aktueller Plan** (bestehende Card, bleibt)
3. **Rechnungen** (bestehende Card, bleibt)
4. **Armstrong Intelligence** — Neuer Bereich mit starker Praesentation:
   - **KPI-Leiste** (KostenDashboard — bleibt, zeigt Gesamtkosten, Credits verbraucht, Transaktionen)
   - **Credit-Preisliste** — Neue Komponente `ArmstrongCreditPreisliste`:
     - Liest direkt aus dem Armstrong Manifest (`armstrongActions`)
     - Gruppiert nach `cost_model` (Free / Metered / Premium)
     - Zeigt pro Aktion: Titel, action_code, Credits, Kosten in EUR (1 Credit = 0,25 EUR)
     - Filtert nur aktive Aktionen
     - Konsistent mit Zone 1 ArmstrongBilling und Engine Registry
   - **E-Mail-Anreicherung** (bestehende EmailEnrichmentCard, bleibt)
   - **WhatsApp Business** (bestehende WhatsAppArmstrongCard, bleibt)
   - **Aktionskatalog** (AktionsKatalog — bleibt als aufklappbarer/scrollbarer Bereich)

### 3. Neue Komponente: `ArmstrongCreditPreisliste`

Erstellt in `src/components/armstrong/ArmstrongCreditPreisliste.tsx`:

- Importiert `armstrongActions` aus dem Manifest
- Gruppiert Aktionen nach `cost_model`: Free, Metered, Premium
- Darstellung als uebersichtliche Tabelle oder strukturierte Card-Gruppen
- Zeigt: Aktion (deutsch), Credits, EUR-Preis, Ausfuehrungsmodus
- Footer-Hinweis: "1 Credit = 0,25 EUR. Kosten werden immer vorab angezeigt."
- Diese Komponente ist die SSOT fuer die Preisdarstellung in Zone 2

---

## Technische Uebersicht

| Datei | Aenderung |
|-------|-----------|
| `src/pages/portal/ArmstrongInfoPage.tsx` | Statische Preislisten entfernen, Link zu Abrechnung hinzufuegen |
| `src/pages/portal/stammdaten/AbrechnungTab.tsx` | Layout ueberarbeiten, neue Preisliste integrieren |
| `src/components/armstrong/ArmstrongCreditPreisliste.tsx` | Neue Komponente — liest Preise aus Manifest |

## Umsetzungsreihenfolge

1. Neue Komponente `ArmstrongCreditPreisliste` erstellen
2. `AbrechnungTab` ueberarbeiten und Preisliste einbinden
3. `ArmstrongInfoPage` bereinigen (Preislisten entfernen, Link hinzufuegen)
