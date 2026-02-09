
# Magic Intake Fix: RLS-Problem und mehrstufiger Upload-Workflow

## Problem-Analyse

### Symptome
1. Benutzer lädt Exposé + Preisliste hoch
2. Button "KI arbeitet..." dreht sich, dann Weiterleitung
3. "Projekt nicht gefunden" wird angezeigt
4. Projekt existiert aber in der Datenbank (ID: 83217321-e881-43a2-8822-630a35bc6096)

### Ursache identifiziert
Die Edge Function `sot-project-intake` verwendet den **Service Role Key** (umgeht RLS), aber der Frontend-Client verwendet RLS-geschützte Queries. Die RLS-Policy:

```sql
tenant_id = (SELECT profiles.active_tenant_id FROM profiles WHERE profiles.id = auth.uid())
```

Diese Unterabfrage auf `profiles` wird aufgrund der RLS-Policies auf `profiles` nicht korrekt aufgelöst. Das Projekt wird erstellt, ist aber für den Client unsichtbar.

## Lösung: Zwei-Phasen-Ansatz

### Phase 1: RLS-Policy Fix (kritisch)
Die RLS-Policy muss vereinfacht werden, um die Unterabfrage zu vermeiden:

```sql
-- Neue Policy mit SECURITY DEFINER Funktion
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT active_tenant_id FROM profiles WHERE id = auth.uid()
$$;

-- RLS-Policy aktualisieren
DROP POLICY IF EXISTS dev_projects_tenant_access ON dev_projects;
CREATE POLICY dev_projects_tenant_access ON dev_projects
  FOR ALL
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (tenant_id = public.get_user_tenant_id());
```

### Phase 2: Mehrstufiger Workflow (UX-Verbesserung)

Der Benutzer hat richtig erkannt, dass der aktuelle Workflow "zu viel Magic auf einmal" macht. Neuer Ablauf:

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    NEUER MAGIC INTAKE WORKFLOW                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Schritt 1: UPLOAD                                                   │
│  ───────────────────                                                  │
│  • Dateien in lokalen State (wie jetzt)                              │
│  • Button: "Dateien hochladen" (nicht "Projekt erstellen")           │
│  • Fortschrittsanzeige für jeden Upload                              │
│  • Status: "Hochgeladen" mit Häkchen                                 │
│                                                                       │
│  Schritt 2: ANALYSE                                                   │
│  ───────────────────                                                  │
│  • Button erscheint erst nach erfolgreichem Upload                   │
│  • "KI-Analyse starten"                                              │
│  • Statusanzeige: "Dokumente werden analysiert..."                   │
│  • Timeout-Handling für große Dateien                                │
│                                                                       │
│  Schritt 3: REVIEW                                                    │
│  ───────────────────                                                  │
│  • Extrahierte Daten werden inline angezeigt                         │
│  • Benutzer kann korrigieren BEVOR Projekt erstellt wird             │
│  • "Projekt anlegen" Button                                          │
│                                                                       │
│  Schritt 4: PROJEKT                                                   │
│  ───────────────────                                                  │
│  • Projekt wird mit bestätigten Daten erstellt                       │
│  • Weiterleitung zur Projektakte                                     │
│  • Query-Cache wird invalidiert                                      │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Technische Änderungen

### 1. Datenbank-Migration
Neue SECURITY DEFINER Funktion erstellen, die RLS auf `profiles` umgeht:

- Funktion `get_user_tenant_id()` mit SECURITY DEFINER
- Anpassung aller tenant-basierten RLS-Policies

### 2. Frontend-Änderungen

**ProjekteDashboard.tsx**:
- State-Erweiterung um `uploadPhase: 'idle' | 'uploading' | 'analyzing' | 'review' | 'creating'`
- Separater Upload-Handler für Storage-Upload
- Review-Card mit extrahierten Daten
- Verzögertes `navigate()` mit Query-Invalidation

**QuickIntakeUploader.tsx**:
- Gleiche Änderungen für Dialog-Variante

### 3. Edge Function Split (optional)

Aufteilung der Edge Function in zwei:
- `sot-project-upload`: Nur Datei-Upload in Storage
- `sot-project-analyze`: KI-Analyse + Projekt-Erstellung

## Implementierungsreihenfolge

1. **RLS-Fix zuerst** (behebt das sofortige Problem)
2. **Frontend-Workflow** (verbessert UX und Robustheit)
3. **Edge Function Split** (optional, für besseres Error-Handling)

## Risiken und Mitigationen

| Risiko | Mitigation |
|--------|------------|
| RLS-Policy-Änderung könnte andere Queries brechen | Testen aller Projekt-bezogenen Features nach Migration |
| Große Dateien (>5MB) werden nicht KI-analysiert | Bereits implementiert: Benutzer bearbeitet manuell |
| Timeout bei sehr großen Dateien | Progressives Upload mit Chunks erwägen |

## Zeithorizont

- Phase 1 (RLS-Fix): 10-15 Minuten
- Phase 2 (Workflow): 30-45 Minuten
