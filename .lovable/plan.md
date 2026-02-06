

# MOD-01 Stammdaten: Bereinigung und Neustrukturierung

## IST-STAND ANALYSE

### Aktuelle Struktur

| Quelle | Tile 1 | Tile 2 | Tile 3 | Tile 4 | Versteckt |
|--------|--------|--------|--------|--------|-----------|
| **routesManifest.ts** | profil | firma | abrechnung | sicherheit | — |
| **StammdatenPage.tsx** | profil | firma | abrechnung | sicherheit | **personen** |
| **moduleContents.ts** | Profil | Firma | Abrechnung | Sicherheit | — |
| **Dateien** | ProfilTab | FirmaTab | AbrechnungTab | SicherheitTab | **PersonenTab** |

### Identifizierte Probleme

1. **Versteckter Menüpunkt "Personen":**
   - `PersonenTab.tsx` existiert (344 Zeilen)
   - Route `/portal/stammdaten/personen` ist aktiv in `StammdatenPage.tsx`
   - NICHT im Manifest deklariert → Inkonsistenz
   - Inhalt: Personen-Konfiguration (identisch/Ehepartner/Business) — überlappt mit `FirmaTab`

2. **"Firma" Tab macht keinen Sinn:**
   - Zeigt Organisationsdaten + Team-Mitglieder
   - Team-Management gehört eher in Zone 1 oder separaten Bereich
   - Name "Firma" ist irreführend für Privatnutzer

3. **Fehlender "Verträge" Tab:**
   - Keine zentrale Übersicht aller abgeschlossenen Vereinbarungen
   - Daten sind verstreut über: `user_consents`, `finance_mandates`, `acq_mandates`, `commissions`, `listings`

---

## SOLL-STRUKTUR

### Neue 4-Tile-Konfiguration

| Route | Titel | Icon | Beschreibung |
|-------|-------|------|--------------|
| `/profil` | Profil | User | Persönliche Daten + Kontakt |
| `/vertraege` | Verträge | FileText | **NEU:** Alle Vereinbarungen |
| `/abrechnung` | Abrechnung | CreditCard | Zahlungen + Credits |
| `/sicherheit` | Sicherheit | Shield | Passwort + 2FA |

### Zu löschende Komponenten

| Datei | Grund |
|-------|-------|
| `src/pages/portal/stammdaten/PersonenTab.tsx` | Versteckte Altlast, Funktion in ProfilTab integrieren |
| `src/pages/portal/stammdaten/FirmaTab.tsx` | Ersetzt durch VertraegeTab |

---

## TECHNISCHER PLAN

### Phase 1: Bereinigung

**1.1 Löschen von `PersonenTab.tsx`**
- Datei `src/pages/portal/stammdaten/PersonenTab.tsx` entfernen
- Route `/personen` aus `StammdatenPage.tsx` entfernen
- Export aus `index.ts` entfernen

**1.2 Löschen von `FirmaTab.tsx`**
- Datei `src/pages/portal/stammdaten/FirmaTab.tsx` entfernen
- Export aus `index.ts` entfernen

### Phase 2: Neue VertraegeTab Komponente

**2.1 Datenquellen für Verträge**

Die neue Komponente aggregiert folgende Tabellen:

| Quelle | Vertragstyp | Felder |
|--------|-------------|--------|
| `user_consents` + `agreement_templates` | AGB, Datenschutz, SCHUFA | template.title, consented_at, status |
| `finance_mandates` | Finanzierungsbeauftragung | created_at, status, finance_request.public_id |
| `acq_mandates` | Suchaufträge | created_at, status, title |
| `commissions` | Provisionsvereinbarungen | created_at, amount, status |
| `listings` | Verkaufsmandate | created_at, status, property_id |

