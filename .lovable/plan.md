
# Inline-Editing für Vermietereinheiten

## Zusammenfassung

Die Bearbeitung soll **direkt auf der Kachel** erfolgen — ohne Modal/Pop-up. Klick auf "Bearbeiten" transformiert die Ansichts-Kachel in ein Formular. Speichern/Abbrechen bringt sie zurück zur Anzeige.

---

## Aktueller Zustand (Problem)

```text
┌─────────────────────────────┐
│ Familie Mustermann          │
│ [Privat] 42% · zVE 98.000 € │
│ ─────────────────────────── │
│ Max M.    │  Lisa M.        │
│ ─────────────────────────── │
│ [Bearbeiten] [Zuordnen]     │  ← Öffnet CreateContextDialog (Modal)
└─────────────────────────────┘
```

**Problem:** "Bearbeiten" öffnet ein 2-Schritt-Modal. Benutzer verliert Kontext.

---

## Zielzustand (Inline-Editing)

### Anzeige-Modus (Standard)

```text
┌─────────────────────────────────────────────┐
│ Familie Mustermann                          │
│ [Privat]    42% Grenzsteuersatz             │
│ ─────────────────────────────────────────── │
│ zVE: 98.000 € · Splitting · 1 Kind          │
│ ─────────────────────────────────────────── │
│ ┌──────────────────┐  ┌──────────────────┐  │
│ │ Max Mustermann   │  │ Lisa Mustermann  │  │
│ │ Stkl. III, 50%   │  │ Stkl. V, 50%     │  │
│ │ 72.000 €         │  │ 54.000 €         │  │
│ └──────────────────┘  └──────────────────┘  │
│ ─────────────────────────────────────────── │
│ 8 Objekte zugeordnet                        │
│                                             │
│ [✏️ Bearbeiten]           [🔗 Zuordnen]     │
└─────────────────────────────────────────────┘
```

### Bearbeitungs-Modus (nach Klick auf "Bearbeiten")

```text
┌─────────────────────────────────────────────┐
│ ✏️ Bearbeitung                   [❌]       │
│ ─────────────────────────────────────────── │
│ Name:    [Familie Mustermann_______]        │
│ Typ:     (•) Privat  ( ) Gesellschaft       │
│ ─────────────────────────────────────────── │
│ STEUERBASIS                                 │
│ zVE:     [98000_________] €                 │
│ Typ:     (•) Splitting ( ) Einzel           │
│ Kinder:  [1]   [☐] Kirchensteuer            │
│ ─────────────────────────────────────────── │
│ EIGENTÜMER                                  │
│ ┌──────────────────────────────────────┐    │
│ │ Vorname: [Max____] Name: [Muster__]  │    │
│ │ Stkl: [III▼] Anteil: [50]%           │    │
│ │ Beruf: [Software-Entw.] [72000] €    │    │
│ └──────────────────────────────────────┘    │
│ ┌──────────────────────────────────────┐    │
│ │ Vorname: [Lisa___] Name: [Muster__]  │    │
│ │ Stkl: [V__▼] Anteil: [50]%           │    │
│ │ Beruf: [Marketing-Mgr.] [54000] €    │    │
│ └──────────────────────────────────────┘    │
│ [+ Eigentümer hinzufügen]                   │
│ ─────────────────────────────────────────── │
│     [Abbrechen]           [💾 Speichern]    │
└─────────────────────────────────────────────┘
```

---

## Technische Umsetzung

### 1. Neue State-Variablen in KontexteTab.tsx

```typescript
// State für aktive Bearbeitung
const [editingContextId, setEditingContextId] = useState<string | null>(null);

// Form-Daten für Edit-Modus
const [editFormData, setEditFormData] = useState<ContextFormData | null>(null);
const [editOwners, setEditOwners] = useState<OwnerData[]>([]);
```

### 2. Neue Inline-Komponenten (innerhalb KontexteTab.tsx)

| Komponente | Zweck |
|------------|-------|
| `ContextCardView` | Anzeige-Modus (bestehend, aber extrahiert) |
| `ContextCardEdit` | Bearbeitungs-Modus (Formular direkt auf Kachel) |

### 3. Bedingte Rendering-Logik

```tsx
{contexts.map((ctx) => {
  const isEditing = editingContextId === ctx.id;
  
  return isEditing ? (
    <ContextCardEdit
      key={ctx.id}
      context={ctx}
      formData={editFormData!}
      owners={editOwners}
      onFormChange={setEditFormData}
      onOwnersChange={setEditOwners}
      onSave={handleSave}
      onCancel={() => setEditingContextId(null)}
      isSaving={updateMutation.isPending}
    />
  ) : (
    <ContextCardView
      key={ctx.id}
      context={ctx}
      members={membersByContext.get(ctx.id) || []}
      propertyCount={contextPropertyCounts[ctx.id] || 0}
      onEdit={() => handleStartEdit(ctx)}
      onAssign={() => setAssignerContext({ id: ctx.id, name: ctx.name })}
    />
  );
})}
```

