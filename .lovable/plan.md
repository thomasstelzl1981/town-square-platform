

# Fix: Gesamter Workflow von oben bis unten sichtbar

## Problem

Die aktuelle `AkquiseMandate.tsx` versteckt alle Workflow-Sektionen hinter einem `phase`-State. Nur EINE Phase ist jeweils sichtbar:
- `phase === 'capture'` zeigt NUR die Freitext-Erfassung
- `phase === 'profile'` zeigt NUR das Ankaufsprofil-Formular
- `phase === 'active'` zeigt NUR die operativen Tabs (Sourcing, Outreach etc.)

Das widerspricht dem FM-Muster: **Alles muss gleichzeitig sichtbar sein**, von oben nach unten auf einer durchlaufenden Seite.

## Loesung

Die gesamte Seite zeigt IMMER alle 7 Sektionen untereinander. Sektionen, die noch nicht aktiv sind (weil kein Mandat erstellt wurde), werden ausgegraut/deaktiviert dargestellt — aber trotzdem sichtbar, damit der Nutzer den kompletten Workflow ueberblicken kann.

```text
/portal/akquise-manager/mandate (IMMER ALLES SICHTBAR)
+=========================================+
| Meine Mandate (Widgets/Placeholder)     |
+-----------------------------------------+
| 1. KI-gestuetzte Erfassung              |
|    [Freitext-Textarea]      ← aktiv     |
+-----------------------------------------+
| 2. Ankaufsprofil                        |
|    [Formular]        ← nach Extraktion  |
|    >>> MANDAT ERSTELLEN <<<             |
+-----------------------------------------+
| 3. Kontaktrecherche          ← grau     |
|    (wird aktiv nach Mandats-Erstellung) |
+-----------------------------------------+
| 4. E-Mail-Versand            ← grau     |
+-----------------------------------------+
| 5. Objekteingang             ← grau     |
+-----------------------------------------+
| 6. Analyse & Kalkulation     ← grau     |
+-----------------------------------------+
| 7. Delivery                  ← grau     |
+=========================================+
```

## Technische Aenderungen

### Datei: `src/pages/portal/akquise-manager/AkquiseMandate.tsx` — Rewrite

**Kernidee**: `phase`-State steuert nicht mehr die Sichtbarkeit, sondern nur ob eine Sektion interaktiv oder deaktiviert ist.

1. **Alle Sektionen werden immer gerendert** — keine bedingten `{phase === 'xyz' && ...}` Bloecke mehr
2. **Sektionen 1-2** (Erfassung + Profil): Immer sichtbar. Profil-Formular wird initial leer angezeigt (mit Hinweis "wird durch KI vorausgefuellt oder manuell befuellt")
3. **Sektionen 3-7** (Sourcing bis Delivery): Immer sichtbar, aber mit `opacity-50 pointer-events-none`-Overlay wenn kein `activeMandateId` vorhanden. Ein Hinweistext "Erstellen Sie zuerst ein Mandat" wird angezeigt
4. Jede Sektion bekommt ihren `AcqSectionHeader` mit fortlaufender Nummer und `Separator` dazwischen
5. Der Phase-State bleibt intern erhalten fuer die Logik (z.B. ob KI-Extraktion schon gelaufen ist), steuert aber nicht mehr die Sichtbarkeit

### Aufbau der durchlaufenden Seite

```text
<PageShell>
  <ModulePageHeader />
  
  // Sektion A: Meine Mandate (WidgetGrid)
  
  <Separator />
  
  // Sektion 1: KI-gestuetzte Erfassung
  <AcqSectionHeader number={1} title="KI-gestuetzte Erfassung" />
  <Textarea + Button "Ankaufsprofil generieren" />
  
  <Separator />
  
  // Sektion 2: Ankaufsprofil aufbereiten
  <AcqSectionHeader number={2} title="Ankaufsprofil" />
  <Formular: Name, Region, Asset-Fokus, Preis, Rendite, Ausschluesse>
  <Button "Mandat erstellen" />
  
  <Separator />
  
  // Sektion 3-7: Operative Workflow-Sektionen
  // Jeweils mit deaktiviertem Overlay wenn !activeMandateId
  
  <AcqSectionHeader number={3} title="Kontaktrecherche" />
  <SourcingTab /> oder Platzhalter
  
  <AcqSectionHeader number={4} title="E-Mail-Versand" />
  <OutreachTab /> oder Platzhalter
  
  <AcqSectionHeader number={5} title="Objekteingang" />
  <InboundTab /> oder Platzhalter
  
  <AcqSectionHeader number={6} title="Analyse & Kalkulation" />
  <AnalysisTab /> oder Platzhalter
  
  <AcqSectionHeader number={7} title="Delivery" />
  <DeliveryTab /> oder Platzhalter
</PageShell>
```

### Deaktivierte Sektionen (3-7 ohne Mandat)

Fuer Sektionen ohne `activeMandateId` wird ein Wrapper-Div verwendet:

```tsx
<div className={!activeMandateId ? 'opacity-40 pointer-events-none' : ''}>
  <SourcingTab mandateId={activeMandateId!} ... />
</div>
{!activeMandateId && (
  <p className="text-sm text-muted-foreground italic">
    Erstellen Sie zuerst ein Mandat (Schritt 2), um diesen Bereich zu nutzen.
  </p>
)}
```

### Dateien

1. **REWRITE:** `src/pages/portal/akquise-manager/AkquiseMandate.tsx` — Phase-Conditional durch Always-Visible ersetzen

Keine weiteren Dateien betroffen. Die bestehenden Tab-Komponenten (SourcingTab, OutreachTab etc.) und der AcqSectionHeader bleiben unveraendert.

