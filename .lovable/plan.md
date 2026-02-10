
# MOD-16 Shops — Zum Leben erwecken

## Probleme (IST-Zustand)

1. **Doppelte Ueberschrift "Services"**: Die Index-Route zeigt die alte HowItWorks-Seite mit Titel "Services" und veralteten Inhalten (Katalog, Anfragen, Auftraege). Diese Seite wird beim Oeffnen von MOD-16 als erstes angezeigt — das muss weg.
2. **Shop-Tabs sind kahl**: Nur ein kleines Icon, Name, Beschreibung und tote Credential-Felder. Keine visuelle Lebendigkeit.
3. **Bestellungen-Tab wirkt leer**: Formularfelder ohne Kontext, kein visuelles Widget-Feeling.
4. **moduleContents MOD-16** ist noch auf alte "Services" Struktur gemappt (Katalog/Anfragen/Auftraege).

## Loesung

### 1. Index-Route ersetzen — kein HowItWorks mehr

Statt `ModuleHowItWorks` wird die Index-Route direkt auf den ersten Tab (Amazon Business) umgeleitet. Das entfernt die sinnlose Subheadline komplett.

### 2. moduleContents MOD-16 aktualisieren

In `moduleContents.ts`:
- `title: "Shops"` statt "Services"
- `oneLiner`, `benefits`, `whatYouDo`, `flows`, `cta` aktualisieren auf Shops-Kontext
- `subTiles` auf die 4 neuen Tabs mappen (amazon, otto-office, miete24, bestellungen)

### 3. Shop-Tabs visuell zum Leben erwecken

Jeder Shop-Tab bekommt ein reichhaltiges Layout:

**A) Hero-Bereich mit Branding:**
- Farbiger Header-Gradient pro Shop (Amazon: Orange, OTTO: Blau, Miete24: Gruen)
- Grosser Shop-Name mit passendem Icon
- Tagline / USP des Shops

**B) Suchleiste (UI-Platzhalter):**
- Suchfeld im Stil des jeweiligen Shops ("Produkte auf Amazon Business suchen...")
- Kategorie-Chips darunter (z.B. "Buerobedarf", "IT-Zubehoer", "Druckerzubehoer")

**C) Produkt-Grid (leere Platzhalter-Kacheln):**
- 6 leere Produktkarten im Grid (aspect-square)
- Jede Karte: Grauer Bildplatzhalter, "Produktname", "ab X,XX EUR/Monat" (bei Miete24) oder "Preis auf Anfrage"
- Keine echten Produktdaten — nur Strukturplatzhalter mit dezenten Animationen

**D) Integration-Card bleibt, aber kompakter:**
- Zusammengeklappt als Accordion am unteren Rand
- Status-Badge + Credential-Felder nur bei Bedarf sichtbar

**Shop-spezifische Details:**
- **Amazon Business**: Kategorien: Buerobedarf, IT-Zubehoer, Reinigung, Breakroom. Suchleiste mit Amazon-Styling (orange Akzent).
- **OTTO Office**: Kategorien: Schreibwaren, Druckerzubehoer, Bueromoebl. Blauer Akzent. 75.000+ Artikel Hinweis.
- **Miete24**: Kategorien: Laptops, Monitore, Drucker, Software. Gruener Akzent. Laufzeit-Auswahl (12/24/36 Monate).

### 4. Bestellungen-Tab aufwerten

- Bestellzettel-Widget bekommt einen visuellen Rahmen: Seitenleiste mit "Bestellnummer", Status-Badge ("Entwurf"), Erstelldatum
- Positions-Tabelle bekommt dezente Zebra-Streifen und leicht abgerundete Ecken
- Summenblock visuell prominenter (leichter Hintergrund, groessere Schrift fuer Gesamt)
- Empty-State mit Icon + Text "Ihre erste Bestellung — fuellen Sie die Felder aus"

## Technische Aenderungen

| Datei | Aenderung |
|---|---|
| `src/pages/portal/ServicesPage.tsx` | Index-Route → Redirect auf amazon. ShopTab komplett neu: Hero-Gradient, Suchleiste, Produkt-Grid-Platzhalter, kompakte Integration. BestellungenTab: visuelles Upgrade. |
| `src/components/portal/HowItWorks/moduleContents.ts` | MOD-16: title "Shops", aktualisierte Texte und subTiles |

### Keine Datenbank-Aenderungen noetig
Reines Frontend-Redesign.