**2.2 UI-Struktur**

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                           VERTRÄGE                                           │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Ihre abgeschlossenen Vereinbarungen                                         │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  📄 Datenschutzerklärung                              [Öffnen]         │ │
│  │     Akzeptiert am 06.02.2026, 14:30                                    │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │  📄 Allgemeine Geschäftsbedingungen                   [Öffnen]         │ │
│  │     Akzeptiert am 06.02.2026, 14:30                                    │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │  📋 Finanzierungsmandat FIN-ABC123                    [Öffnen]         │ │
│  │     Erteilt am 05.02.2026 — Status: In Bearbeitung                     │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │  📋 Verkaufsmandat — Leipziger Str. 42                [Öffnen]         │ │
│  │     Erteilt am 01.02.2026 — Status: Aktiv                              │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │  💰 Provisionsvereinbarung                            [Öffnen]         │ │
│  │     Abgeschlossen am 28.01.2026 — 2.500 €                              │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  Keine Verträge? Hier erscheinen automatisch alle Vereinbarungen.           │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**2.3 Implementierung**

```typescript
// src/pages/portal/stammdaten/VertraegeTab.tsx (Pseudocode)

export function VertraegeTab() {
  // 1. Consents (AGB, Datenschutz etc.)
  const { data: consents } = useQuery({
    queryKey: ['user-consents'],
    queryFn: async () => supabase
      .from('user_consents')
      .select('*, agreement_templates(*)')
      .eq('user_id', user.id)
      .eq('status', 'accepted')
      .order('consented_at', { ascending: false })
  });

  // 2. Finance Mandates
  const { data: financeMandate } = useQuery({
    queryKey: ['finance-mandates'],
    queryFn: async () => supabase
      .from('finance_mandates')
      .select('*, finance_requests(public_id)')
      .eq('tenant_id', tenantId)
  });

  // 3. Listings with Sales Mandate
  const { data: salesMandates } = useQuery({
    queryKey: ['sales-mandates'],
    queryFn: async () => supabase
      .from('listings')
      .select('*, properties(address)')
      .eq('tenant_id', tenantId)
      .not('sales_mandate_consent_id', 'is', null)
  });

  // 4. Commissions
  const { data: commissions } = useQuery({
    queryKey: ['commission-agreements'],
    queryFn: async () => supabase
      .from('commissions')
      .select('*')
      .eq('tenant_id', tenantId)
      .not('agreement_consent_id', 'is', null)
  });

  // Combine and sort by date
  const allAgreements = [
    ...formatConsents(consents),
    ...formatMandates(financeMandate),
    ...formatSalesMandates(salesMandates),
    ...formatCommissions(commissions),
  ].sort((a, b) => b.date - a.date);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verträge & Vereinbarungen</CardTitle>
        <CardDescription>
          Alle rechtlichen Vereinbarungen, die Sie abgeschlossen haben.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AgreementsList agreements={allAgreements} />
      </CardContent>
    </Card>
  );
}
```

### Phase 3: Manifest + Katalog Update

**3.1 routesManifest.ts**

```typescript
// VORHER
tiles: [
  { path: "profil", component: "ProfilTab", title: "Profil" },
  { path: "firma", component: "FirmaTab", title: "Firma" },
  { path: "abrechnung", component: "AbrechnungTab", title: "Abrechnung" },
  { path: "sicherheit", component: "SicherheitTab", title: "Sicherheit" },
],

// NACHHER
tiles: [
  { path: "profil", component: "ProfilTab", title: "Profil" },
  { path: "vertraege", component: "VertraegeTab", title: "Verträge" },
  { path: "abrechnung", component: "AbrechnungTab", title: "Abrechnung" },
  { path: "sicherheit", component: "SicherheitTab", title: "Sicherheit" },
],
```

**3.2 moduleContents.ts**

