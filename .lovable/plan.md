
# ERWEITERTER PLAN: Navigation, Multi-Vermieter & One-Click-Absender

## Übersicht

Dieser Plan umfasst vier Hauptbereiche:
1. **Subbar-Duplikation entfernen** aus MOD-01, MOD-02, MOD-03
2. **Multi-Vermieter-Struktur** mit Muster-GmbH etablieren
3. **Usability-Prüfung** MOD-04 <-> MOD-05
4. **Briefgenerator: One-Click-Absender** aus landlord_contexts

---

## Teil 1: Subbar-Duplikation entfernen

### Betroffene Dateien

| Datei | Zeile | Aktion |
|-------|-------|--------|
| `StammdatenPage.tsx` | 56 | `<SubTabNav>` entfernen |
| `OfficePage.tsx` | 53 | `<SubTabNav>` entfernen |
| `DMSPage.tsx` | 53 | `<SubTabNav>` entfernen |

### Architektur-Änderung

```text
AKTUELL (Doppelte Navigation):
┌────────────────────────────────────────────────┐
│ Sidebar           │ Content                    │
│ ├─ Stammdaten     │ ┌──────────────────────┐   │
│ │  ├─ Profil      │ │ [Profil][Personen].. │ ← REDUNDANT
│ │  ├─ Personen    │ └──────────────────────┘   │
│ │  ├─ Abrechnung  │ <Content>                  │
│ │  └─ Sicherheit  │                            │
└────────────────────────────────────────────────┘

NEU (Sidebar-Only):
┌────────────────────────────────────────────────┐
│ Sidebar           │ Content                    │
│ ├─ Stammdaten     │                            │
│ │  ├─ Profil ←────│──→ <ProfilTab>             │
│ │  ├─ Personen    │                            │
│ │  ├─ Abrechnung  │ (Keine Subbar-Duplikation) │
│ │  └─ Sicherheit  │                            │
└────────────────────────────────────────────────┘
```

---

## Teil 2: Multi-Vermieter-Struktur

### Datenbank-Erweiterung

Die `landlord_contexts` Tabelle existiert, braucht aber Adress-Felder für den Briefgenerator:

```sql
ALTER TABLE landlord_contexts ADD COLUMN IF NOT EXISTS 
  street TEXT,
  house_number TEXT,
  postal_code TEXT,
  city TEXT,
  country TEXT DEFAULT 'Deutschland',
  hrb_number TEXT,
  ust_id TEXT,
  legal_form TEXT;
```

### Muster-Testdaten

| Kontext | Typ | Regime | Details |
|---------|-----|--------|---------|
| Privatvermögen Stelzl | PRIVATE | EÜR | Standard, is_default = true |
| Muster Immobilien GmbH | BUSINESS | FIBU | HRB 12345 B, DE123456789 |

### KontexteTab Erweiterung

Neuer Dialog zum Anlegen von Kontexten mit Formular:
- Name (Pflicht)
- Typ: Privat / Geschäftlich
- Steuerregime: EÜR / FIBU / Vermögensverwaltung
- Adresse (für Briefkopf)
- Bei Geschäftlich: HRB-Nummer, USt-ID, Rechtsform

---

## Teil 3: MOD-05 Einstellungen & FinAPI

### Aktueller Status

Die FinAPI-Infrastruktur ist bereits angelegt:
- `msv_bank_accounts` Tabelle existiert
- UI zeigt Bankkonten-Liste
- "Konto hinzufügen" Button vorhanden (ohne Funktion)

### Fehlende Funktionalität

1. **Konto-Anlage-Dialog**: Formular mit IBAN, BIC, Kontoinhaber
2. **FinAPI-Connection-Flow**: Placeholder für zukünftige Integration
3. **Kontext-Zuordnung**: Bank-Konto einem landlord_context zuweisen

---

## Teil 4: Briefgenerator One-Click-Absender (NEU)

