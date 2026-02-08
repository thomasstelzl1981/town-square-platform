
# Fix-Plan: Verkaufsauftrag-Aktivierung

## Problemanalyse (Zusammenfassung)

Die Aktivierung schlägt fehl mit **Error 400**:
```
"new row for relation "property_features" violates check constraint "property_features_feature_code_check""
```

### Ursachen

1. **CHECK CONSTRAINT blockiert neue Feature-Codes**
   - Erlaubte Werte: `msv`, `kaufy`, `website_visibility`
   - Benötigte Werte: `verkaufsauftrag`, `kaufy_sichtbarkeit`, `immoscout24`

2. **Fehlerhafte Template-Query im Code**
   - Zeile 256-257: `.eq('is_active', true)` ist korrekt
   - ABER: Nach erfolgreicher Constraint-Änderung muss der Flow getestet werden

---

## Lösung

### Phase 1: DB-Migration (CHECK CONSTRAINT aktualisieren)

```sql
-- 1. Alte CHECK CONSTRAINT entfernen
ALTER TABLE public.property_features 
DROP CONSTRAINT IF EXISTS property_features_feature_code_check;

-- 2. Neue CHECK CONSTRAINT mit erweiterten Werten erstellen
ALTER TABLE public.property_features 
ADD CONSTRAINT property_features_feature_code_check 
CHECK (feature_code IN (
  'verkaufsauftrag',
  'kaufy_sichtbarkeit', 
  'immoscout24',
  -- Legacy (für Abwärtskompatibilität bei alten Daten)
  'msv', 
  'kaufy', 
  'website_visibility'
));
```

### Phase 2: Code-Fixes prüfen

Nach der Constraint-Änderung sollte der Flow funktionieren:

1. User klickt "Vermarktung aktivieren" Button
2. DB INSERT mit `feature_code = 'verkaufsauftrag'` → Jetzt erfolgreich
3. Panel schließt, Switch zeigt "aktiv"
4. Toast-Nachricht: "Verkaufsauftrag erteilt"

---

## Technische Details

### Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| Neue Migration | DROP/ADD CONSTRAINT für feature_code |
| `VerkaufsauftragTab.tsx` | Keine Änderung nötig - Code ist korrekt |

### Datenfluss nach Fix

```
User klickt Toggle (aus → an)
    ↓
Panel expandiert mit Agreement
    ↓
User akzeptiert alle 3 Checkboxen
    ↓
User klickt "Vermarktung aktivieren"
    ↓
[JETZT ERFOLGREICH]
DB INSERT: property_features(feature_code='verkaufsauftrag')
DB INSERT/UPDATE: listings(status='active')
DB INSERT: user_consents (3 Einträge)
    ↓
Toast: "Verkaufsauftrag erteilt"
Panel schließt
Switch zeigt "aktiv" (grün)
    ↓
Objekt erscheint in:
  - MOD-06 Verkauf
  - Zone 1 Sales Desk
```

---

## Implementierung

Eine einzige DB-Migration mit:
- DROP der alten CHECK CONSTRAINT
- ADD der neuen CHECK CONSTRAINT mit erweiterten Werten

Nach der Migration wird die Aktivierung funktionieren und der UI-Flow (Panel schließen, Switch aktivieren) wird automatisch korrekt ablaufen, da der Code bereits richtig implementiert ist.

---

## Akzeptanzkriterien

| # | Test |
|---|------|
| 1 | Toggle klicken → Panel expandiert |
| 2 | Alle Checkboxen aktivieren → Button aktiviert |
| 3 | "Vermarktung aktivieren" klicken → Erfolg-Toast |
| 4 | Panel schließt automatisch |
| 5 | Switch zeigt "aktiv" (grün) |
| 6 | Objekt erscheint in MOD-06 Objekte-Tab |
| 7 | Objekt erscheint in Zone 1 Sales Desk |
| 8 | Deaktivierung: Switch wieder ausschalten → Objekt verschwindet |
