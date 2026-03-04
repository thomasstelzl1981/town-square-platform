

## Plan: RegistryImportCard von Armstrong-Seite entfernen

### Änderung

**Datei: `src/pages/portal/ArmstrongInfoPage.tsx`**

1. Import von `RegistryImportCard` entfernen
2. `<RegistryImportCard />` aus der "Services & Add-Ons" Sektion entfernen
3. Die Sektion behält `EmailEnrichmentCard` und `WhatsAppArmstrongCard` — das sind legitime User-facing Add-Ons

### Keine weiteren Änderungen

- `RegistryImportCard.tsx` bleibt bestehen — wird weiterhin in Zone 1 Admin (Recherche-Desk) gebraucht
- Die Edge Function `sot-registry-import` bleibt unverändert
- Die Research Engine in Zone 1 (`StrategyOverview.tsx`) referenziert den BaFin/IHK-Workflow bereits korrekt

### Ergebnis

Armstrong Info Page = reine Produkt-/Feature-Seite mit zwei sinnvollen Add-Ons (Email, WhatsApp). Admin-Import-Tools bleiben in Zone 1.