### Konzept: One-Click statt Dropdown

```text
AKTUELL:
┌──────────────────────────────────────────────────────┐
│ KI-Briefgenerator                                    │
│ ┌──────────────────────────────────────────────────┐ │
│ │ ① Empfänger: [Dropdown]                          │ │
│ │ ② Betreff: [..............................]      │ │
│ │ ③ Anliegen: [..............................]     │ │
│ │                                                   │ │
│ │ [Brief generieren]                                │ │
│ └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘

NEU (mit Absender-Buttons):
┌──────────────────────────────────────────────────────┐
│ KI-Briefgenerator                                    │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Absender (One-Click):                            │ │
│ │ ┌────────────────┐ ┌────────────────────────┐    │ │
│ │ │ 👤 Privat      │ │ 🏢 Muster GmbH         │    │ │
│ │ │ Max Mustermann │ │ Muster Immobilien GmbH │    │ │
│ │ │ ✓ AUSGEWÄHLT  │ │                        │    │ │
│ │ └────────────────┘ └────────────────────────┘    │ │
│ │                                                   │ │
│ │ ① Empfänger: [Dropdown]                          │ │
│ │ ② Betreff: [..............................]      │ │
│ │ ...                                               │ │
│ └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### UI-Design der Absender-Buttons

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Absender (ein Klick)                                                │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────┐  ┌─────────────────────┐  ┌───────────────┐ │
│ │ 👤                   │  │ 🏢                   │  │     ＋        │ │
│ │ Max Mustermann       │  │ Muster Immobilien    │  │   Kontext    │ │
│ │ Privatvermögen       │  │ GmbH                 │  │   anlegen    │ │
│ │ ────────────────     │  │                      │  │              │ │
│ │ ✓ AKTIV              │  │                      │  │              │ │
│ └─────────────────────┘  └─────────────────────┘  └───────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Datenfluss

1. **Laden der Kontexte** aus `landlord_contexts`:
```typescript
const { data: senderContexts } = useQuery({
  queryKey: ['sender-contexts', activeTenantId],
  queryFn: async () => {
    // Profil-Daten für Privat-Absender
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, street, house_number, postal_code, city')
      .single();
    
    // Zusätzliche Kontexte
    const { data: contexts } = await supabase
      .from('landlord_contexts')
      .select('*')
      .eq('tenant_id', activeTenantId);
    
    return { profile, contexts };
  },
});
```

2. **State für ausgewählten Absender**:
```typescript
const [selectedSender, setSelectedSender] = useState<SenderIdentity | null>(null);

