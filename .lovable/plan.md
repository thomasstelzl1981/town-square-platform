
# Umsetzungsplan: Mietverhältnis Aktionen & Briefgenerator-Integration

## Aktueller Stand

### Problem 1: Mietverhältnis-Status zurücksetzen
Der Mietvertrag der Demo-Immobilie hat derzeit den Status `notice_given` (Gekündigt) - dieser muss auf `active` zurückgesetzt werden.

### Problem 2: Falsche Button-Struktur
Der aktuelle "Kündigen"-Button setzt direkt den Status auf `notice_given`. Es fehlen wichtige Aktionen für die Mieterverwaltung.

### Soll-Zustand: Drei Aktions-Buttons mit Briefgenerator-Verlinkung

```
┌───────────────────────────────────────────────────────────────┐
│ MIETVERHÄLTNIS-TAB: Aktive Verträge                          │
├───────────────────────────────────────────────────────────────┤
│ Bergmann, Thomas                                              │
│ 837,00 EUR Warmmiete | Beginn: 01.06.2022 | Unbefristet       │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ [Bearbeiten] [Kündigung] [Mieterhöhung] [Abmahnung]     │   │
│ │              [Einladen]                                  │   │
│ └─────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

Jeder Button öffnet den KI-Briefgenerator mit vorausgefüllten Daten:
- **Empfänger**: Automatisch der Mieter (Kontakt aus Mietvertrag)
- **Betreff**: Vorbefüllt je nach Aktion (z.B. "Kündigung Ihres Mietvertrages")
- **Prompt**: Vorbefüllte Anweisung für den KI-Briefgenerator

---

## Technische Umsetzung

### Schritt 1: Datenbank - Status zurücksetzen

Einmaliger SQL-Befehl zum Zurücksetzen des Mietvertrags:

```sql
UPDATE leases 
SET status = 'active' 
WHERE id = '00000000-0000-4000-a000-000000000120';
```

### Schritt 2: TenancyTab.tsx - Aktions-Buttons umbauen

**Datei:** `src/components/portfolio/TenancyTab.tsx`

**Zeile 530-572 (Actions-Bereich) ersetzen:**

Von:
```typescript
{/* Actions */}
<div className="flex gap-2 pt-2 border-t">
  <Button variant="outline" size="sm" onClick={() => openEditDialog(lease)}>
    <Edit2 className="mr-1 h-3 w-3" />
    Bearbeiten
  </Button>
  
  {lease.status === 'draft' && (
    <Button size="sm" onClick={() => handleActivateLease(lease.id)}>
      Aktivieren
    </Button>
  )}
  
  {lease.status === 'active' && (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => handleTerminateLease(lease.id)}
      >
        Kündigen
      </Button>
      ...
    </>
  )}
</div>
```

Zu:
```typescript
{/* Actions */}
<div className="flex flex-wrap gap-2 pt-2 border-t">
  <Button variant="outline" size="sm" onClick={() => openEditDialog(lease)}>
    <Edit2 className="mr-1 h-3 w-3" />
    Bearbeiten
  </Button>
  
  {lease.status === 'draft' && (
    <Button size="sm" onClick={() => handleActivateLease(lease.id)}>
      Aktivieren
    </Button>
  )}
  
  {(lease.status === 'active' || lease.status === 'notice_given') && (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => handleOpenLetterGenerator(lease, 'kuendigung')}
      >
        <FileText className="mr-1 h-3 w-3" />
        Kündigung
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => handleOpenLetterGenerator(lease, 'mieterhoehung')}
      >
        <Euro className="mr-1 h-3 w-3" />
        Mieterhöhung
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => handleOpenLetterGenerator(lease, 'abmahnung')}
      >
        <AlertTriangle className="mr-1 h-3 w-3" />
        Abmahnung
      </Button>
      
      {!lease.renter_org_id && (
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => openInviteDialog(lease)}
        >
          <Mail className="mr-1 h-3 w-3" />
          Einladen
        </Button>
      )}
    </>
  )}
</div>
```

### Schritt 3: Neue Handler-Funktion für Briefgenerator

**Datei:** `src/components/portfolio/TenancyTab.tsx`

Neue Funktion hinzufügen (nach Zeile 352):

```typescript
type LetterType = 'kuendigung' | 'mieterhoehung' | 'abmahnung';

