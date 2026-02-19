
# Compliance-Mapping: Zone 3 Legal Pages + Zone 2 Rechtliches — Komplett-Integration

## Ist-Zustand

### Was existiert:
- **Datenbank**: 8 Website-Dokumente (4x Impressum, 4x Datenschutz) mit Status `active`, Version 1, Markdown-Inhalt
- **Datenbank**: Portal AGB + Portal Privacy mit Status `active`, Version 1
- **Zone 2 RechtlichesTab**: Funktioniert komplett — laedt `portal_agb` + `portal_privacy`, rendert Markdown mit Platzhalter-Ersetzung, Consent-Verwaltung via `user_consents`
- **Zone 1 Compliance Desk**: Verwaltung aller Dokumente mit Inline-Editoren

### Was fehlt:
- **Zone 3**: Keine der vier Websites hat eine funktionsfaehige Impressum- oder Datenschutz-Seite
- **SoT Footer**: Verlinkt auf `/website/sot/impressum` und `/website/sot/datenschutz` — Seiten existieren nicht (404)
- **Kaufy, FutureRoom, Acquiary Footers**: Verlinken auf `#` — kein Ziel
- **Keine AGB-Seiten**: SoT-Footer verlinkt auch auf `/website/sot/agb` — es gibt aber kein `website_agb`-Dokument in der DB (unklar ob noetig fuer Zone 3)
- **RechtlichesTab (Zone 2)**: Nutzt noch Collapsible fuer Texte — Volltext ist versteckt

## Plan

### 1. Gemeinsame Komponente: `Zone3LegalPage`

Eine einzige wiederverwendbare Komponente fuer alle Zone 3 Legal-Seiten. Sie:
- Erhaelt `brand` und `docType` als Props
- Laedt das passende Dokument aus `compliance_documents` + aktive Version aus `compliance_document_versions`
- Laedt das Company Profile (je nach Brand: `sot` oder `futureroom`)
- Ersetzt Platzhalter via `renderComplianceMarkdown()`
- Rendert als vollformatige Markdown-Seite mit sauberem Layout

**Datei:** `src/components/zone3/shared/Zone3LegalPage.tsx`

### 2. Routen im Manifest registrieren (4 Websites)

Fuer jede Website werden die Routen `impressum` und `datenschutz` ergaenzt:

| Website | Neue Routen |
|---------|------------|
| SoT | `impressum`, `datenschutz` (existieren schon im Footer) |
| Kaufy | `impressum`, `datenschutz` |
| FutureRoom | `impressum`, `datenschutz` |
| Acquiary | `impressum`, `datenschutz` |

**Datei:** `src/manifests/routesManifest.ts` — je 2 neue Eintraege pro Website

### 3. Wrapper-Komponenten pro Brand

Pro Brand eine kleine Wrapper-Datei die `Zone3LegalPage` mit den richtigen Props aufruft:

| Brand | Dateien |
|-------|---------|
| SoT | `src/pages/zone3/sot/SotImpressum.tsx`, `SotDatenschutz.tsx` |
| Kaufy | `src/pages/zone3/kaufy2026/Kaufy2026Impressum.tsx`, `Kaufy2026Datenschutz.tsx` |
| FutureRoom | `src/pages/zone3/futureroom/FutureRoomImpressum.tsx`, `FutureRoomDatenschutz.tsx` |
| Acquiary | `src/pages/zone3/acquiary/AcquiaryImpressum.tsx`, `AcquiaryDatenschutz.tsx` |

Jede Datei ist ca. 5 Zeilen gross — importiert nur `Zone3LegalPage` und setzt Brand + DocType.

### 4. Component Maps + Lazy Imports aktualisieren

In `ManifestRouter.tsx`:
- 8 neue Lazy-Imports hinzufuegen
- 4 Component Maps ergaenzen (je 2 neue Eintraege)

### 5. Footer-Links korrigieren

