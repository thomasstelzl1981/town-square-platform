

## Fix: Mobile Header hinter Notch/Dynamic Island versteckt

### Problem

In `index.html` ist `viewport-fit=cover` gesetzt (Zeile 5), was den Viewport unter die Statusleiste/Notch/Dynamic Island erweitert. Aber keiner der Header-Komponenten nutzt `padding-top: env(safe-area-inset-top)` — dadurch wird der Header-Inhalt auf mobilen Geraeten vom System-UI verdeckt.

Das betrifft 3 Dateien:

### Aenderungen

**1. Zone 2 Portal — `src/components/portal/SystemBar.tsx`**

Zeile 139: Mobile Header (`<header>`) bekommt `safe-area-inset-top`:

```text
<header 
  className="sticky top-0 z-50 w-full border-b bg-card/70 backdrop-blur-lg ..."
  style={{ paddingTop: 'env(safe-area-inset-top)' }}
>
```

Zeile 207: Desktop Header ebenfalls (fuer Konsistenz auf Desktop-Macs mit Notch):

```text
<header 
  className="sticky top-0 z-50 w-full border-b bg-card/70 backdrop-blur-lg ..."
  style={{ paddingTop: 'env(safe-area-inset-top)' }}
>
```

**2. Zone 3 SoT SystemBar — `src/components/zone3/sot/SotSystemBar.tsx`**

Zeile 92: Header bekommt `safe-area-inset-top`:

```text
<header 
  className="sticky top-0 z-50 ..."
  style={{ paddingTop: 'env(safe-area-inset-top)' }}
>
```

**3. Zone 3 SoT Header — `src/components/zone3/sot/SotHeader.tsx`**

Zeile 16: Fixed Header bekommt `safe-area-inset-top`:

```text
<header 
  className="fixed top-0 left-0 right-0 z-50 sot-glass"
  style={{ paddingTop: 'env(safe-area-inset-top)' }}
>
```

### Technischer Hintergrund

- `viewport-fit=cover` ist bereits korrekt in `index.html` gesetzt
- `env(safe-area-inset-bottom)` wird bereits an 5 Stellen fuer Bottom-Bars verwendet
- `env(safe-area-inset-top)` fehlt komplett — das ist die Ursache
- Auf Geraeten ohne Notch gibt `env(safe-area-inset-top)` den Wert `0px` zurueck — kein Effekt

### Betroffene Module

- `SystemBar.tsx` — kein Modul-Pfad, frei editierbar
- `SotSystemBar.tsx` — Zone 3, kein Modul-Pfad, frei editierbar
- `SotHeader.tsx` — Zone 3, kein Modul-Pfad, frei editierbar
