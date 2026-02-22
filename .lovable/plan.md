

## Fix: Swipe-Back vom Briefgenerator soll direkt zum Dashboard fuehren

### Problem

Wenn man auf Mobile vom Dashboard direkt den Briefgenerator oeffnet (`/portal/office/brief`), fuehrt ein Swipe-Back zu `/portal/office` (KI Office Untermenue mit WhatsApp, Videocalls etc.). Das ist verwirrend, weil der Nutzer nie die KI Office Uebersicht gesehen hat — er kam direkt vom Dashboard.

### Ursache

`useSwipeBack` in `src/hooks/useSwipeBack.ts` entfernt einfach das letzte Pfad-Segment:
- `/portal/office/brief` wird zu `/portal/office`

### Loesung

Eine **Mobile-Override-Map** in `useSwipeBack.ts` einfuegen: Fuer bestimmte Pfade wird auf Mobile ein anderes Ziel definiert statt des normalen Eltern-Pfads.

```text
Mobile Swipe-Back Overrides:
/portal/office/brief    -->  /portal    (statt /portal/office)
/portal/office/widgets  -->  /portal    (statt /portal/office)
/portal/office/whatsapp -->  /portal    (statt /portal/office)
```

Die Regel dahinter: Alle KI Office Sub-Routen sollen auf Mobile direkt zum Dashboard zurueckfuehren, da das KI Office Untermenue auf Mobile keinen Sinn macht (Nutzer kommt immer direkt ueber Dashboard-Kacheln).

### Technische Umsetzung

**Datei: `src/hooks/useSwipeBack.ts`**

1. Eine Konstante `MOBILE_SWIPE_OVERRIDES` definieren:

```text
const MOBILE_SWIPE_OVERRIDES: Record<string, string> = {
  '/portal/office/brief': '/portal',
  '/portal/office/widgets': '/portal',
  '/portal/office/whatsapp': '/portal',
  '/portal/office/videocalls': '/portal',
};
```

2. In `handleTouchEnd` vor dem `navigate(getParentRoute(...))` pruefen, ob ein Override existiert:

```text
if (deltaX > 80 && deltaY < 50) {
  const clean = location.pathname.replace(/\/+$/, '');
  if (clean !== '/portal') {
    const override = MOBILE_SWIPE_OVERRIDES[clean];
    navigate(override || getParentRoute(clean));
  }
}
```

3. Zusaetzlich `getParentRoute` in `SystemBar.tsx` (Zurueck-Button) ebenfalls die Overrides beruecksichtigen lassen. Dazu eine neue Export-Funktion `getMobileBackTarget(pathname)` erstellen, die sowohl von `useSwipeBack` als auch von `SystemBar` genutzt wird.

**Datei: `src/components/portal/SystemBar.tsx`**

- Den Zurueck-Button-Link ebenfalls auf `getMobileBackTarget` umstellen, damit Swipe und Button-Klick konsistent sind.

### Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/hooks/useSwipeBack.ts` | Override-Map + `getMobileBackTarget()` Export hinzufuegen |
| `src/components/portal/SystemBar.tsx` | Zurueck-Button nutzt `getMobileBackTarget()` statt `getParentRoute()` |

Beide Dateien liegen ausserhalb der Modul-Pfade — keine Freeze-Pruefung noetig.

