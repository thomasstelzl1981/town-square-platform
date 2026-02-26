

## Magic Intake: Anbieter-Daten aus Exposé extrahieren

### Problem

Die KI-Extraktion im `sot-project-intake` liest aktuell nur `developer` (ein einfacher String wie "XY Immobilien GmbH"). Die restlichen Impressum-Felder (Geschäftsführer, Adresse, HRB, USt-ID, Rechtsform) werden NICHT extrahiert, obwohl sie in fast jedem Exposé im Impressum stehen.

### Änderung 1: Tool-Definition erweitern (Edge Function)

**Datei:** `supabase/functions/sot-project-intake/index.ts`

Das `extract_project_data` Tool bekommt neue Properties neben dem bestehenden `developer`:

| Neues Feld | Typ | Beschreibung |
|-----------|-----|-------------|
| `developerLegalForm` | string | Rechtsform: GmbH, GmbH & Co. KG, AG etc. |
| `developerManagingDirector` | string | Geschäftsführer / Vorstand |
| `developerStreet` | string | Straße + Hausnummer |
| `developerPostalCode` | string | PLZ |
| `developerCity` | string | Stadt |
| `developerHrb` | string | HRB-Nummer + Amtsgericht |
| `developerUstId` | string | USt-IdNr. |

### Änderung 2: System-Prompt erweitern

Im `EXPOSE_SYSTEM_PROMPT` wird ein neuer Abschnitt ergänzt:

```
ANBIETER/IMPRESSUM — Extrahiere aus dem Impressum des Exposés:
- developer: Firmenname OHNE Rechtsform
- developerLegalForm: Rechtsform (GmbH, AG, etc.)
- developerManagingDirector: Geschäftsführer/Vorstand
- developerStreet: Straße + Hausnummer
- developerPostalCode + developerCity
- developerHrb: HRB-Nummer + Amtsgericht
- developerUstId: USt-IdNr.
```

### Änderung 3: Create-Logik — Felder beim Insert/Update befüllen

In der `handleCreate`-Funktion (Zeile 626-682) werden beim Erstellen eines neuen Developer-Kontexts die zusätzlichen Felder mitgegeben:

```typescript
.insert({
  tenant_id: tenantId,
  name: developerName,
  legal_form: reviewedData.developerLegalForm || '',
  managing_director: reviewedData.developerManagingDirector || '',
  street: reviewedData.developerStreet || '',
  postal_code: reviewedData.developerPostalCode || '',
  city: reviewedData.developerCity || '',
  hrb_number: reviewedData.developerHrb || '',
  ust_id: reviewedData.developerUstId || '',
  is_default: false,
})
```

Bei einem bestehenden Kontext (Match per Name): Update der leeren Felder, damit bereits vorhandene manuelle Einträge nicht überschrieben werden.

### Änderung 4: ExtractedData-Interface erweitern

Die neuen Felder werden im `ExtractedData`-Interface (oder dem bestehenden Typ in der Edge Function) ergänzt, damit sie durch den Review-Flow durchgereicht werden.

### Keine DB-Migration nötig

Alle Felder (`legal_form`, `managing_director`, `street`, `house_number`, `postal_code`, `city`, `hrb_number`, `ust_id`) existieren bereits in `developer_contexts`.

### Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `supabase/functions/sot-project-intake/index.ts` | Tool-Definition + Prompt + Create-Logik |

