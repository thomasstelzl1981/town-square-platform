

## Analyse: Upload-Möglichkeiten und Parser-System im Aktensystem

### Ist-Zustand: 3 verschiedene Upload-Patterns

Das Aktensystem hat aktuell **keine einheitliche Upload-Erfahrung**. Es gibt drei völlig unterschiedliche Implementierungen:

| Pattern | Wo genutzt | Upload-UI | Datenraum sichtbar? | Parser angebunden? |
|---------|-----------|-----------|---------------------|-------------------|
| **A) RecordCard + EntityStorageTree** | MOD-05 (Haustiere), MOD-01 (Profil/Person) | FileDropZone im RecordCard-Open-State + ColumnView-Datenraum | JA (eingebettet) | Indirekt (über Magic Intake) |
| **B) Dedizierter Dossier mit EntityStorageTree** | MOD-19 (PV-Anlage), MOD-17 (Fahrzeuge) | EntityStorageTree als eigene Section im Dossier | JA (eigene Section) | Indirekt |
| **C) Kein Upload, kein Datenraum** | MOD-18 (alle 6 Tabs: Versicherung, KV, Vorsorge, Abo, Kredit, Bankkonto), MOD-20 (Versorgungsverträge, Mietverträge, Kameras) | **NICHTS** | **NEIN** | **NEIN** |

**Befund:** 9 von 13 Aktentypen haben **keine Upload-Möglichkeit und keinen sichtbaren Datenraum** in der Akte selbst. Der DMS-Ordner wird zwar bei Anlage erstellt (DAT), aber es gibt keine UI um Dokumente direkt in der Akte hochzuladen oder den Datenraum zu sehen.

### Parser-System: Zentral, nicht pro Akte

Das Parser-System ist **ein einziges zentrales System** (`sot-document-parser` Edge Function + `parserManifest.ts`). Es gibt KEINEN separaten Parser pro Akte. Stattdessen:

- **1 Edge Function** (`sot-document-parser`) verarbeitet alle Dokumente
- **1 Manifest** (`parserManifest.ts`) definiert 15 Modi mit feldspezifischen Extraktionsregeln
- **1 AI-Modell** (Gemini 2.5 Pro) führt die Extraktion durch
- Der `parseMode` bestimmt, welche Felder extrahiert und in welche Tabelle geschrieben wird

Aktuell 15 Parser-Modi: `immobilie`, `finanzierung`, `versicherung`, `fahrzeugschein`, `pv_anlage`, `vorsorge`, `person`, `haustier`, `kontakt`, `zinsbestaetigung`, `versorgungsvertrag`, `mietvertrag`, `krankenversicherung`, `privatkredit`, `allgemein`.

---

### Homogenisierungsplan

**Ziel:** Jede Akte erhält im Open/Edit-State eine einheitliche Datenraum-Section mit Upload-Funktion.

#### Lösung: `EntityStorageTree` als Standard-Section in jede Akte einbauen

Da `EntityStorageTree` bereits existiert und sowohl Ordner-Navigation (ColumnView) als auch Drag&Drop-Upload unterstützt, muss diese Komponente lediglich in die fehlenden 9 Akten-UIs eingebettet werden.

**Betroffene Dateien:**

| # | Modul | Datei | Aktentyp | entityType |
|---|-------|-------|----------|------------|
| 1 | MOD-18 | `SachversicherungenTab.tsx` | Versicherung | `insurance` |
| 2 | MOD-18 | `KrankenversicherungTab.tsx` | KV | `kv_contract` |
| 3 | MOD-18 | `VorsorgeTab.tsx` | Vorsorge | `vorsorge` |
| 4 | MOD-18 | `AbonnementsTab.tsx` | Abo | `subscription` |
| 5 | MOD-18 | `DarlehenTab.tsx` | Privatkredit | `private_loan` |
| 6 | MOD-18 | `BankAccountInlineForm.tsx` | Bankkonto | `bank_account` |
| 7 | MOD-20 | `ContractDrawer.tsx` (Inline-Form) | Versorgung/Miete | `utility_contract` / `rental_contract` |
| 8 | MOD-20 | Camera-Inline-Form | Kamera | `camera` |

**Implementierung pro Akte (einheitliches Pattern):**

```tsx
// Im Edit/Detail-State jeder Akte, nach den Formfeldern:
{selectedId && activeTenantId && (
  <div className="mt-4">
    <p className={RECORD_CARD.SECTION_TITLE}>Datenraum</p>
    <EntityStorageTree
      tenantId={activeTenantId}
      entityType="insurance"  // je nach Typ
      entityId={selectedId}
      moduleCode="MOD_18"
    />
  </div>
)}
```

Das ergibt für alle 13 Aktentypen:
- Einheitliche Ordner-Ansicht (ColumnView)
- Drag&Drop-Upload direkt in den richtigen Ordner
- Automatische DMS-Erstellung bei Erstbesuch (falls noch nicht vorhanden)
- Konsistente UX über das gesamte System

**Aufwand:** ~2-3 Zeilen Code-Ergänzung pro Tab (Import + JSX-Block). Keine neuen Komponenten nötig.