interface SenderIdentity {
  type: 'PRIVATE' | 'BUSINESS';
  name: string;
  company?: string;
  address: string;
}
```

3. **Übergabe an Edge Function** (bereits vorbereitet!):
```typescript
// Die Edge Function unterstützt bereits senderIdentity:
body: {
  recipient: {...},
  subject,
  prompt,
  senderIdentity: selectedSender  // ← NEU
}
```

### Edge Function (bereits kompatibel)

Die `sot-letter-generate` Edge Function unterstützt bereits `senderIdentity`:

```typescript
interface LetterRequest {
  recipient: { name: string; company?: string };
  subject: string;
  prompt: string;
  senderIdentity?: {  // ← BEREITS VORHANDEN
    name: string;
    company: string;
    address?: string;
  };
}
```

---

## Implementierungs-Reihenfolge

### Phase 1: Navigation bereinigen
1. SubTabNav aus StammdatenPage.tsx entfernen
2. SubTabNav aus OfficePage.tsx entfernen  
3. SubTabNav aus DMSPage.tsx entfernen

### Phase 2: Datenbank erweitern
4. `landlord_contexts` um Adress-Felder erweitern
5. Muster-GmbH und Privat-Kontext als Testdaten einfügen

### Phase 3: KontexteTab aktivieren
6. Dialog für Kontext-Anlage implementieren
7. Formular mit allen Feldern (Name, Typ, Regime, Adresse, HRB, USt-ID)

### Phase 4: Portfolio-Subbar
8. PortfolioTab: Kontext-Subbar nur bei >1 Kontexten anzeigen
9. PropertyTable nach aktivem Kontext filtern

### Phase 5: MSV-Verknüpfung
10. EinstellungenTab: Konto-Anlage-Dialog
11. ObjekteTab: Kontext-Filter spiegeln

### Phase 6: Briefgenerator One-Click-Absender (NEU)
12. `BriefTab.tsx`: Absender-Buttons vor Empfänger-Auswahl einfügen
13. Kontexte laden und als klickbare Cards darstellen
14. Ausgewählten Absender an Edge Function übergeben

---

## Akzeptanzkriterien

| AC | Beschreibung |
|----|--------------|
| AC1 | Keine SubTabNav-Duplikation in MOD-01, MOD-02, MOD-03 |
| AC2 | Sidebar-Navigation als einzige Modul-Navigation |
| AC3 | Muster-GmbH + Privatvermögen als Testdaten vorhanden |
| AC4 | PortfolioTab zeigt Subbar nur bei mehreren Kontexten |
| AC5 | KontexteTab zeigt Standard-Kontext aus Stammdaten |
| AC6 | MSV EinstellungenTab hat funktionalen Konto-Dialog |
| AC7 | Konsistente Datenspiegelung MOD-04 → MOD-05 |
| **AC8** | **Briefgenerator zeigt Absender als One-Click-Buttons** |
| **AC9** | **Absender-Auswahl wird an AI-Generierung übergeben** |
| **AC10** | **Button zeigt visuell aktiven Absender (Checkbox/Rahmen)** |

---

## Technische Details

### Neue Komponente: SenderSelector

```typescript
// Neue Komponente in BriefTab.tsx
interface SenderOption {
  id: string;
  type: 'PRIVATE' | 'BUSINESS';
  label: string;
  sublabel: string;
  address: string;
}

function SenderSelector({ 
  options, 
  selected, 
  onSelect 
}: {
  options: SenderOption[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onSelect(option.id)}
          className={cn(
            "flex flex-col items-start p-4 rounded-lg border-2 transition-all min-w-[180px]",
            selected === option.id 
              ? "border-primary bg-primary/5" 
              : "border-muted hover:border-primary/50"
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            {option.type === 'PRIVATE' ? (
              <User className="h-4 w-4" />
            ) : (
              <Building2 className="h-4 w-4" />
            )}
            <span className="font-medium">{option.label}</span>
          </div>
          <span className="text-xs text-muted-foreground">{option.sublabel}</span>
          {selected === option.id && (
            <Badge className="mt-2" variant="default">
              <Check className="h-3 w-3 mr-1" />
              Aktiv
            </Badge>
          )}
        </button>
      ))}
    </div>
  );
}
```

### Briefkopf-Logik in Edge Function

Die KI erhält den Absender-Kontext und kann den Briefschluss entsprechend anpassen:

```text
Privat-Absender:
"Mit freundlichen Grüßen,
Max Mustermann"

Business-Absender:
"Mit freundlichen Grüßen,
Muster Immobilien GmbH
i.A. Max Mustermann"
```

---

## Datenbank-Migration (SQL)

```sql
-- Phase 2: landlord_contexts erweitern
ALTER TABLE landlord_contexts 
ADD COLUMN IF NOT EXISTS street TEXT,
ADD COLUMN IF NOT EXISTS house_number TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Deutschland',
ADD COLUMN IF NOT EXISTS hrb_number TEXT,
ADD COLUMN IF NOT EXISTS ust_id TEXT,
ADD COLUMN IF NOT EXISTS legal_form TEXT;

-- Muster-Testdaten werden nach Tenant-Erstellung eingefügt
```
