
# Konsolidierter Redesign-Plan: Immobilienakte + Split-View (systemweit)

## Status: ✅ Umgesetzt

### Abgeschlossene Änderungen

| Datei | Änderung | Status |
|---|---|---|
| `src/components/shared/PageShell.tsx` | `fullWidth` Prop hinzugefügt | ✅ |
| `src/components/immobilienakte/EditableUnitDossierView.tsx` | Neues Zeilen-Layout (Row 1-5) | ✅ |
| `src/pages/portal/immobilien/PropertyDetailPage.tsx` | Split-View Toggle + PageShell Wrapper | ✅ |
| `src/components/immobilienakte/editable/EditableIdentityBlock.tsx` | Kompakter (Felder zusammengefasst) | ✅ |
| `src/components/immobilienakte/editable/EditableBuildingBlock.tsx` | Kompakter (Energie-Sektion zusammengefasst) | ✅ |
| `src/pages/portal/finanzierungsmanager/FMFallDetail.tsx` | `PageShell fullWidth={splitView}` | ✅ |
| `src/pages/portal/finanzierungsmanager/FMFinanzierungsakte.tsx` | `PageShell fullWidth={splitView}` | ✅ |