function handleOpenLetterGenerator(lease: Lease & { tenant_contact?: Contact }, letterType: LetterType) {
  if (!lease.tenant_contact) {
    toast.error('Kein Kontakt für diesen Mietvertrag hinterlegt');
    return;
  }

  const templates: Record<LetterType, { subject: string; prompt: string }> = {
    kuendigung: {
      subject: 'Kündigung Ihres Mietvertrages',
      prompt: `Erstelle eine formelle Kündigung des Mietvertrages für ${lease.tenant_contact.first_name} ${lease.tenant_contact.last_name}. Der Mietvertrag begann am ${formatDate(lease.start_date)}. Die aktuelle Warmmiete beträgt ${formatCurrency(lease.monthly_rent)}.`,
    },
    mieterhoehung: {
      subject: 'Mieterhöhungsverlangen',
      prompt: `Erstelle ein Mieterhöhungsverlangen für ${lease.tenant_contact.first_name} ${lease.tenant_contact.last_name}. Die aktuelle Kaltmiete beträgt ${formatCurrency(lease.rent_cold_eur || 0)}. Bitte begründe die Erhöhung mit dem örtlichen Mietspiegel.`,
    },
    abmahnung: {
      subject: 'Abmahnung wegen Vertragsverletzung',
      prompt: `Erstelle eine Abmahnung für ${lease.tenant_contact.first_name} ${lease.tenant_contact.last_name}. Bitte frage mich nach dem konkreten Grund der Abmahnung.`,
    },
  };

  const template = templates[letterType];

  // Navigate to letter generator with pre-filled data
  const params = new URLSearchParams({
    contactId: lease.tenant_contact.id,
    subject: template.subject,
    prompt: template.prompt,
    leaseId: lease.id,
  });

  window.location.href = `/portal/office/brief?${params.toString()}`;
}
```

### Schritt 4: BriefTab.tsx - URL-Parameter auslesen

**Datei:** `src/pages/portal/office/BriefTab.tsx`

Import hinzufügen (Zeile 1-2):
```typescript
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
```

Neuen Hook hinzufügen (nach Zeile 85):
```typescript
const [searchParams] = useSearchParams();

// Pre-fill from URL parameters (from TenancyTab links)
useEffect(() => {
  const contactId = searchParams.get('contactId');
  const subjectParam = searchParams.get('subject');
  const promptParam = searchParams.get('prompt');

  if (subjectParam) setSubject(subjectParam);
  if (promptParam) setPrompt(promptParam);

  // Auto-select contact if passed via URL
  if (contactId && contacts) {
    const contact = contacts.find(c => c.id === contactId);
    if (contact) setSelectedContact(contact);
  }
}, [searchParams, contacts]);
```

---

## Zusammenfassung der Änderungen

| Datei | Änderung |
|-------|----------|
| **Datenbank** | Status des Demo-Mietvertrags auf `active` zurücksetzen |
| `src/components/portfolio/TenancyTab.tsx` | - Alten "Kündigen"-Button entfernen<br>- Drei neue Buttons: Kündigung, Mieterhöhung, Abmahnung<br>- `handleOpenLetterGenerator()` Funktion hinzufügen |
| `src/pages/portal/office/BriefTab.tsx` | URL-Parameter auslesen und Formular vorbefüllen |

---

## Kontakt-Synchronisation (Bestätigung)

Die Kontakt-Erstellung funktioniert bereits korrekt:
- Neue Mieter werden über den "+"-Button im Mietvertrag-Dialog erstellt
- Der Kontakt wird in der `contacts`-Tabelle gespeichert
- Dadurch ist der Mieter automatisch unter **Office → Kontakte** sichtbar

---

## Workflow nach Implementierung

```
┌─────────────────────────────────────────────────────────────┐
│ MIETVERHÄLTNIS-TAB                                          │
│                                                             │
│ Bergmann, Thomas | 837,00 EUR | Aktiv                       │
│                                                             │
│ [Bearbeiten] [Kündigung] [Mieterhöhung] [Abmahnung] [Einladen]
└─────────────────────────────────────────────────────────────┘
              │                │                │
              ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│ KI-BRIEFGENERATOR (/portal/office/brief)                    │
│                                                             │
│ Empfänger: Bergmann, Thomas (vorausgefüllt)                 │
│ Betreff: "Kündigung Ihres Mietvertrages" (vorausgefüllt)    │
│ Prompt: "Erstelle eine formelle Kündigung..." (vorausgefüllt)│
│                                                             │
│ [Brief generieren] → KI erstellt fertigen Brief             │
└─────────────────────────────────────────────────────────────┘
```

---

## Testplan

### Test 1: Status zurückgesetzt
1. Tab "Mietverhältnis" öffnen
2. **Erwartung:** Status zeigt "Aktiv" (nicht mehr "Gekündigt")

### Test 2: Neue Buttons sichtbar
1. Tab "Mietverhältnis" öffnen
2. **Erwartung:** Buttons "Kündigung", "Mieterhöhung", "Abmahnung" sind sichtbar

### Test 3: Kündigung öffnet Briefgenerator
1. Auf "Kündigung" klicken
2. **Erwartung:** Weiterleitung zu `/portal/office/brief`
3. **Prüfen:** Empfänger = "Bergmann, Thomas"
4. **Prüfen:** Betreff = "Kündigung Ihres Mietvertrages"
5. **Prüfen:** Prompt enthält Mietdaten

### Test 4: Mieterhöhung öffnet Briefgenerator
1. Auf "Mieterhöhung" klicken
2. **Erwartung:** Weiterleitung zu `/portal/office/brief`
3. **Prüfen:** Betreff = "Mieterhöhungsverlangen"

### Test 5: Abmahnung öffnet Briefgenerator
1. Auf "Abmahnung" klicken
2. **Erwartung:** Weiterleitung zu `/portal/office/brief`
3. **Prüfen:** Betreff = "Abmahnung wegen Vertragsverletzung"

### Test 6: Kontakte synchronisiert
1. Im Mietvertrag-Dialog auf "+" klicken
2. Neuen Kontakt "Test Mieter" anlegen
3. Office → Kontakte öffnen
4. **Erwartung:** "Test Mieter" erscheint in der Kontaktliste