### 4. Edit-Handler

```typescript
const handleStartEdit = (ctx: LandlordContext) => {
  const members = membersByContext.get(ctx.id) || [];
  
  setEditingContextId(ctx.id);
  setEditFormData({
    name: ctx.name,
    context_type: ctx.context_type as 'PRIVATE' | 'BUSINESS',
    tax_rate_percent: ctx.tax_rate_percent ?? 30,
    taxable_income_yearly: ctx.taxable_income_yearly ?? null,
    tax_assessment_type: ctx.tax_assessment_type as TaxAssessmentType || 'SPLITTING',
    church_tax: ctx.church_tax ?? false,
    children_count: ctx.children_count ?? 0,
    // ... weitere Felder
  });
  setEditOwners(members.map(m => ({
    id: m.id,
    first_name: m.first_name,
    last_name: m.last_name,
    tax_class: m.tax_class || 'I',
    ownership_share: m.ownership_share || 50,
    gross_income_yearly: m.gross_income_yearly,
    profession: m.profession || '',
    // ...
  })));
};
```

### 5. Save-Mutation (wiederverwendet bestehende Logik)

```typescript
const updateContext = useMutation({
  mutationFn: async () => {
    // Update landlord_contexts
    await supabase
      .from('landlord_contexts')
      .update({
        name: editFormData.name,
        context_type: editFormData.context_type,
        tax_rate_percent: editFormData.tax_rate_percent,
        taxable_income_yearly: editFormData.taxable_income_yearly,
        // ...
      })
      .eq('id', editingContextId);
    
    // Update context_members
    await supabase
      .from('context_members')
      .delete()
      .eq('context_id', editingContextId);
    
    // Insert updated members
    if (editOwners.length > 0) {
      await supabase
        .from('context_members')
        .insert(editOwners.map(o => ({
          context_id: editingContextId,
          tenant_id: activeTenantId,
          ...o
        })));
    }
  },
  onSuccess: () => {
    toast.success('Vermietereinheit aktualisiert');
    queryClient.invalidateQueries({ queryKey: ['landlord-contexts'] });
    queryClient.invalidateQueries({ queryKey: ['context-members'] });
    setEditingContextId(null);
  }
});
```

---

## ContextCardEdit Komponenten-Struktur

