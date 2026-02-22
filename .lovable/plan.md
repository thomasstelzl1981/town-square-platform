

## Alle Brand-Websites mit Zugangscode 2710 schuetzen

### Ausgangslage

Kaufy hat bereits einen PIN-Gate (`KaufyPinGate.tsx`) mit Code `4409`. Die anderen 4 Websites (SoT, FutureRoom, Acquiary, Lennox) haben keinen Schutz.

### Loesung

Eine **generische `WebsitePinGate`-Komponente** erstellen, die von allen 5 Layouts genutzt wird. Einheitlicher Code: **2710**.

### Schritte

**1. Neue generische Komponente: `src/components/zone3/WebsitePinGate.tsx`**
- Basiert auf dem bestehenden `KaufyPinGate`
- Props: `brandName` (Anzeigename), `sessionKey` (fuer sessionStorage), `onVerified`
- PIN fest auf `2710`
- Dunkles, neutrales Design (passt zu allen Brands)

**2. Kaufy Layout (`src/pages/zone3/kaufy2026/Kaufy2026Layout.tsx`)**
- Import von `KaufyPinGate` durch `WebsitePinGate` ersetzen
- `brandName="KAUFY"`, `sessionKey="kaufy_pin_verified"`
- Bestehende `VITE_KAUFY_PIN_GATE` Env-Variable entfernen (Gate ist immer aktiv)

**3. SoT Layout (`src/pages/zone3/sot/SotLayout.tsx`)**
- PinGate einbauen: `brandName="System of a Town"`, `sessionKey="sot_pin_verified"`

**4. FutureRoom Layout (`src/pages/zone3/futureroom/FutureRoomLayout.tsx`)**
- PinGate einbauen: `brandName="FutureRoom"`, `sessionKey="futureroom_pin_verified"`

**5. Acquiary Layout (`src/pages/zone3/acquiary/AcquiaryLayout.tsx`)**
- PinGate einbauen: `brandName="Acquiary"`, `sessionKey="acquiary_pin_verified"`

**6. Lennox Layout (`src/pages/zone3/lennox/LennoxLayout.tsx`)**
- PinGate einbauen: `brandName="Lennox & Friends"`, `sessionKey="lennox_pin_verified"`

### Verhalten

- Besucher sieht beim ersten Aufruf den PIN-Screen mit Brandname und 4-stelliger Eingabe
- Nach Eingabe von `2710` wird der Zugang in `sessionStorage` gespeichert
- Innerhalb der Session (Tab offen) kein erneuter Code noetig
- Neuer Tab oder Browser-Neustart erfordert erneute Eingabe

### Betroffene Dateien

| Datei | Art |
|-------|-----|
| `src/components/zone3/WebsitePinGate.tsx` | Neu |
| `src/pages/zone3/kaufy2026/Kaufy2026Layout.tsx` | Edit |
| `src/pages/zone3/sot/SotLayout.tsx` | Edit |
| `src/pages/zone3/futureroom/FutureRoomLayout.tsx` | Edit |
| `src/pages/zone3/acquiary/AcquiaryLayout.tsx` | Edit |
| `src/pages/zone3/lennox/LennoxLayout.tsx` | Edit |

`KaufyPinGate.tsx` bleibt bestehen (kein Breaking Change), wird aber nicht mehr verwendet.

