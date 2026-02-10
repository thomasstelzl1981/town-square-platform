
# Zwei Bereiche: Area Base Design + E-Mail-Aktionen reparieren

## 1. Area Base — Homogenes Card-Design

Die Module-Cards auf `/portal/area/base` (Miety, KI-Office, Dokumente, Shops, Stammdaten) und die Promo-Card bekommen ein einheitliches, hochwertiges Design.

### Aenderungen in `AreaModuleCard.tsx`
- Glassmorphism-Stil (`glass-card`) fuer alle Karten, passend zum KI-Office-Standard
- Einheitliche Hoehe durch `min-h-[280px]` (Desktop)
- Dezenter Gradient-Rand bei Hover (`border-primary/30`)
- Module-Code Badge oben links dezenter (kein `font-mono`, stattdessen kleiner Chip)
- Sub-Tiles als abgerundete Chips mit Primary-Akzent statt grauem `bg-muted`
- CTA-Button einheitlich als `variant="default"` statt `variant="outline"`

### Aenderungen in `AreaPromoCard.tsx`
- Gleiche Kartenhoehe (`min-h-[280px]`) wie die Module-Cards
- Icon-Bereich subtiler gestaltet
- Gradient bleibt, aber dezenter (weniger `from-primary/10`)

---

## 2. E-Mail-Client — Aktionsbuttons funktional machen

### Problem
- Die drei Buttons am unteren Rand der E-Mail-Detailansicht ("Antworten", "Allen antworten", "Weiterleiten") haben **keine onClick-Handler**
- In der E-Mail-Liste (Inbox) gibt es **keine Aktions-Icons** (Loeschen, Archivieren) pro Zeile
- Die Icons fuer Reply/Forward sind alle `Send` — sie sollten spezifische Icons haben (`Reply`, `ReplyAll`, `Forward`)

### Aenderungen in `EmailTab.tsx`

**a) Reply/Forward-Buttons funktional machen (Zeilen 801-813):**
- Neue Icons importieren: `Reply`, `ReplyAll`, `Forward` aus `lucide-react`
- `Antworten` oeffnet den ComposeDialog mit:
  - `to` = Absender der E-Mail
  - `subject` = "Re: " + Original-Betreff
  - `body` = Quoted Original (mit "Am [Datum] schrieb [Absender]:" Prefix)
- `Allen antworten` wie oben, aber `to` = Absender + alle `to_addresses` (ohne eigene Adresse)
- `Weiterleiten` oeffnet den ComposeDialog mit:
  - `to` = leer
  - `subject` = "Fwd: " + Original-Betreff
  - `body` = Quoted Original (mit "Weitergeleitete Nachricht" Header)

**b) ComposeEmailDialog um Prefill-Props erweitern:**
- Neue optionale Props: `initialTo`, `initialSubject`, `initialBody`
- Beim Oeffnen werden diese Felder vorbelegt
- Beim Schliessen werden sie zurueckgesetzt

**c) Inbox-Liste — Hover-Aktionen pro E-Mail (Zeilen 652-683):**
- Bei Hover ueber eine E-Mail-Zeile erscheinen rechts kleine Icon-Buttons:
  - Loeschen (Trash2) — ruft `deleteMutation.mutate(msg.id)` auf
  - Archivieren (Archive) — ruft `archiveMutation.mutate(msg.id)` auf
  - Stern (Star) — ruft `toggleStarMutation.mutate()` auf
- Diese Buttons sind absolut positioniert und erscheinen nur bei `group-hover`

**d) E-Mail-Detail-Header — fehlende Loeschen/Archiv-Buttons sichtbarer:**
- Die bestehenden Star/Archive/Delete-Buttons im Header (Zeilen 730-757) existieren bereits und sind funktional — diese bleiben unveraendert

---

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/components/portal/AreaModuleCard.tsx` | Glassmorphism-Design, einheitliche Hoehe |
| `src/components/portal/AreaPromoCard.tsx` | Gleiche Hoehe, dezenterer Stil |
| `src/pages/portal/office/EmailTab.tsx` | Reply/Forward/Delete funktional, Inbox Hover-Aktionen, neue Icons |
| `src/components/portal/office/ComposeEmailDialog.tsx` | Prefill-Props fuer Reply/Forward |
