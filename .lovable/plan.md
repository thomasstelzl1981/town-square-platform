

# Pending Actions Widget — Demo-Implementierung

## Überblick

Wir erstellen ein **PendingActionsWidget** als Demo auf dem Portal-Dashboard. Es zeigt eine Beispiel-Aktion ("Brief absenden an Max Müller"), die auf Freigabe wartet — ohne echte Datenbankanbindung vorerst, nur als visuelles Widget.

## Konzept

```text
DASHBOARD LAYOUT (nach Änderung):
+----------------------------------+----------------------------------+----------------------------------+
|  ARMSTRONG GREETING              |  WETTER                          |  GOOGLE EARTH                    |
+----------------------------------+----------------------------------+----------------------------------+
|                     PENDING ACTIONS WIDGET (volle Breite, darunter)                                 |
|  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐ |
|  │  📬 Brief an Max Müller              ⚠️ Mittleres Risiko        [Freigeben] [Abbrechen]        │ |
|  │  Betreff: Mieterhöhung zum 01.04     Kosten: Kostenlos          Via: E-Mail                    │ |
|  └────────────────────────────────────────────────────────────────────────────────────────────────┘ |
+-----------------------------------------------------------------------------------------------------+
```

## Neue Komponenten

### 1. PendingActionsWidget
**Datei:** `src/components/dashboard/PendingActionsWidget.tsx`

Hauptcontainer, der ausstehende Aktionen anzeigt:
- Glass-Card Design (wie die anderen Dashboard-Kacheln)
- Header mit "Ausstehende Aktionen" Titel + Badge mit Anzahl
- Liste der einzelnen PendingActionCard-Komponenten
- Demo-Daten hart kodiert (später: React Query Hook)

### 2. PendingActionCard
**Datei:** `src/components/dashboard/PendingActionCard.tsx`

Kompakte, horizontale Karte für eine einzelne Aktion:
- Icon links (basierend auf Aktionstyp)
- Titel + Beschreibung in der Mitte
- Risiko-Badge + Kosten rechts
- Freigeben/Abbrechen Buttons
- Hover-Effekt für Details

## Design-Stil (konsistent mit bestehenden Kacheln)

- `glass-card` Klasse mit `border-primary/20`
- Gradient-Overlay wie bei `ArmstrongGreetingCard`
- Kompakte Form mit horizontaler Anordnung
- Responsive: Volle Breite, unter den 3-Spalten-Grid

## Demo-Daten (Beispiel-Brief)

```typescript
const demoActions = [
  {
    id: 'demo-1',
    action_code: 'ARM.MOD02.SEND_LETTER',
    title: 'Brief an Max Müller',
    description: 'Mieterhöhung zum 01.04.2026',
    parameters: {
      recipient: 'Max Müller',
      subject: 'Mieterhöhung',
      channel: 'email',
    },
    risk_level: 'medium' as const,
    cost_model: 'free' as const,
    status: 'pending',
    created_at: new Date().toISOString(),
  },
];
```

## Integration im Dashboard

**Datei:** `src/pages/portal/PortalDashboard.tsx`

```tsx
{/* Existing 3-column grid */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
  {/* ... Armstrong, Weather, Globe ... */}
</div>

{/* NEW: Pending Actions Widget - full width below */}
<PendingActionsWidget className="mt-4 md:mt-6" />
```

## Manifest-Erweiterung

**Datei:** `src/manifests/armstrongManifest.ts`

Neue Aktion hinzufügen (für die Demo und zukünftige Nutzung):

```typescript
{
  action_code: 'ARM.MOD02.SEND_LETTER',
  title_de: 'Brief absenden',
  description_de: 'Sendet einen vorbereiteten Brief per E-Mail, Fax oder Post',
  zones: ['Z2'],
  module: 'MOD-02',
  risk_level: 'medium',
  requires_confirmation: true,
  requires_consent_code: null,
  roles_allowed: [],
  data_scopes_read: ['letter_drafts', 'contacts'],
  data_scopes_write: ['letter_sent'],
  cost_model: 'free',
  cost_unit: null,
  cost_hint_cents: null,
  api_contract: { type: 'edge_function', endpoint: 'sot-letter-send' },
  ui_entrypoints: ['/portal/office/brief'],
  audit_event_type: 'ARM_LETTER_SEND',
  status: 'active',
}
```

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/components/dashboard/PendingActionsWidget.tsx` | **Neu** — Hauptcontainer mit Demo-Daten |
| `src/components/dashboard/PendingActionCard.tsx` | **Neu** — Einzelne Aktionskarte |
| `src/pages/portal/PortalDashboard.tsx` | Widget unter dem 3-Spalten-Grid einfügen |
| `src/manifests/armstrongManifest.ts` | `ARM.MOD02.SEND_LETTER` Aktion hinzufügen |

## Interaktivität (Demo)

**Freigeben-Button:**
- Zeigt Toast "Aktion freigegeben" (Demo)
- Entfernt Aktion aus der Liste (lokaler State)
- Später: DB-Update + Edge Function Call

**Abbrechen-Button:**
- Zeigt Toast "Aktion abgebrochen"
- Entfernt Aktion aus der Liste

## Technische Details

### PendingActionCard Props

```typescript
interface PendingActionCardProps {
  id: string;
  action_code: string;
  title: string;
  description?: string;
  parameters?: Record<string, unknown>;
  risk_level: 'low' | 'medium' | 'high';
  cost_model: 'free' | 'metered' | 'premium';
  created_at: string;
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
  isExecuting?: boolean;
}
```

### Visuelle Elemente

- **Icon:** Mail-Icon für Briefe (dynamisch basierend auf `action_code`)
- **Risiko-Badge:** Farbcodiert (grün/gelb/rot)
- **Zeitstempel:** "vor X Minuten" relativ
- **Channel-Chip:** E-Mail / Fax / Post

## Mobile Ansicht

- Widget erscheint auch auf Mobile (wichtig für unterwegs)
- Kompakte vertikale Anordnung
- Buttons untereinander statt nebeneinander

## Nächste Schritte (nach dieser Implementierung)

1. **Datenbank-Tabelle** `armstrong_pending_actions` erstellen
2. **usePendingActions Hook** für React Query
3. **Integration mit Armstrong Chat** — Aktionen aus dem Chat erstellen
4. **Edge Function** `sot-letter-send` für echten Versand

