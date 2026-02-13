

# Sanierungsakte loeschen

## Was wird gebaut

Ein Loeschen-Button im Header der geoeffneten Sanierungsakte mit Bestaetigungsdialog. Nach dem Loeschen schliesst sich die Akte und die Widget-Uebersicht wird aktualisiert.

## Aenderungen

### 1. `src/hooks/useServiceCases.ts` — Neuer `useDeleteServiceCase` Hook

- Neuer `useMutation`-Hook, der `supabase.from('service_cases').delete().eq('id', id)` ausfuehrt
- Invalidiert `service_cases` Query nach Erfolg
- Toast: "Sanierungsvorgang geloescht" / Fehler-Toast

### 2. `src/components/sanierung/SanierungDetail.tsx` — Loeschen-Button + Dialog

- Im Header neben dem X-Button: Ein Trash2-Icon-Button (ghost, destructive)
- Oeffnet einen `AlertDialog` mit Bestaetigungstext: "Moechten Sie diesen Sanierungsvorgang unwiderruflich loeschen?"
- Titel und Public-ID im Dialog anzeigen
- Bei Bestaetigung: `deleteServiceCase` aufrufen, danach `onClose()` ausfuehren
- Nur bei Status `draft` oder `cancelled` sichtbar (laufende Vorgaenge sollen nicht geloescht werden koennen)

### 3. Keine Datenbank-Aenderungen

RLS-Policies erlauben bereits DELETE fuer Tenant-Mitglieder auf `service_cases`. Es sind keine Schema-Aenderungen noetig.

## Technische Details

- Dialog nutzt `AlertDialog` von Radix (bereits im Projekt)
- Der Hook gibt `isPending` zurueck, um den Button waehrend des Loeschvorgangs zu deaktivieren
- Nach erfolgreichem Loeschen wird `onClose()` aufgerufen, was `selectedCaseId` auf `null` setzt und die Widgets-Ansicht zurueckbringt
