

# V + V Tab: Umbenennung und Widget-Bereinigung

## Aenderungen

### 1. Umbenennung "BWA" -> "V + V"

Der Tab und die Seite werden von "BWA" in "V + V" (Vermietung + Verwaltung) umbenannt.

**Betroffene Dateien:**

| Datei | Aenderung |
|-------|-----------|
| `src/manifests/routesManifest.ts` (Zeile 248) | `title: "BWA"` -> `title: "V + V"` |
| `src/pages/portal/immobilien/VerwaltungTab.tsx` (Zeile 42-43) | Header-Titel von "BWA" auf "V + V" aendern, Description anpassen auf "Vermietung + Verwaltung — Vermietereinheiten im Ueberblick." |

### 2. CTA-Widget entfernen

Das "Objekt hinzufuegen"-Widget (Plus-Button, Zeilen 96-113) wird komplett entfernt. Neue Vermietereinheiten koennen hier nicht angelegt werden — das geschieht ausschliesslich im Portfolio-Tab.

### 3. Demo-Widget sicherstellen

Die bestehende Logik zeigt bereits die Demo-Immobilien aus `useVerwaltungData`. Das Demo-Widget bleibt als einziger Inhalt bestehen, wenn nur Demo-Daten vorhanden sind.

### 4. Empty-State anpassen

Der Leerstand-Hinweis (Zeilen 117-129) bleibt erhalten, aber der Text wird angepasst: Verweis auf Portfolio zum Anlegen von Vermietereinheiten.

