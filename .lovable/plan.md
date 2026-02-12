

# Plan: Kaufy-Website — Klassische Suche & Bonitats-Vorcheck

## 1. Klassische Suche im Header sichtbar machen

**Problem:** Der Mode-Toggle (Investment/Klassisch) in der SearchBar existiert bereits, ist aber nur als kleine Icons (`Calculator`/`Search`) rechts in der Cue-Bar versteckt und auf Mobile gar nicht sichtbar (`hidden md:flex`).

**Loesung:** Den Toggle als beschriftete Tabs oberhalb der Eingabefelder positionieren, sichtbar auf allen Bildschirmgroessen.

**Datei:** `src/components/zone3/kaufy2026/Kaufy2026SearchBar.tsx`

- Den bestehenden Icon-Toggle (Zeilen 166-191) entfernen
- Stattdessen oberhalb der Eingabezeile (Zeile 80) zwei beschriftete Tab-Buttons einfuegen:
  - "Investment-Suche" (Calculator-Icon + Text)
  - "Klassische Suche" (Search-Icon + Text)
- Design: Pill-Tabs mit aktivem Zustand (analog zum bestehenden Text-Toggle-Stil)
- Sichtbar auf allen Viewports (kein `hidden md:flex`)

---

## 2. Bonitats-Vorcheck als Zwischenschritt

**Problem:** Der Submit-Button "Finanzierung einreichen" erscheint direkt. Der User wuenscht einen sichtbaren Zwischenschritt mit Bonitatspruefung.

**Loesung:** Zweistufiger Footer im KaufyFinanceRequestSheet:

**Datei:** `src/components/zone3/KaufyFinanceRequestSheet.tsx`

- Neuer State: `bonitaetChecked: boolean` (default: false)
- **Stufe 1** (bonitaetChecked = false):
  - Button "Bonitatsprufung starten" (aktiviert wenn KDF-Daten vorhanden)
  - Klick: Prueft die KDF-Ampel (bereits berechnet im `kdf`-Objekt)
  - Bei gruen/gelb: `bonitaetChecked = true`, Erfolgsmeldung anzeigen
  - Bei rot: Warnmeldung anzeigen ("Bitte pruefen Sie Ihre Angaben")
- **Stufe 2** (bonitaetChecked = true):
  - Sichtbare Erfolgsmeldung: "Ihr Bonitattscheck war positiv. Herzlichen Gluckwunsch!" (gruener Banner)
  - Darunter: Button "Finanzierung einreichen" (bestehende Submit-Logik)

**Ablauf:**
```text
Formular ausfuellen
       |
[Bonitatsprufung starten]
       |
  KDF pruefen (lokal)
       |
  gruen/gelb --> Erfolgsbanner + [Finanzierung einreichen]
  rot ---------> Warnbanner ("Angaben pruefen")
```

---

## Technische Details

### SearchBar-Aenderungen (Kaufy2026SearchBar.tsx)
- Zeilen 166-191 (Icon-Toggle): Entfernen
- Neue Tab-Leiste vor Zeile 80 einfuegen:
```tsx
<div className="flex items-center gap-1 mb-3 text-sm">
  <button onClick={() => setMode('investment')}
    className={cn("px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors",
      mode === 'investment' ? "bg-[hsl(220,20%,10%)] text-white" : "text-[hsl(215,16%,55%)] hover:bg-white/60"
    )}>
    <Calculator className="w-3.5 h-3.5" /> Investment-Suche
  </button>
  <button onClick={() => setMode('classic')}
    className={cn("px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors",
      mode === 'classic' ? "bg-[hsl(220,20%,10%)] text-white" : "text-[hsl(215,16%,55%)] hover:bg-white/60"
    )}>
    <Search className="w-3.5 h-3.5" /> Klassische Suche
  </button>
</div>
```

### Finance Sheet Aenderungen (KaufyFinanceRequestSheet.tsx)
- Neuer State `bonitaetChecked` (Zeile 143)
- Sticky Footer (Zeilen 509-540) ersetzen durch zweistufige Logik:
  - Stufe 1: "Bonitatsprufung starten"-Button
  - Stufe 2: Erfolgsbanner + "Finanzierung einreichen"-Button
- Reset von `bonitaetChecked` bei Formular-Aenderungen (optional) oder beim erneuten Oeffnen