| Footer | Aenderung |
|--------|-----------|
| `SotFooter.tsx` | Links existieren schon korrekt (`/website/sot/impressum` etc.) — kein AGB-Link, da kein AGB-Dokument fuer Zone 3 existiert |
| `Kaufy2026Layout.tsx` | `href="#"` aendern zu `/website/kaufy/impressum` und `/website/kaufy/datenschutz` |
| `FutureRoomLayout.tsx` | `Link to="#"` aendern zu `/website/futureroom/impressum` und `/website/futureroom/datenschutz` |
| `AcquiaryLayout.tsx` | `Link to="#"` aendern zu `/website/acquiary/impressum` und `/website/acquiary/datenschutz` |

### 6. Zone 2 RechtlichesTab: Collapsible entfernen

Die `DocCard`-Subkomponente in `RechtlichesTab.tsx` nutzt noch Collapsible (Volltext ist versteckt). Diese werden entfernt — der Markdown-Text wird immer sichtbar angezeigt, konsistent mit dem Compliance-Desk-Standard.

### 7. AGB-Links in Footern

SoT-Footer hat einen AGB-Link, aber es gibt kein `website_agb`-Dokument. Da Zone 3 keine eigenen AGB braucht (die Portal-AGB gelten nur fuer Zone 2), wird der AGB-Link aus dem SoT-Footer entfernt. Bei Kaufy, FutureRoom und Acquiary werden die AGB-Links ebenfalls entfernt — sie haben keine eigenstaendige AGB fuer die oeffentlichen Webseiten.

## Company-Profile-Mapping

Die Platzhalter-Ersetzung nutzt den richtigen Company-Profile-Slug:

| Brand | Company Profile Slug | Firma |
|-------|---------------------|-------|
| kaufy | `futureroom` | Future Room GmbH |
| futureroom | `futureroom` | Future Room GmbH |
| acquiary | `futureroom` | Future Room GmbH |
| sot | `sot` | System of a Town GmbH |

## Datenfluss-Uebersicht

```text
compliance_documents (DB)          compliance_document_versions (DB)
  doc_key = website_imprint_kaufy    version 1, status=active, content_md
       |                                   |
       +-----------------------------------+
                      |
             Zone3LegalPage (shared component)
               - laedt Dokument + aktive Version
               - laedt Company Profile (futureroom/sot)
               - renderComplianceMarkdown() → Platzhalter ersetzen
               - ReactMarkdown rendern
                      |
       +------+-------+-------+---------+
       |      |       |       |         |
    /website  /website /website /website
    /kaufy/   /future  /sot/    /acquiary/
    impressum room/    impressum impressum
              impressum
```

## Datei-Zusammenfassung

| Aktion | Datei | Beschreibung |
|--------|-------|-------------|
| NEU | `src/components/zone3/shared/Zone3LegalPage.tsx` | Gemeinsame Komponente |
| NEU | 8x Wrapper-Dateien (je 2 pro Brand) | Impressum + Datenschutz pro Website |
| EDIT | `src/manifests/routesManifest.ts` | 8 neue Routen |
| EDIT | `src/router/ManifestRouter.tsx` | 8 Lazy-Imports + 4 Component Maps |
| EDIT | `src/components/zone3/sot/SotFooter.tsx` | AGB-Link entfernen |
| EDIT | `src/pages/zone3/kaufy2026/Kaufy2026Layout.tsx` | Footer-Links korrigieren, AGB entfernen |
| EDIT | `src/pages/zone3/futureroom/FutureRoomLayout.tsx` | Footer-Links korrigieren, AGB entfernen |
| EDIT | `src/pages/zone3/acquiary/AcquiaryLayout.tsx` | Footer-Links korrigieren, AGB entfernen |
| EDIT | `src/pages/portal/stammdaten/RechtlichesTab.tsx` | Collapsible entfernen, Volltext sichtbar |
