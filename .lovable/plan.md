

# Widget-Typografie Redesign — Groessere Schrift, weniger Clutter

## Problem

Alle Widgets verwenden durchgehend winzige Schriftgroessen (`text-[10px]`, `text-[11px]`, `text-[9px]`, `text-xs`) und enthalten kleine Buttons mit Zusatzinformationen (Refresh-Buttons, "Live"-Badges, "via ZenQuotes", "Kein Autoplay", Kosten-Badges etc.), die das Interface unruhig machen.

## Loesung

Schriftgroessen hochsetzen, alle kleinen Info-Buttons und Footer-Texte entfernen.

---

## Aenderungen pro Widget

### 1. FinanceWidget.tsx
| Element | Vorher | Nachher |
|---|---|---|
| Header-Titel "Maerkte" | `text-xs` | `text-sm` |
| "Live" Label | `text-[10px]` + gruener Punkt | **Nur gruener Punkt**, Text entfernt |
| Symbol-Spalte | `text-[11px]` | `text-sm` |
| Wert-Spalte | `text-[11px]` | `text-sm` |
| Change-Anzeige | `text-[10px]` | `text-xs` |

### 2. NewsWidget.tsx
| Element | Vorher | Nachher |
|---|---|---|
| Header-Titel "Nachrichten" | `text-xs` | `text-sm` |
| Headline-Text | `text-[11px]` | `text-sm` |
| Source/Time Zeile | `text-[10px]` + ExternalLink-Icon | **Entfernt** |

### 3. SpaceWidget.tsx
| Element | Vorher | Nachher |
|---|---|---|
| Header-Titel "Space" | `text-xs` | `text-sm` |
| **Refresh-Button** (Header rechts) | vorhanden | **Entfernt** |
| Titel des Bildes | `text-xs` | `text-sm` |
| Erklaerungstext | `text-[10px]` | `text-xs` |
| "HD ansehen" Link | `text-[10px]` | **Entfernt** |
| Footer "NASA APOD • Datum" | `text-[10px]` | **Entfernt** |
| **Retry-Button** (bei Error) | Button mit Text | Nur Icon-Klick auf Karte |

### 4. QuoteWidget.tsx
| Element | Vorher | Nachher |
|---|---|---|
| Header-Titel "Zitat des Tages" | `text-xs` | `text-sm` |
| **Refresh-Button** (Header rechts) | vorhanden | **Entfernt** |
| Zitat-Text | `text-sm` | `text-base` |
| Autor | `text-xs` | `text-sm` |
| Footer "via ZenQuotes" / "Offline-Zitat" | `text-[10px]` | **Entfernt** |
| **Retry-Button** (bei Error) | Button mit Text | Nur Icon |

### 5. RadioWidget.tsx
| Element | Vorher | Nachher |
|---|---|---|
| Header-Titel "Radio" | `text-xs` | `text-sm` |
| "Live" Label | `text-[10px]` | **Nur gruener Punkt**, Text entfernt |
| Sendername | `text-xs` | `text-sm` |
| Land/Tags | `text-[10px]` | **Entfernt** |
| Footer "Kein Autoplay" | `text-[10px]` | **Entfernt** |
| **Retry-Button** (bei Error) | Button mit Text | Nur Icon |

### 6. PVLiveWidget.tsx
| Element | Vorher | Nachher |
|---|---|---|
| Einheiten-Labels ("kW", "kWh heute", "Offline") | `text-[10px]` | `text-xs` |
| Anlagenliste | `text-xs` + `text-muted-foreground` | `text-sm` |

### 7. BrandLinkWidget.tsx
| Element | Vorher | Nachher |
|---|---|---|
| Tagline | `text-[10px]` | `text-xs` |
| Beschreibung | `text-[11px]` | `text-sm` |
| Footer "Website oeffnen" + ExternalLink | `text-[11px]` | **Entfernt** |

### 8. ArmstrongGreetingCard.tsx
| Element | Vorher | Nachher |
|---|---|---|
| "Armstrong" Titel | `text-sm` | `text-base` |
| **"KI" Badge** | vorhanden | **Entfernt** |
| Nachrichtentext | `text-xs` | `text-sm` |
| Event-Chips | `text-[10px]` | `text-xs` |
| Event-Zeitangabe | `text-[10px]` Uhrzeiten | **Entfernt** (nur Titel bleibt) |
| "+2" Zaehler | `text-[10px]` | `text-xs` |

### 9. WeatherCard.tsx
| Element | Vorher | Nachher |
|---|---|---|
| Stadt-Name | `text-[10px]` | `text-xs` |
| Wetter-Beschreibung | `text-xs` | `text-sm` |
| Wind/Luftfeuchtigkeit | `text-xs` | `text-sm` |
| "5-Tage Vorschau" Label | `text-[10px]` | **Entfernt** (Vorschau erklaert sich selbst) |
| Tagesname | `text-[9px]` | `text-xs` |
| Temperatur | `text-[9px]` | `text-xs` |

### 10. EarthGlobeCard.tsx
| Element | Vorher | Nachher |
|---|---|---|
| Koordinaten LAT/LNG | `text-[10px]` | `text-xs` |
| **Zoom-Button** | vorhanden | **Entfernt** |
| Lade-Text "Lade 3D-Globus..." | `text-xs` | bleibt |

### 11. TaskWidget.tsx
| Element | Vorher | Nachher |
|---|---|---|
| Typ-Label | `text-[10px]` | `text-xs` |
| **Risk-Badge** (Header rechts) | `text-[9px]` Badge | **Entfernt** |
| Titel | `text-sm` | `text-base` |
| Beschreibung | `text-xs` | `text-sm` |
| Zeitangabe | `text-[10px]` | **Entfernt** |
| **Kosten-Badge** | `text-[9px]` Badge | **Entfernt** |

### 12. WidgetHeader.tsx (Shared)
| Element | Vorher | Nachher |
|---|---|---|
| Titel | `text-base` | bleibt `text-base` (bereits angepasst) |

---

## Zusammenfassung der Entfernungen

Folgende Elemente werden komplett entfernt:

- **Refresh-Buttons** in Space und Quote Widgets
- **"KI" Badge** in Armstrong
- **Risk-Badge und Kosten-Badge** in TaskWidget
- **Footer-Texte**: "via ZenQuotes", "NASA APOD • Datum", "Kein Autoplay", "Website oeffnen"
- **"HD ansehen" Link** im Space Widget
- **Source/Time Zeile** in News Widget
- **Land/Tags** im Radio Widget
- **"5-Tage Vorschau" Label** im Weather Widget
- **Zoom-Button** im Globe Widget
- **"Live" Textlabel** (gruener Punkt bleibt)
- **Zeitangabe "vor X Minuten"** in TaskWidget

## Betroffene Dateien (12 Dateien)

Alle unter `src/components/dashboard/`:
1. `widgets/FinanceWidget.tsx`
2. `widgets/NewsWidget.tsx`
3. `widgets/SpaceWidget.tsx`
4. `widgets/QuoteWidget.tsx`
5. `widgets/RadioWidget.tsx`
6. `widgets/PVLiveWidget.tsx`
7. `widgets/BrandLinkWidget.tsx`
8. `WeatherCard.tsx`
9. `ArmstrongGreetingCard.tsx`
10. `TaskWidget.tsx`
11. `EarthGlobeCard.tsx`
12. `../shared/WidgetHeader.tsx` (Kontrolle, ob bereits ok)

Keine Logik-Aenderungen, keine DB-Aenderungen. Rein visuelle Bereinigung.

