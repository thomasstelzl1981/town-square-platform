

# Switch-Toggle fuer Chat/Module in der MobileBottomBar

## Idee

Statt dass der Chat automatisch beim Tippen umschaltet, kommt ein visueller **Switch-Toggle** (wie bei Lovable: "Chat | Preview") in die MobileBottomBar. Der User kann selbst zwischen den beiden Ansichten wechseln.

## Aufbau

```text
+----------------------------------+
| SystemBar                        |
+----------------------------------+
|                                  |
| [Module-Liste ODER Chat-View]    |
|                                  |
+----------------------------------+
| [Home] [Client] [Service] [Base] |
|                                  |
|   [ Module | Chat ]  <-- Switch  |
|                                  |
| [Mic] [+] [Eingabe...] [Send]   |
+----------------------------------+
```

Der Switch sitzt zwischen den Area-Buttons und der Eingabeleiste. Zwei Segmente: **"Module"** (links) und **"Chat"** (rechts). Der aktive Zustand wird visuell hervorgehoben (wie Lovable's Toggle).

## Aenderungen

### 1. `MobileBottomBar.tsx`

- Neuer Prop: `mobileHomeMode: 'modules' | 'chat'` und `onModeChange: (mode) => void`
- **Switch-Segment** zwischen Area-Buttons und Input-Bar einfuegen
- Zwei Buttons nebeneinander in einer Pill-Form: "Module" | "Chat"
- Aktiver Button bekommt `bg-primary` Hintergrund, inaktiver bleibt transparent
- Der Switch wird **nur auf der Dashboard-Route** (`/portal`) angezeigt
- `onChatActivated` bleibt fuer automatischen Wechsel beim Senden (optional)

### 2. `PortalLayout.tsx`

- `mobileHomeMode` und `setMobileHomeMode` werden als Props an `MobileBottomBar` weitergegeben
- Beim Senden einer Nachricht wechselt der Mode automatisch zu `'chat'`

### 3. Keine Aenderungen an

- `MobileHomeChatView.tsx` (behaelt den Zurueck-Button als Alternative)
- `MobileHomeModuleList.tsx`
- Desktop-Layout
- Routing

## Technische Details

Der Switch wird als einfache segmentierte Buttongruppe gebaut (kein Radix-Switch, da es zwei benannte Optionen sind):

```tsx
<div className="flex bg-muted/50 rounded-full p-0.5 mx-auto w-fit">
  <button
    onClick={() => onModeChange('modules')}
    className={cn(
      'px-4 py-1.5 rounded-full text-xs font-medium transition-all',
      mode === 'modules' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
    )}
  >
    Module
  </button>
  <button
    onClick={() => onModeChange('chat')}
    className={cn(
      'px-4 py-1.5 rounded-full text-xs font-medium transition-all',
      mode === 'chat' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
    )}
  >
    Chat
  </button>
</div>
```

**Betroffene Dateien:**
- `src/components/portal/MobileBottomBar.tsx` (Switch einfuegen, neue Props)
- `src/components/portal/PortalLayout.tsx` (Props durchreichen)