```typescript
// VORHER
subTiles: [
  { title: 'Profil', route: '/portal/stammdaten/profil', icon: User },
  { title: 'Firma', route: '/portal/stammdaten/firma', icon: Building },
  { title: 'Abrechnung', route: '/portal/stammdaten/abrechnung', icon: CreditCard },
  { title: 'Sicherheit', route: '/portal/stammdaten/sicherheit', icon: Shield },
],

// NACHHER
subTiles: [
  { title: 'Profil', route: '/portal/stammdaten/profil', icon: User },
  { title: 'Verträge', route: '/portal/stammdaten/vertraege', icon: FileText },
  { title: 'Abrechnung', route: '/portal/stammdaten/abrechnung', icon: CreditCard },
  { title: 'Sicherheit', route: '/portal/stammdaten/sicherheit', icon: Shield },
],
```

**3.3 StammdatenPage.tsx**

```typescript
// VORHER
const PersonenTab = lazy(() => ...);
const FirmaTab = lazy(() => ...);

<Route path="firma" element={<FirmaTab />} />
<Route path="personen" element={<PersonenTab />} />

// NACHHER
const VertraegeTab = lazy(() => import('./stammdaten/VertraegeTab').then(...));

<Route path="vertraege" element={<VertraegeTab />} />
// personen und firma Routen ENTFERNT
```

**3.4 index.ts**

```typescript
// VORHER
export { ProfilTab } from './ProfilTab';
export { PersonenTab } from './PersonenTab';
export { FirmaTab } from './FirmaTab';
export { AbrechnungTab } from './AbrechnungTab';
export { SicherheitTab } from './SicherheitTab';

// NACHHER
export { ProfilTab } from './ProfilTab';
export { VertraegeTab } from './VertraegeTab';
export { AbrechnungTab } from './AbrechnungTab';
export { SicherheitTab } from './SicherheitTab';
```

---

## DATEIEN DIE GEÄNDERT WERDEN

| Datei | Aktion |
|-------|--------|
| `src/pages/portal/stammdaten/PersonenTab.tsx` | **LÖSCHEN** |
| `src/pages/portal/stammdaten/FirmaTab.tsx` | **LÖSCHEN** |
| `src/pages/portal/stammdaten/VertraegeTab.tsx` | **NEU** — Verträge-Übersicht |
| `src/pages/portal/stammdaten/index.ts` | **UPDATE** — Exporte bereinigen |
| `src/pages/portal/StammdatenPage.tsx` | **UPDATE** — Routen anpassen |
| `src/manifests/routesManifest.ts` | **UPDATE** — Tile "firma" → "vertraege" |
| `src/components/portal/HowItWorks/moduleContents.ts` | **UPDATE** — SubTile anpassen |

---

## VERTRAGSTYPEN IN DER NEUEN ANSICHT

| Typ | Icon | Quelle | Beschreibung |
|-----|------|--------|--------------|
| AGB | FileText | `user_consents` | Allgemeine Geschäftsbedingungen |
| Datenschutz | Shield | `user_consents` | Datenschutzerklärung |
| SCHUFA-Einwilligung | FileCheck | `user_consents` | SCHUFA-Bonitätsprüfung |
| Finanzierungsmandat | Landmark | `finance_mandates` | Beauftragung zur Finanzierungsvermittlung |
| Verkaufsmandat | Tag | `listings` | Verkaufsbeauftragung |
| Provisionsvereinbarung | Coins | `commissions` | Provisionsabsprachen |
| Kooperationsvertrag | Handshake | `user_consents` | Partner-Kooperationen |
| Storage-Vertrag | HardDrive | `user_consents` | Premium-Storage |

---

## ERWARTETES ERGEBNIS

Nach der Implementierung:

1. **Saubere 4-Tile-Struktur:** Profil, Verträge, Abrechnung, Sicherheit
2. **Keine versteckten Routen:** `/personen` und `/firma` existieren nicht mehr
3. **Zentrale Vertrags-Übersicht:** Alle Vereinbarungen an einem Ort
4. **Konsistenz:** Manifest, Katalog und Code sind synchron
5. **Zukunftssicher:** Neue Vertragstypen (Payment, Legal) können einfach hinzugefügt werden

