

## Fix: Fahrzeugbilder werden nach Upload nicht angezeigt

### Ursache (2 Probleme)

**Problem 1 — Initiales Laden fehlerhaft:**
Der `useEffect` (Zeile 155) hängt nur an `vehicles?.length`. Wenn `activeTenantId` noch `null` ist beim ersten Render, läuft `loadSlotImages` mit leerem `tenantId` → gibt `{}` zurück. Wenn `activeTenantId` dann verfügbar wird, triggert der Effect **nicht erneut**, weil sich `vehicles.length` nicht geändert hat.

**Problem 2 — Upload schreibt mit falschem entityId:**
`handleVehicleImageUpload` ruft `imageSlot.uploadToSlot('hero', file)` auf. Die Hook-Config hat `entityId: selectedVehicleId || '_'`. Beim Klick auf den Upload-Button wird `setSelectedVehicleId(vehicle.id)` **gleichzeitig** aufgerufen — aber React batcht den State-Update. Dadurch nutzt `uploadToSlot` im aktuellen Render-Zyklus noch den **alten** `entityId` (z.B. `'_'` oder ein anderes Fahrzeug). Die `document_links` und der Storage-Pfad werden mit dem falschen entityId geschrieben.

(Die 2 erfolgreichen Uploads im DB funktionierten, weil der User zufällig das Fahrzeug vorher per Klick selektiert hatte.)

### Lösung

**Datei: `src/components/portal/cars/CarsFahrzeuge.tsx`**

1. **Effect-Dependencies fixen** (Zeile 155-159): `activeTenantId` als Dependency hinzufügen, damit nach Auth-Hydration die Bilder geladen werden

2. **Upload-Funktion umbauen** (Zeile 168-177): Statt `imageSlot.uploadToSlot()` (das den Hook-entityId nutzt) direkt die Upload-Pipeline mit dem konkreten `vehicleId` aufrufen. Dazu einen separaten `useImageSlotUpload`-Aufruf NICHT verwenden, sondern die Upload-Logik so umbauen, dass der vehicleId als Parameter durchgereicht wird.

   **Konkret:** Einen zweiten Hook-Aufruf mit einem `ref`-Pattern oder eine Hilfsfunktion nutzen, die den Upload mit dem richtigen entityId durchführt. Einfachster Ansatz: `useImageSlotUpload` um einen optionalen `overrideEntityId`-Parameter in `uploadToSlot` erweitern.

**Datei: `src/hooks/useImageSlotUpload.ts`**

3. **`uploadToSlot` erweitern**: Optionalen 3. Parameter `overrideEntityId?: string` hinzufügen. Wenn gesetzt, wird dieser statt des Config-entityId für Storage-Pfad, document_links und storage_nodes verwendet.

### Änderungen im Detail

| Datei | Änderung |
|-------|----------|
| `src/hooks/useImageSlotUpload.ts` | `uploadToSlot(slotKey, file, overrideEntityId?)` — override für entityId in Pfad + DB-Records |
| `src/components/portal/cars/CarsFahrzeuge.tsx` | 1) `handleVehicleImageUpload` nutzt `uploadToSlot('hero', file, vehicleId)` 2) Effect-Deps um `activeTenantId` erweitern |

### Freeze-Check
- MOD-17: nicht eingefroren ✅
- `src/hooks/useImageSlotUpload.ts`: kein Modul-Pfad, frei editierbar ✅

