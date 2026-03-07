

# Plan: Datenraum im Objekteingang — Collapsible entfernen + Root-Auto-Init

## Befund (Screenshot-bestätigt)

| Problem | Ursache |
|---|---|
| Datenraum ist in Collapsible versteckt | `ObjekteingangList.tsx` Zeile 421-449 wraps EST in `<Collapsible>` |
| Kein Ordnerbaum sichtbar, nur Upload-Placeholder | Kein `storage_nodes` Root für `acq_module` vorhanden → EST zeigt Empty-State (Zeile 524-535) |
| Keine Aktionen, kein "Neuer Ordner" Button | Empty-State rendert nur FileDropZone ohne Header/Toolbar |
| Keine ordentliche Überschrift | Collapsible-Trigger zeigt nur kleinen Ghost-Button als "Datenraum" |

## Root Cause

Die EST-Komponente zeigt den vollen Datenbaum mit Header + "Neuer Ordner" Button nur, wenn ein `rootFolder` existiert (Zeile 524: `if (!rootFolder?.id && !isUploading)`). Für `acq_module` wurde aber nie ein Root-Node in `storage_nodes` angelegt. Der Root wird erst bei erstem File-Upload via `createDMS` erstellt — aber der User sieht vorher nur einen leeren Placeholder.

## Umsetzung (2 Dateien, MOD-12 muss unfrozen bleiben)

### 1. ÄNDERUNG: `src/components/shared/EntityStorageTree.tsx` (frei editierbar)

**Problem:** Empty-State zeigt keinen Header, keinen "Neuer Ordner" Button, keine Struktur.

**Lösung:** Den Empty-State so ändern, dass er:
- Den **gleichen Header** mit "Neuer Ordner" Button zeigt wie der Normalzustand
- Bei Klick auf "Neuer Ordner" oder bei erstem Upload automatisch den Root-Node erstellt
- Alternativ: Root automatisch bei Mount erstellen (auto-init), damit der leere Baumzustand sofort den vollen Header + ColumnView zeigt

**Bevorzugt: Auto-Init des Root-Nodes.** Ein `useEffect` prüft beim Mount, ob ein Root existiert. Wenn nicht, wird er via `createDMS.mutateAsync()` erstellt. So sieht der User sofort den vollen Datenraum mit Toolbar und Ordnerbaum — auch wenn noch keine Dateien vorhanden sind.

### 2. ÄNDERUNG: `src/pages/portal/akquise-manager/ObjekteingangList.tsx` (MOD-12)

**Problem:** Zeilen 420-449 — Datenraum ist in `<Collapsible>` gewrappt.

**Lösung:**
- Collapsible-Wrapper komplett entfernen
- EST direkt als eigenständige `<Card>` mit klarer Überschrift rendern:
  ```tsx
  <Card className={CARD.BASE}>
    <div className={CARD.SECTION_HEADER}>
      <span className={TYPOGRAPHY.CARD_TITLE}>Akquise-Datenraum</span>
    </div>
    <CardContent className="p-0">
      {activeTenantId && (
        <EntityStorageTree
          tenantId={activeTenantId}
          entityType="acq_module"
          entityId={activeTenantId}
          moduleCode="MOD_12"
        />
      )}
    </CardContent>
  </Card>
  ```
- Imports bereinigen: `Collapsible`, `CollapsibleContent`, `CollapsibleTrigger`, `ChevronDown` entfernen

## Ergebnis

- Datenraum ist sofort sichtbar, nicht versteckt
- Ordnerbaum mit Header und "Neuer Ordner" Button erscheint direkt
- Alle Phase-1/2/3-Features (Rename, DnD, Guards) sind nutzbar
- Konsistente CI wie bei allen anderen Datenräumen im System

