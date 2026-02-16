

# Bugfix: Datenraum bleibt von anderem Tier stehen

## Problem

Beim Klick auf ein Tier passieren **zwei Dinge gleichzeitig**:

1. Die `RecordCard`-Komponente oeffnet sich und zeigt ihren **eingebauten Datenraum** (EntityStorageTree) — dieser gehoert zum angeklickten Tier
2. Die `PetInlineDossier`-Komponente rendert **separat unterhalb des Grids** die Stammdaten, Impfungen etc.

Das fuehrt dazu, dass der Datenraum eines Tiers (z.B. Bello) oben in der RecordCard angezeigt wird, waehrend die Stammdaten eines anderen Tiers (z.B. Luna) weiter unten erscheinen — weil es zwei unabhaengige Anzeigebereiche sind.

## Loesung

Die `PetInlineDossier`-Inhalte werden **als children in die RecordCard** eingebettet, statt separat ausserhalb gerendert zu werden. Damit steuert die RecordCard alles konsistent: Stammdaten oben, Datenraum unten.

### Aenderungen in `src/pages/portal/pets/PetsMeineTiere.tsx`

1. **RecordCard erhaelt PetInlineDossier als children** statt `children={null}`:
   - Wenn `openPetId === pet.id`, wird `PetInlineDossier` als children uebergeben
   - Andernfalls bleibt children null

2. **Separaten PetInlineDossier-Block entfernen** (Zeile 317-318):
   - Der Block `{openPetId && <PetInlineDossier .../>}` wird geloescht, da der Inhalt jetzt innerhalb der RecordCard lebt

3. **tenantId NICHT an RecordCard uebergeben** (oder alternativ):
   - Option A: `tenantId` von RecordCard entfernen, damit RecordCard keinen eigenen Datenraum rendert. Stattdessen den Datenraum manuell als letzte Sektion in PetInlineDossier einfuegen.
   - Option B: `tenantId` beibehalten und den RecordCard-internen Datenraum nutzen — dann muss PetInlineDossier keinen eigenen Datenraum haben.

   **Empfehlung: Option A** — Datenraum wird explizit in PetInlineDossier als letzte Sektion eingefuegt (wie gewuenscht "ganz unten"), RecordCard bekommt kein tenantId mehr.

### Konkrete Code-Aenderungen

**RecordCard-Aufruf (ca. Zeile 300-315):**

```text
<RecordCard
  key={pet.id}
  id={pet.id}
  entityType="pet"
  isOpen={openPetId === pet.id}
  onToggle={...}
  thumbnailUrl={...}
  title={pet.name}
  subtitle={...}
  summary={summaryItems}
  glowVariant="teal"
>
  {openPetId === pet.id && (
    <PetInlineDossier petId={pet.id} tenantId={activeTenantId || undefined} />
  )}
</RecordCard>
```

- `children={null}` entfaellt
- `tenantId` wird NICHT mehr an RecordCard uebergeben (kein doppelter Datenraum)

**PetInlineDossier — Datenraum als letzte Sektion (vor Save-Button):**

Import von `EntityStorageTree` und `FolderOpen` hinzufuegen. Neue Sektion nach der Pflege-Timeline:

```text
{/* Datenraum — ganz unten */}
<div>
  <p className={RECORD_CARD.SECTION_TITLE}>
    <span className="flex items-center gap-2">
      <FolderOpen className="h-3.5 w-3.5" /> Datenraum
    </span>
  </p>
  {tenantId ? (
    <EntityStorageTree
      key={petId}
      tenantId={tenantId}
      entityType="pet"
      entityId={petId}
      moduleCode="MOD_05"
    />
  ) : (
    <p className="text-sm text-muted-foreground">Kein Mandant zugeordnet.</p>
  )}
</div>
```

Der `key={petId}` auf EntityStorageTree stellt sicher, dass beim Wechsel des Tiers die Komponente komplett neu gemountet wird.

**Separaten Block loeschen (Zeile 317-318):**

```text
// ENTFERNEN:
{openPetId && <PetInlineDossier petId={openPetId} tenantId={activeTenantId || undefined} />}
```

### Betroffene Datei

| Datei | Aenderung |
|-------|-----------|
| `src/pages/portal/pets/PetsMeineTiere.tsx` | PetInlineDossier als RecordCard-children, Datenraum in PetInlineDossier als letzte Sektion, separaten Rendering-Block entfernen |

### Keine DB-Aenderungen noetig

