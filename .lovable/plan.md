

# Einheitliche Mobile Bottom Bar: Persistente Armstrong-Eingabe + Upload

## Problem

Aktuell gibt es zwei komplett unterschiedliche Bottom-Bereiche auf Mobile:

1. **Home/Chat** (`MobileHomeChatView`): 4 Area-Glasbuttons + Eingabefeld mit Voice + Send
2. **Modul-Ansichten** (`MobileModuleBar`): 5 Icon-Buttons (Chat + 4 Areas) ohne Eingabefeld

Das fuehrt zu einem visuellen Bruch: Die Buttons aendern sich (4 vs. 5), das Eingabefeld verschwindet, und die gesamte Optik springt.

## Loesung: Eine einheitliche `MobileBottomBar`

Eine einzelne Komponente, die **ueberall** gleich aussieht:

```text
+--------------------------------------------------+
|  [Base] [Missions] [Operations] [Services]       |  <-- 4 Glass-Buttons (immer gleich)
+--------------------------------------------------+
|  [Mic] [+] [Nachricht eingeben...] [Send]        |  <-- Input Bar (immer sichtbar)
+--------------------------------------------------+
```

### Verhalten

- **Auf Home**: Nachrichten erscheinen direkt im Chat darueber
- **In Modulen**: Nachricht wird gesendet, dann automatischer Wechsel zurueck zum Chat (`/portal`)
- **Area-Buttons**: Immer 4 Stueck (Base, Missions, Operations, Services) — kein separater "Chat"-Button noetig, da die Input Bar selbst der Rueckweg ist
- **Upload-Button [+]**: Oeffnet ein Menue mit: "Datei anfuegen", "Foto aus Mediathek", "Fotografieren"

### Upload-Menue (wie Lovable Mobile)

Der `[+]` Button oeffnet ein kompaktes Popover/Sheet:

```text
+---------------------------+
|  Datei anfuegen           |
|  Foto aus Mediathek       |
|  Fotografieren            |
+---------------------------+
```

- Nutzt `<input type="file">` fuer Dateien
- Nutzt `<input type="file" accept="image/*" capture="environment">` fuer Kamera
- Angehaengte Dateien werden als Vorschau-Chips ueber der Input Bar angezeigt
- Dateien gehen mit der naechsten Nachricht an Armstrong

## Technische Umsetzung

### Dateien

| Datei | Aktion | Beschreibung |
|-------|--------|-------------|
| `src/components/portal/MobileBottomBar.tsx` | CREATE | Neue einheitliche Komponente (ersetzt MobileModuleBar + Input aus MobileHomeChatView) |
| `src/components/portal/MobileAttachMenu.tsx` | CREATE | Upload-Popover mit 3 Optionen |
| `src/components/portal/MobileHomeChatView.tsx` | EDIT | Area-Buttons und Input Bar entfernen, nur Chat-Messages behalten |
| `src/components/portal/PortalLayout.tsx` | EDIT | `MobileBottomBar` einmal am Ende rendern (statt MobileModuleBar nur in Modulen) |
| `src/components/portal/MobileModuleBar.tsx` | ENTFAELLT | Wird durch MobileBottomBar ersetzt |

### Aenderungen im Detail

**1. `MobileBottomBar.tsx` (NEU)**
- Nimmt die 4 Area-Glasbuttons aus `MobileHomeChatView` (Zeilen 161-182)
- Nimmt die Input Bar aus `MobileHomeChatView` (Zeilen 184-227)
- Fuegt einen `[+]` Upload-Button links neben dem Mic-Button ein
- Erhaelt `onSendFromModule`-Prop: wenn nicht auf `/portal`, nach Send zu `/portal` navigieren
- Voice-Integration bleibt identisch

**2. `MobileAttachMenu.tsx` (NEU)**
- Wird durch den `[+]` Button getriggert
- 3 Optionen: Datei, Mediathek-Foto, Kamera
- Gibt ausgewaehlte Files via Callback zurueck
- Datei-Vorschau als kleine Chips ueber der Input Bar

**3. `MobileHomeChatView.tsx` (EDIT)**
- Zeilen 148-227 entfernen (Clear-Button, Area-Buttons, Input Bar)
- Nur noch Chat-Messages + Loading-State behalten
- Clear-Button kann in die `MobileBottomBar` oder als Overlay bleiben

**4. `PortalLayout.tsx` (EDIT)**
- Zeile 138 (`<MobileModuleBar />`) entfernen
- `<MobileBottomBar />` einmal am Ende der mobilen Layout-Struktur rendern, AUSSERHALB des `isDashboard`-Conditionals
- Damit ist die Bar ueberall sichtbar

### Layout-Struktur (nachher)

```text
<div className="h-screen flex flex-col">
  <SystemBar />
  
  {isDashboard ? (
    <MobileHomeChatView />      // Nur Chat-Messages, kein Input
  ) : (
    <main>
      <SubTabs />
      <Outlet />
    </main>
  )}
  
  <MobileBottomBar />           // IMMER sichtbar: Buttons + Input + Upload
</div>
```

## Kein Breaking Change

- Armstrong Advisor Hook wird weiter verwendet (gleiche send/voice Logik)
- Area-Navigation-Logik bleibt identisch
- Desktop-Layout ist nicht betroffen
- Alte `MobileBottomNav.tsx` und `ArmstrongInputBar.tsx` bleiben unangetastet (werden ohnehin nicht mehr importiert)

