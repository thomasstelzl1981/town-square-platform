

# Sanierung: Toast-Fix, Dienstleister-Panel einbinden, Ausschreibungs-Panel einbinden

## Problem 1: Toast "Aenderungen gespeichert" ist zu gross und verdeckt UI

Der `toast.success('Aenderungen gespeichert')` in Zeile 272 von ScopeDefinitionPanel.tsx erzeugt eine Standard-Sonner-Notification, die offenbar zu lange sichtbar bleibt. Loesung: `duration: 2000` setzen (2 Sekunden statt default ~4s).

## Problem 2: "Dienstleister finden" (Step 1) ist nur ein Placeholder

Zeilen 261-270 in SanierungTab.tsx zeigen nur einen leeren Platzhalter mit "Suche starten"-Button, der nichts tut. Dabei existiert bereits eine fertige Komponente `ProviderSearchPanel` in `src/components/portal/immobilien/sanierung/tender/ProviderSearchPanel.tsx`, die Google Places Suche, manuelle Eingabe und Auswahl unterstuetzt.

**Loesung:** Den Placeholder ersetzen durch die `ProviderSearchPanel`-Komponente mit:
- State `selectedProviders` (pro Case)
- Props: `category` aus serviceCase, `location` aus serviceCase.property.city/address
- Dazu ein "Weiter zu Ausschreibung"-Button, der `setViewStep(2)` aufruft

## Problem 3: "Ausschreibung versenden" (Step 2) ist nur ein Placeholder

Zeilen 272-278 zeigen ebenfalls einen leeren Platzhalter. Dabei existiert `TenderDraftPanel` in `src/components/portal/immobilien/sanierung/tender/TenderDraftPanel.tsx` — komplett fertig mit E-Mail-Vorschau, Empfaenger-Liste und Sende-Funktion.

**Loesung:** Den Placeholder fuer Step 2 ersetzen durch `TenderDraftPanel` mit:
- Props: `serviceCase`, `selectedProviders` (aus State), `onSendComplete`

## Technische Umsetzung

### Datei 1: `src/components/portal/immobilien/sanierung/scope/ScopeDefinitionPanel.tsx`

- Zeile 272: `toast.success('Aenderungen gespeichert')` aendern zu `toast.success('Aenderungen gespeichert', { duration: 2000 })`

### Datei 2: `src/pages/portal/immobilien/SanierungTab.tsx`

**Neue Imports:**
- `ProviderSearchPanel` und `SelectedProvider` aus `@/components/portal/immobilien/sanierung/tender`
- `TenderDraftPanel` aus `@/components/portal/immobilien/sanierung/tender`

**Neuer State:**
- `selectedProviders: Record<string, SelectedProvider[]>` — pro Case-ID gespeichert, damit bei Case-Wechsel die Auswahl erhalten bleibt

**Step 1 (Zeilen 261-270) ersetzen:**
- Statt Placeholder: `ProviderSearchPanel` mit `category={serviceCase.category}`, `location={serviceCase.property?.city || serviceCase.property?.address || ''}`, `selectedProviders`, `onProvidersChange`
- Darunter: "Weiter zu Ausschreibung"-Button (setzt viewStep auf 2), nur aktiv wenn mindestens 1 Provider gewaehlt
- "Zurueck zu Leistungsumfang"-Button (setzt viewStep auf 0)

**Step 2 (Zeilen 272-278) ersetzen:**
- Statt Placeholder: `TenderDraftPanel` mit `serviceCase`, `selectedProviders[caseId]`, `onSendComplete`
- "Zurueck zu Dienstleister"-Button

### Zusammenfassung

| Datei | Aenderung |
|---|---|
| ScopeDefinitionPanel.tsx | Toast-Duration auf 2s |
| SanierungTab.tsx | Step 1: ProviderSearchPanel einbinden, Step 2: TenderDraftPanel einbinden, State fuer selectedProviders |

Keine DB-Aenderungen, keine neuen Dateien, keine neuen Dependencies.

