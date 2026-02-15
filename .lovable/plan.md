

# PWA Desktop-Installation -- Analyse und Massnahmenplan

## IST-Zustand Analyse

### Was bereits funktioniert
- `vite-plugin-pwa` ist installiert und konfiguriert
- Web-Manifest vorhanden mit Name, Icons, Theme-Color
- Service Worker mit Workbox (autoUpdate, OAuth-Denylist)
- `/install`-Seite existiert mit `beforeinstallprompt`-Handling
- Mobile Meta-Tags in `index.html` korrekt gesetzt

### Identifizierte Probleme fuer Desktop-PWA

**Problem 1: `orientation: "portrait-primary"` blockiert Desktop**
Das Manifest erzwingt Hochformat. Auf Desktop-Browsern fuehrt das dazu, dass die installierte App in einem schmalen Hochformat-Fenster startet oder die Installation verweigert wird. Desktop braucht `"any"` oder gar keine Orientation-Angabe.

**Problem 2: Fehlende Desktop-Screenshots im Manifest**
Chrome zeigt seit Version 120+ eine "Richer Install UI" mit Screenshots. Ohne `screenshots`-Array im Manifest erscheint nur der minimalistische Install-Dialog. Mit Screenshots sieht der Prompt professionell aus und erhoet die Installationsrate.

**Problem 3: Keine Manifest-Shortcuts**
Desktop-PWAs unterstuetzen App-Shortcuts (Rechtsklick auf Taskbar-Icon). Ohne Shortcuts fehlt ein wichtiger Desktop-Komfort (z.B. "Suche", "Dashboard", "Dokumente").

**Problem 4: Install-Seite ist rein mobil-orientiert**
Die `/install`-Seite zeigt ein Smartphone-Icon und nur mobile Anleitungen (iOS Safari, Android). Es gibt keine Desktop-spezifische Anleitung (Chrome/Edge Adressleisten-Icon, Tastenkuerzel).

**Problem 5: Kein Desktop-Install-Banner in der App**
Es gibt keinen dezenten Hinweis innerhalb der Haupt-App (z.B. im SystemBar oder als Toast), der Desktop-Nutzer auf die Installationsmoeglichkeit hinweist.

**Problem 6: Keine `display_override` fuer Desktop**
Desktop-PWAs koennen `window-controls-overlay` nutzen, um die Titelleiste in die App zu integrieren -- fuer ein noch nativeres Feeling.

**Problem 7: Fehlendes Favicon-Link-Tag**
Es gibt eine `favicon.ico` im `/public`-Ordner, aber kein `<link rel="icon">` in `index.html`. Browser nutzen den Fallback, aber ein expliziter Link ist Best Practice.

---

## Massnahmenplan

### Schritt 1: Manifest Desktop-tauglich machen

**Datei: `vite.config.ts`**
- `orientation` von `"portrait-primary"` auf `"any"` aendern
- `display_override: ["window-controls-overlay", "standalone"]` hinzufuegen
- `screenshots`-Array mit Desktop- und Mobile-Screenshots (Form-Factor `wide` und `narrow`)
- `shortcuts`-Array mit 3-4 Schnellzugriffen (Suche, Dashboard, Dokumente, Finanzierung)
- Zusaetzliche Icon-Groessen: 144x144, 384x384 fuer breitere Abdeckung

### Schritt 2: Install-Seite fuer Desktop erweitern

**Datei: `src/pages/Install.tsx`**
- Geraete-Erkennung erweitern: `isDesktop` neben `isIOS`
- Desktop-Bereich: Monitor-Icon statt Smartphone, Anleitung fuer Chrome (Adressleisten-Icon), Edge (App installieren im Menue), Tastenkuerzel
- Responsive Layout: Auf Desktop breitere Card (max-w-lg), Feature-Liste (Offline, Schnellstart, Shortcuts)
- `beforeinstallprompt`-Button funktioniert bereits -- wird fuer Desktop prominent angezeigt

### Schritt 3: In-App Desktop-Install-Hinweis

**Neue Datei: `src/components/shared/DesktopInstallBanner.tsx`**
- Dezenter Banner oder Toast der erscheint wenn:
  - `beforeinstallprompt` Event gefeuert wird
  - Nutzer auf Desktop ist (nicht bereits installiert)
  - Banner wurde nicht bereits dismissed (localStorage-Flag)
- Zeigt: "Armstrong als Desktop-App installieren" + Install-Button + Dismiss
- Wird in `PortalLayout.tsx` oder `SystemBar.tsx` eingebunden

### Schritt 4: Favicon-Link und OG-Image

**Datei: `index.html`**
- `<link rel="icon" href="/favicon.ico" type="image/x-icon">` hinzufuegen
- Optional: SVG-Favicon fuer scharfe Darstellung in modernen Browsern

### Schritt 5: Backlog aktualisieren

**Datei: `spec/audit/mobile_ux_backlog.json`**
- Neue Phase 6 "PWA Desktop" mit Tickets:
  - MUX-050: Manifest Desktop-Optimierung (orientation, display_override, shortcuts)
  - MUX-051: Screenshots fuer Richer Install UI
  - MUX-052: Install-Seite Desktop-Erweiterung
  - MUX-053: DesktopInstallBanner Komponente
  - MUX-054: Favicon-Link in index.html

---

## Technische Details

### Neue Dateien
1. `src/components/shared/DesktopInstallBanner.tsx` -- In-App Install-Hinweis fuer Desktop

### Geaenderte Dateien
1. `vite.config.ts` -- Manifest: orientation, display_override, shortcuts, screenshots
2. `src/pages/Install.tsx` -- Desktop-Erkennung und -Anleitungen
3. `index.html` -- Favicon-Link-Tag
4. `spec/audit/mobile_ux_backlog.json` -- Phase 6 hinzufuegen

### Manifest-Erweiterungen (Auszug)
```text
orientation: "any"
display_override: ["window-controls-overlay", "standalone"]
shortcuts:
  - name: "Immo-Suche"     url: "/portal/investments/suche"
  - name: "Dashboard"       url: "/portal"
  - name: "Dokumente"       url: "/portal/stammdaten/dms"
  - name: "Finanzierung"    url: "/portal/finanzierung"
screenshots:
  - src: "/screenshots/desktop-dashboard.png"  sizes: "1920x1080"  form_factor: "wide"
  - src: "/screenshots/mobile-suche.png"       sizes: "390x844"    form_factor: "narrow"
```