```tsx
const ContextCardEdit = ({ context, formData, owners, onFormChange, onOwnersChange, onSave, onCancel, isSaving }) => (
  <Card className="w-full md:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.67rem)] border-primary ring-2 ring-primary">
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-primary">Bearbeitung</span>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </CardHeader>
    
    <CardContent className="space-y-4">
      {/* Name */}
      <div className="space-y-1">
        <Label className="text-xs">Name</Label>
        <Input
          value={formData.name}
          onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
          className="h-8 text-sm"
        />
      </div>
      
      {/* Typ Toggle */}
      <RadioGroup value={formData.context_type} onValueChange={(v) => onFormChange({ ...formData, context_type: v })}>
        <div className="flex gap-3">
          <div className="flex items-center gap-1.5">
            <RadioGroupItem value="PRIVATE" id={`private-${context.id}`} />
            <Label htmlFor={`private-${context.id}`} className="text-xs">Privat</Label>
          </div>
          <div className="flex items-center gap-1.5">
            <RadioGroupItem value="BUSINESS" id={`business-${context.id}`} />
            <Label htmlFor={`business-${context.id}`} className="text-xs">Gesellschaft</Label>
          </div>
        </div>
      </RadioGroup>
      
      {/* PRIVAT: Steuerbasis */}
      {formData.context_type === 'PRIVATE' && (
        <div className="space-y-3 p-3 bg-muted/40 rounded-lg">
          <span className="text-xs font-medium text-muted-foreground">STEUERBASIS</span>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">zVE (€/Jahr)</Label>
              <Input
                type="number"
                value={formData.taxable_income_yearly ?? ''}
                onChange={(e) => onFormChange({ ...formData, taxable_income_yearly: Number(e.target.value) || null })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Kinder</Label>
              <Input
                type="number"
                value={formData.children_count}
                onChange={(e) => onFormChange({ ...formData, children_count: Number(e.target.value) })}
                className="h-8 text-sm"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <RadioGroup 
              value={formData.tax_assessment_type} 
              onValueChange={(v) => onFormChange({ ...formData, tax_assessment_type: v })}
              className="flex gap-3"
            >
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="SPLITTING" id={`split-${context.id}`} />
                <Label className="text-xs">Splitting</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="SINGLE" id={`single-${context.id}`} />
                <Label className="text-xs">Einzel</Label>
              </div>
            </RadioGroup>
            
            <div className="flex items-center gap-1.5">
              <Checkbox 
                checked={formData.church_tax} 
                onCheckedChange={(c) => onFormChange({ ...formData, church_tax: !!c })} 
              />
              <Label className="text-xs">KiSt</Label>
            </div>
          </div>
        </div>
      )}
      
      {/* PRIVAT: Eigentümer (kompakt) */}
      {formData.context_type === 'PRIVATE' && (
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground">EIGENTÜMER</span>
          {owners.map((owner, idx) => (
            <div key={idx} className="p-2 bg-muted/40 rounded-lg space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Vorname"
                  value={owner.first_name}
                  onChange={(e) => updateOwner(idx, 'first_name', e.target.value)}
                  className="h-7 text-xs"
                />
                <Input
                  placeholder="Nachname"
                  value={owner.last_name}
                  onChange={(e) => updateOwner(idx, 'last_name', e.target.value)}
                  className="h-7 text-xs"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Select value={owner.tax_class} onValueChange={(v) => updateOwner(idx, 'tax_class', v)}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['I','II','III','IV','V','VI'].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="%"
                  value={owner.ownership_share ?? ''}
                  onChange={(e) => updateOwner(idx, 'ownership_share', Number(e.target.value))}
                  className="h-7 text-xs"
                />
                <Input
                  type="number"
                  placeholder="Einkommen"
                  value={owner.gross_income_yearly ?? ''}
                  onChange={(e) => updateOwner(idx, 'gross_income_yearly', Number(e.target.value) || null)}
                  className="h-7 text-xs"
                />
              </div>
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={addOwner} className="text-xs h-7">
            <Plus className="h-3 w-3 mr-1" /> Eigentümer
          </Button>
        </div>
      )}
      
      {/* BUSINESS: Firmendaten (kompakt) */}
      {formData.context_type === 'BUSINESS' && (
        <div className="space-y-3 p-3 bg-muted/40 rounded-lg">
          <span className="text-xs font-medium text-muted-foreground">FIRMENDATEN</span>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Geschäftsführer" className="h-8 text-sm" />
            <Input placeholder="Rechtsform" className="h-8 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="HRB" className="h-8 text-sm" />
            <Input placeholder="USt-ID" className="h-8 text-sm" />
          </div>
        </div>
      )}
    </CardContent>
    
    <CardContent className="pt-0">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onCancel} className="flex-1">
          Abbrechen
        </Button>
        <Button size="sm" onClick={onSave} disabled={isSaving} className="flex-1">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Speichern'}
        </Button>
      </div>
    </CardContent>
  </Card>
);
```

---

## Architektur-Sicherheit

| Prüfpunkt | Status | Details |
|-----------|--------|---------|
| Routen | ✅ Unverändert | `/portal/immobilien/kontexte` bleibt |
| Datenbank-Schema | ✅ Unverändert | `landlord_contexts` + `context_members` |
| CreateContextDialog | ✅ Erhalten | Wird nur noch für **Neuanlage** verwendet |
| RLS Policies | ✅ Unverändert | Bestehende Policies greifen |
| PropertyContextAssigner | ✅ Erhalten | "Zuordnen" Button bleibt |

---

## Zu ändernde Datei

**Nur `src/pages/portal/immobilien/KontexteTab.tsx`**

### Änderungen im Überblick

1. **State hinzufügen**: `editingContextId`, `editFormData`, `editOwners`
2. **Handler hinzufügen**: `handleStartEdit`, `handleSave`, `handleCancelEdit`
3. **useMutation für Update**: Inline-Speicherlogik
4. **Bedingte Komponenten**: View vs. Edit pro Kachel
5. **CreateContextDialog**: Nur noch für `showCreateDialog` (Neuanlage via `+` Karte)

---

## Vorteile

| Aspekt | Modal (Alt) | Inline (Neu) |
|--------|-------------|--------------|
| Kontext-Erhalt | ❌ Verloren | ✅ Sichtbar |
| Klickpfad | 3+ Klicks | 1 Klick |
| Übersicht | ❌ Nur eine Einheit | ✅ Alle sichtbar |
| UX-Gefühl | Pop-up-lastig | Modern, flüssig |
| Mobile | Schwierig | Gut scrollbar |

---

## Implementierungs-Reihenfolge

1. State-Variablen und Handler hinzufügen
2. `ContextCardEdit` Komponente erstellen
3. Bedingte Rendering-Logik einfügen
4. `updateContext` Mutation implementieren
5. "Bearbeiten" Button mit `handleStartEdit` verbinden
6. CreateContextDialog nur noch für Neuanlage nutzen ("+"-Karte)

**Geschätzte Änderungen:** ~200-250 Zeilen in einer Datei
