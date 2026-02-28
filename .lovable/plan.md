

# Audit: Impressum & Datenschutz — Alle 7 Brands

## Befund

### Status-Übersicht

| Brand | Impressum | Datenschutz | System | Footer-Link | Problem |
|-------|-----------|-------------|--------|-------------|---------|
| **Kaufy** | ✅ vorhanden | ✅ vorhanden | Compliance Desk (DB) | ✅ vorhanden | -- |
| **FutureRoom** | ✅ vorhanden | ✅ vorhanden | Compliance Desk (DB) | ✅ vorhanden | -- |
| **SoT** | ✅ vorhanden | ✅ vorhanden | Compliance Desk (DB) | ✅ vorhanden | -- |
| **Acquiary** | ✅ vorhanden | ✅ vorhanden | Compliance Desk (DB) | ✅ vorhanden | -- |
| **Lennox** | ✅ vorhanden | ✅ vorhanden | Compliance Desk (DB) | ✅ vorhanden | -- |
| **Ncore** | ✅ Inhalt vorhanden | ✅ Inhalt vorhanden | **Eigene TSX** (nicht Compliance Desk) | ❌ **FEHLT im Footer** | Seiten existieren, sind aber nicht erreichbar |
| **Otto²** | ✅ Inhalt vorhanden | ✅ Inhalt vorhanden | **Eigene TSX** (nicht Compliance Desk) | ✅ vorhanden | -- |

### Kernprobleme

1. **Ncore Footer fehlen Impressum/Datenschutz-Links** — Die Seiten `NcoreImpressum.tsx` (176 Zeilen, vollständig DDG-konform) und `NcoreDatenschutz.tsx` (376 Zeilen, vollständige DSGVO-Erklärung) existieren und sind im Router registriert, aber der **Ncore Footer** enthält keine Links dorthin. Benutzer können die Seiten nicht finden.

2. **Ncore + Otto² sind NICHT mit dem Compliance Desk verschaltet** — Beide Brands verwenden eigenständige TSX-Dateien mit vollständig hardcodiertem Rechtstext (kein `Zone3LegalPage`, keine DB-Anbindung). Das bedeutet: Änderungen müssen direkt im Code gemacht werden, nicht über den Compliance Desk.

### Inhaltsprüfung der hardcodierten Seiten

| Seite | Inhalt korrekt? | Details |
|-------|-----------------|---------|
| NcoreImpressum | ✅ Vollständig | § 5 DDG, Komplementär (HRB 307081), KG (HRA 121933), USt-IdNr. DE459006252, § 18 MStV, Streitschlichtung, Haftung |
| NcoreDatenschutz | ✅ Vollständig | 376 Zeilen, DSGVO/TTDSG/DDG, IONOS-Hosting, Server-Logs, Kontaktformular, Betroffenenrechte, BayLDA |
| OttoImpressum | ✅ Vollständig | § 5 DDG, ZL Finanzdienstleistungen GmbH, HRB 13762, § 34d GewO, Vermittlerregister |
| OttoDatenschutz | ✅ Vollständig | 16 Paragraphen, DSGVO-konform, IONOS AVV, Cookies, Betroffenenrechte |

---

## Plan

### Schritt 1: Ncore Footer — Impressum/Datenschutz-Links ergänzen
- `src/pages/zone3/ncore/NcoreLayout.tsx` — Im Footer-Bereich unter "Unternehmen" die Links `/website/ncore/impressum` und `/website/ncore/datenschutz` hinzufügen
- Zusätzlich: Copyright-Zeile unten mit Impressum/Datenschutz-Kurzlinks (wie bei Kaufy und Otto²)

### Schritt 2: (Optional, empfohlen) Migration auf Compliance Desk
- Ncore und Otto² könnten perspektivisch auf `Zone3LegalPage` migriert werden, damit Rechtstexte zentral über den Compliance Desk gepflegt werden
- Erfordert: Anlage der Dokumente `website_imprint_ncore`, `website_privacy_ncore`, `website_imprint_otto`, `website_privacy_otto` in der DB + Registrierung der Brands in `BRAND_PROFILE_MAP`
- **Nicht zwingend jetzt** — die TSX-Inhalte sind korrekt und vollständig

