

# Vier Promo-Bilder generieren und in Area-Widgets einsetzen

## Uebersicht

Fuer die morgige Praesentation werden vier KI-generierte Werbebilder erstellt und in die bestehenden Area-Promo-Karten eingebaut. Zusaetzlich wird der Services-Promo-Text von "PV-Offensive" auf "Armstrong Energy — Strom zum Boersenpreis" umgestellt.

## Vier Bilder — Themen und Prompts

| Area | Thema | Bild-Beschreibung |
|------|-------|-------------------|
| **Missions** | Webinar: Erfolgreich verkaufen | Elegantes Webinar-Visual mit Immobilien-Silhouette, Mikrofon-Icon und "Live"-Akzent. Dunkler, professioneller Hintergrund mit goldenen Akzenten. |
| **Operations** | Partner-Bonus Februar | Hochwertige Grafik mit Handshake/Partnerschaft-Symbolik, Provisions-Thematik, dynamische Formen in dunklem Design mit leuchtenden Akzenten. |
| **Base** | KI-Dokumentenerkennung | Stilisiertes Dokument das durch KI gescannt wird, digitale Linien und Nodes, futuristisch aber nicht aufdringlich, dunkles Armstrong-Design. |
| **Services** | Armstrong Energy — Strom zum Boersenpreis | Energie-Visual mit Strombörsen-Chart-Elementen, grüner Strom-Symbolik, modern und vertrauenswuerdig. White-Label von RABOT Energy (Strom zum Einkaufspreis/Boersenpreis). |

Die Bilder werden ueber die Lovable AI Image API (google/gemini-2.5-flash-image) generiert und als Assets gespeichert.

## Technische Aenderungen

### 1. AreaPromoContent erweitern (`areaPromoContent.ts`)

- Neues optionales Feld `imageUrl?: string` im Interface `AreaPromoContent`
- Jeder der vier Eintraege bekommt den Import-Pfad zum generierten Bild
- Services-Eintrag: Headline auf "Armstrong Energy" aendern, Beschreibung auf "Strom zum Boersenpreis — fair, transparent, guenstig."

### 2. AreaPromoCard redesignen (`AreaPromoCard.tsx`)

- Wenn `promo.imageUrl` vorhanden: Bild als Hintergrund oder prominentes Bild-Element in der Karte anzeigen
- Layout: Bild oben (ca. 60% der Kartenhoehe), Text-Overlay oder darunter mit Headline, Description, CTA
- Badge bleibt als Overlay auf dem Bild (oben rechts)
- Fallback: Ohne Bild bleibt das aktuelle Text-Layout bestehen

### 3. Vier Bilder generieren und speichern

- `src/assets/promo-missions-webinar.png`
- `src/assets/promo-operations-partner.png`
- `src/assets/promo-base-ki-docs.png`
- `src/assets/promo-services-energy.png`

Format: 16:9-aehnlich (ca. 800x450), dunkler Armstrong-Stil, keine aufdringliche Werbung.

## Services-Promo-Text aendern

```text
Aktuell:
  headline: 'PV-Offensive 2026'
  description: '20% Rabatt auf Solar-Beratungen...'

Neu:
  headline: 'Armstrong Energy'
  description: 'Strom zum Boersenpreis — fair, transparent und guenstig. 100% Oekostrom.'
  ctaLabel: 'Mehr erfahren'
  badge: 'NEU'
```

## Betroffene Dateien

| Aktion | Datei |
|--------|-------|
| Aendern | `src/config/areaPromoContent.ts` (imageUrl-Feld + Services-Text) |
| Aendern | `src/components/portal/AreaPromoCard.tsx` (Bild-Anzeige einbauen) |
| Neu | `src/assets/promo-missions-webinar.png` |
| Neu | `src/assets/promo-operations-partner.png` |
| Neu | `src/assets/promo-base-ki-docs.png` |
| Neu | `src/assets/promo-services-energy.png` |

## Risiko

Niedrig. Rein visuelle Aenderungen an den Promo-Karten. Keine Berechnungslogik oder Navigation betroffen.

