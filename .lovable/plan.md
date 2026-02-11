
# Sanierung-Modul: Navigation + KI-LV-Generierung aus Freitext

## Problem 1: Stepper ist nicht navigierbar

Die Workflow-Schritte in der Sidebar (Leistungsumfang, Dienstleister, Ausschreibung, Angebote) sind aktuell rein visuell. Der aktive Schritt wird aus dem DB-Status (`status`-Feld) abgeleitet — man kann nicht zurueckklicken. Sobald der Leistungsumfang finalisiert ist und der Status auf `scope_finalized` steht, zeigt die UI nur noch "Dienstleister finden" an.

**Loesung:** Einen lokalen `viewStep`-State einfuehren, der unabhaengig vom DB-Status navigierbar ist. Die Stepper-Eintraege werden klickbar. Man kann jederzeit zu jedem bereits erreichten (oder aktuellen) Schritt zuruecknavigieren. Der DB-Status bestimmt weiterhin, welche Schritte "abgeschlossen" dargestellt werden.

## Problem 2: Kein KI-Flow aus der Freitextbeschreibung

Der Nutzer gibt bei der Anlage eine Freitext-Beschreibung ein (z.B. "Bad komplett sanieren, neue Fliesen, neue Armaturen"). Diese wird in `service_cases.description` gespeichert. Aber im ScopeDefinitionPanel startet die KI-Analyse nur ueber DMS-Dokumente — nicht aus dem Freitext.

Die Edge Function `sot-renovation-scope-ai` unterstuetzt bereits die Generierung aus Kontext (Kategorie + Adresse), aber die UI bietet keinen "Aus Beschreibung generieren"-Button.

**Loesung:** Im ScopeDefinitionPanel einen neuen primaeren Flow einfuegen: "Aus Ihrer Beschreibung generieren". Dieser nimmt die `serviceCase.description` (den Freitext aus der Anlage), schickt ihn an die Edge Function mit einer neuen Action `generate_from_description`, und die KI erstellt daraus:
- Ein strukturiertes Leistungsverzeichnis (Positionen)
- Eine professionelle Beschreibung
- Eine Kostenschaetzung

## Technische Umsetzung

### Datei 1: `src/pages/portal/immobilien/SanierungTab.tsx`

**Aenderungen am Inline-Stepper:**
- Neuer State: `viewStep` (number) pro expandiertem Case, default = `activeStep`
- Die Stepper-Items werden zu klickbaren Buttons (cursor-pointer, hover-Effekt)
- Klick auf einen Schritt setzt `viewStep` auf den Index dieses Schritts
- Bedingung: Man kann nur Schritte anklicken die `<= activeStep` sind (also abgeschlossene + aktueller)
- Der Content-Bereich rendert basierend auf `viewStep` statt `activeStep`
- Wenn `expandedCaseId` wechselt, wird `viewStep` auf den `activeStep` des neuen Case zurueckgesetzt

### Datei 2: `src/components/portal/immobilien/sanierung/scope/ScopeDefinitionPanel.tsx`

**Neuer primaerer KI-Flow:**
- Oberhalb der bisherigen Tabs ("KI-unterstuetzt" / "Eigenes LV") wird ein neuer prominenter Bereich eingefuegt:
  - Zeigt die gespeicherte Beschreibung aus `serviceCase.description`
  - Grosser Button "Leistungsverzeichnis generieren" mit Sparkles-Icon
  - Klick ruft die Edge Function auf mit Action `generate_from_description`
  - Waehrend der Generierung: Loader + "KI erstellt Leistungsverzeichnis..."
  - Nach Erfolg: line_items, scope_description und cost_estimates werden gesetzt
- Die bisherigen Tabs (DMS-Dokumente / Upload) bleiben als Alternative erhalten, werden aber nach unten verschoben unter "Weitere Optionen" (Collapsible)
- Wenn bereits line_items existieren, wird statt des "Generieren"-Buttons ein "Erneut generieren"-Link angezeigt

### Datei 3: `supabase/functions/sot-renovation-scope-ai/index.ts`

**Neue Action `generate_from_description`:**
- Nimmt `description` (Freitext), `property_address`, `unit_info` und optional `area_sqm` entgegen
- Sendet an Lovable AI mit spezifischem Prompt:
  - "Erstelle aus folgender Freitextbeschreibung ein strukturiertes Leistungsverzeichnis fuer eine Innensanierung"
  - Gibt JSON zurueck: `line_items[]`, `scope_description`, `room_analysis`
- Zusaetzlich: Gleich eine Kostenschaetzung mitliefern (`cost_estimate_min/mid/max`)
- Fallback: Wenn KI nicht verfuegbar, Template-basierte Positionen ableiten

### Zusammenfassung der Aenderungen

| Datei | Aenderung |
|---|---|
| `SanierungTab.tsx` | `viewStep`-State, klickbare Stepper-Items, Navigation zwischen Schritten |
| `ScopeDefinitionPanel.tsx` | Neuer primaerer "Aus Beschreibung generieren"-Flow, bisherige DMS/Upload-Tabs als Alternative |
| `sot-renovation-scope-ai/index.ts` | Neue Action `generate_from_description` mit Freitext-zu-LV KI-Prompt |

Keine DB-Aenderungen noetig. Keine neuen Dateien. Keine neuen Dependencies.
