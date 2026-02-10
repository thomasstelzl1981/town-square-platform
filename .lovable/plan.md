
# Einheitliche Breite: `max-w-7xl mx-auto` fuer alle Tabs

## Problem

Die Stammdaten-Tabs nutzen `max-w-7xl mx-auto px-4 py-6 md:px-6` — das sieht auf grossen Monitoren gut aus, weil der Inhalt zentriert und begrenzt ist. Alle anderen Tabs (KI-Office, DMS, Miety, Shops) nutzen nur `p-4 md:p-6` ohne Breitenbegrenzung, wodurch der Inhalt sich ueber die gesamte Bildschirmbreite streckt.

## Loesung

Alle aeusseren Wrapper bekommen das Stammdaten-Pattern:

```
max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6
```

## Betroffene Dateien (14 Dateien)

| Datei | Aktuell | Neu |
|-------|---------|-----|
| `EmailTab.tsx` | `p-4 md:p-6 space-y-4` | `max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-4` |
| `BriefTab.tsx` | `p-4 md:p-6 space-y-6` | `max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6` |
| `KontakteTab.tsx` | `p-4 md:p-6 space-y-4` | `max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-4` |
| `KalenderTab.tsx` | `p-4 md:p-6 space-y-4` (2x) | `max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-4` (2x) |
| `WhatsAppTab.tsx` | `p-4 md:p-6 space-y-4` | `max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-4` |
| `WidgetsTab.tsx` | `p-4 md:p-6 space-y-6` | `max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6` |
| `StorageTab.tsx` | `p-4 md:p-6 space-y-6` | `max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6` |
| `PosteingangTab.tsx` | `p-4 md:p-6 space-y-6` | `max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6` |
| `SortierenTab.tsx` | `p-4 md:p-6 space-y-6` | `max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6` |
| `EinstellungenTab.tsx` (DMS) | `p-4 md:p-6 space-y-6` | `max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6` |
| `MietyPortalPage.tsx` | `p-4 md:p-6 space-y-6` (2x) | `max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6` (2x) |
| `ServicesPage.tsx` | `p-4 md:p-6 space-y-6` (2x) | `max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6` (2x) |

Jede Aenderung ist ein einzeiliger className-Tausch — keine strukturellen Aenderungen.

## Nicht betroffen (bereits korrekt)
- `ProfilTab.tsx`, `VertraegeTab.tsx`, `AbrechnungTab.tsx`, `SicherheitTab.tsx` — haben bereits `max-w-7xl mx-auto`
