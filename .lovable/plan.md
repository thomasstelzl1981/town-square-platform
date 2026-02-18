

# Armstrong-Seite: Werbeseite + Billing Hub

## Konzept

Die Seite `/portal/armstrong` bleibt eine Armstrong-Werbeseite, wird aber um Billing-Sektionen erweitert. Sie dient als "Kurzbedienungsanleitung + Preisliste" — alles, was ein Nutzer ueber Armstrong wissen muss, auf einer Seite.

## Seitenaufbau (von oben nach unten)

```text
+──────────────────────────────────────────────+
│  HERO: Armstrong — Ihr KI-Co-Pilot          │
│  Untertitel + Bot-Icon (bestehend)           │
+──────────────────────────────────────────────+
│  3 USP-Karten: Kein Abo | Multi-Modul |     │
│  Datenschutz (bestehend)                     │
+──────────────────────────────────────────────+
│  "Wie Armstrong arbeitet" — 3 Schritte       │
│  (bestehend)                                 │
+──────────────────────────────────────────────+
│  CREDIT-SALDO (NEU)                          │
│  KPI-Karten: Guthaben | Verbraucht |         │
│  Transaktionen | Ø pro Aktion                │
│  (KostenDashboard verschoben von Abrechnung) │
+──────────────────────────────────────────────+
│  SYSTEM-PREISLISTE (NEU)                     │
│  Konsolidierte Tabelle mit ALLEN Kosten:     │
│  KI-Aktionen + Infrastruktur-Services        │
│  (ArmstrongCreditPreisliste + neue Infra)    │
+──────────────────────────────────────────────+
│  SERVICES & ADD-ONS (NEU)                    │
│  E-Mail-Anreicherung Toggle                  │
│  WhatsApp Business Einstellungen             │
│  (verschoben von AbrechnungTab)              │
+──────────────────────────────────────────────+
│  AKTIONSKATALOG (verschoben)                 │
│  Durchsuchbare Aktionsliste                  │
│  (verschoben von AbrechnungTab)              │
+──────────────────────────────────────────────+
│  CTA: Chat oeffnen (bestehend, angepasst)    │
+──────────────────────────────────────────────+
```

## Aenderungen im Detail

### Datei 1: `src/config/billingConstants.ts` (NEU)

Zentrale Preis-SSOT fuer alle System-Services (nicht KI-Aktionen — die kommen aus dem Manifest):

| Service | Credits | EUR |
|---|---|---|
| PDF-Extraktion (Posteingang) | 1 | 0,25 |
| Storage-Extraktion | 1 | 0,25 |
| NK-Beleg-Parsing | 1 | 0,25 |
| Auto-Matching (Banktransaktionen) | 2 | 0,50 |
| Bank-Synchronisation (finAPI) | 4 | 1,00 |
| Fax-Versand | 4 | 1,00 |
| Brief-Versand | 4 | 1,00 |
| E-Mail-Anreicherung | 20/Monat | 5,00/Monat |
| DMS Storage Free (1 GB) | — | Kostenlos |
| DMS Storage Pro (10 GB) | — | 9,90/Monat |

### Datei 2: `src/components/armstrong/SystemPreisliste.tsx` (NEU)

Eine konsolidierte Preisliste-Komponente mit zwei Sektionen:

**Sektion A — KI-Aktionen**: Wiederverwendet die Gruppierung aus `ArmstrongCreditPreisliste` (Free / Pay-per-Use / Premium), aber kompakter als Accordion.

**Sektion B — Infrastruktur-Services**: Liest aus `billingConstants.ts` und zeigt die obige Tabelle an. Kategorien: Dokumenten-Verarbeitung, Kommunikation, Konto-Services, Speicher.

### Datei 3: `src/pages/portal/ArmstrongInfoPage.tsx` (UMBAU)

Die bestehenden Sektionen (Hero, USPs, 3 Schritte) bleiben erhalten. Darunter kommen die neuen/verschobenen Sektionen:

1. **KostenDashboard** — importiert von `communication-pro/agenten/KostenDashboard`
2. **SystemPreisliste** — neue konsolidierte Preisliste
3. **EmailEnrichmentCard + WhatsAppArmstrongCard** — verschoben aus `AbrechnungTab.tsx` (werden als eigenstaendige Komponenten extrahiert nach `src/components/armstrong/`)
4. **AktionsKatalog** — importiert von `communication-pro/agenten/AktionsKatalog`
5. **CTA** — angepasst: Link zu Abrechnung entfernt, stattdessen Hinweis auf Chat-Button

### Datei 4: `src/pages/portal/stammdaten/AbrechnungTab.tsx` (VERSCHLANKEN)

Was bleibt:
- Aktueller Plan (Subscription-Karte)
- Rechnungen/Invoices (Tabelle)
- Link-Banner zu `/portal/armstrong` ("Armstrong-Verbrauch und Preise ansehen")

Was entfernt wird:
- `KostenDashboard` Import + Render
- `ArmstrongCreditPreisliste` Import + Render
- `EmailEnrichmentCard` (wird nach `src/components/armstrong/` extrahiert)
- `WhatsAppArmstrongCard` (wird nach `src/components/armstrong/` extrahiert)
- `AktionsKatalog` Import + Render
- Separator + Armstrong-Header-Sektion

### Datei 5: `src/pages/portal/office/BriefTab.tsx` (LABELS)

| Zeile | Vorher | Nachher |
|---|---|---|
| 704 | `SimpleFax` | `Fax` |
| 710 | `SimpleBrief` | `Brief` |
| 729 | `'PDF wird per SimpleFax als Fax gesendet'` | `'PDF wird als Fax gesendet'` |
| 730 | `'PDF wird per SimpleBrief als Postbrief versendet'` | `'PDF wird als Brief versendet'` |

Technische Mail-Adressen (`simplefax@`, `simplebrief@`) bleiben unveraendert — das sind Backend-Konfigurationen, die der Nutzer nicht sieht.

### Datei 6 + 7: Komponenten-Extraktion

`EmailEnrichmentCard` und `WhatsAppArmstrongCard` werden aus `AbrechnungTab.tsx` in eigenstaendige Dateien extrahiert:
- `src/components/armstrong/EmailEnrichmentCard.tsx`
- `src/components/armstrong/WhatsAppArmstrongCard.tsx`

Das ermoeglicht den Import sowohl in der neuen Armstrong-Seite als auch (falls spaeter noetig) anderswo.

## Reihenfolge der Umsetzung

1. `src/config/billingConstants.ts` — Preis-SSOT
2. `src/components/armstrong/EmailEnrichmentCard.tsx` — Extraktion
3. `src/components/armstrong/WhatsAppArmstrongCard.tsx` — Extraktion
4. `src/components/armstrong/SystemPreisliste.tsx` — Konsolidierte Preisliste
5. `src/pages/portal/ArmstrongInfoPage.tsx` — Umbau zur Werbeseite + Billing Hub
6. `src/pages/portal/stammdaten/AbrechnungTab.tsx` — Verschlanken
7. `src/pages/portal/office/BriefTab.tsx` — Label-Korrektur

