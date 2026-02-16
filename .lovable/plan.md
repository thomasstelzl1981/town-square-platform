

# Pet-Akte: Demo-Glow, Demo-Engine-Registrierung und Hundebilder

## Drei Aufgaben

### 1. Demo-IDs in der Engine registrieren

Die beiden Demo-Hunde (Luna, Bello) haben feste UUIDs in der Datenbank:
- Luna: `d0000000-0000-4000-a000-000000000010`
- Bello: `d0000000-0000-4000-a000-000000000011`

Diese IDs fehlen in `ALL_DEMO_IDS` in `src/engines/demoData/data.ts`. Ohne Registrierung erkennt `isDemoId()` sie nicht.

**Aenderung in `src/engines/demoData/data.ts`:**
- Zwei Konstanten definieren: `DEMO_PET_LUNA` und `DEMO_PET_BELLO`
- Beide in das `ALL_DEMO_IDS`-Array aufnehmen (Kommentar `// Pets (DB-geseedet)`)

### 2. Emerald-Glow auf den Pet-Kacheln

In `src/pages/portal/pets/PetsMeineTiere.tsx` wird aktuell `glowVariant` nur auf `'teal'` gesetzt wenn die Karte geoeffnet ist. Demo-Hunde sollen stattdessen den Standard-Emerald-Glow erhalten plus ein "DEMO"-Badge.

**Aenderung in `src/pages/portal/pets/PetsMeineTiere.tsx`:**
- `isDemoId` aus `@/engines/demoData/engine` importieren
- `DEMO_WIDGET` aus `@/config/designManifest` importieren
- Pro Kachel pruefen: `const isDemo = isDemoId(pet.id)`
- `glowVariant` auf `'emerald'` setzen wenn `isDemo`, sonst auf `'teal'` wenn ausgewaehlt, sonst `undefined`

### 3. Hundebilder fuer die Foto-Kacheln

Zwei Stockfoto-URLs werden als `photo_url` in der Datenbank gesetzt. Dafuer wird eine Migration erstellt, die `UPDATE pets SET photo_url = '...' WHERE id = '...'` ausfuehrt. Die Bilder werden von Unsplash verwendet (oeffentlich, lizenzfrei):

- Luna (Golden Retriever): passendes Golden-Retriever-Bild
- Bello (Dackel): passendes Dackel-Bild

**Aenderung:** SQL-Migration mit zwei UPDATE-Statements.

## Betroffene Dateien

- `src/engines/demoData/data.ts` — Pet-IDs als Konstanten + in ALL_DEMO_IDS
- `src/pages/portal/pets/PetsMeineTiere.tsx` — isDemoId-Import + Emerald-Glow-Logik
- Datenbank-Migration — photo_url fuer Luna und Bello setzen
