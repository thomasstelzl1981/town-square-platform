
# Reparaturplan: 10 Module mit Dokumentation synchronisieren

## Strategische Entscheidung

**Empfohlene Taktik: Schichtenbasierte Reparatur**

Statt jedes Modul einzeln komplett zu bauen, erstellen wir zunächst eine solide Foundation aus wiederverwendbaren Komponenten. Dies schützt die Architektur (Module bleiben isoliert) und beschleunigt die Folge-Module erheblich.

---

## Phase 0: Foundation (einmalig, schützt alle Module)

### 0.1 Shared UI Components erstellen

Neue Komponenten in `src/components/shared/`:

| Komponente | Zweck | Verwendet von |
|------------|-------|---------------|
| `DataTable.tsx` | Wiederverwendbare Tabelle mit Sortierung, Filter, Pagination | MOD-04, 05, 06, 09, 10 |
| `FormSection.tsx` | Formular-Gruppe mit Label und Fehlermeldung | MOD-01, 02, 07 |
| `DetailDrawer.tsx` | Rechtes Panel für Detailansicht | MOD-03, 04, 06 |
| `FileUploader.tsx` | Drag-Drop-Zone für Dateien | MOD-03 |
| `ContactPicker.tsx` | Kontakt-Auswahl mit Suche | MOD-02, 07, 10 |
| `StatusBadge.tsx` | Einheitliche Status-Anzeige | Alle Module |
| `EmptyState.tsx` | Leere-Liste-Anzeige mit CTA | Alle Module |

### 0.2 Sub-Page-Routing Pattern etablieren

Aktuell zeigen alle Sub-Routes die gleiche Page:

```
/portal/office        → OfficePage  (Dashboard)
/portal/office/email  → OfficePage  (Dashboard!) ← FALSCH
```

Korrektur durch Route-Parameter:

```
/portal/office        → OfficePage (Dashboard)
/portal/office/:tab   → OfficePage mit Tab-Erkennung
```

Jede ModulePage erkennt den aktuellen Sub-Tab und rendert die entsprechende Komponente.

---

## Phase 1: MOD-01 Stammdaten (Referenz-Modul)

### 1.1 Profil-Formular `/portal/stammdaten/profil`

Funktionen laut Dokumentation:
- Persönliche Daten anzeigen/bearbeiten (Vorname, Nachname, Telefon)
- Avatar-Upload
- E-Mail (read-only, da Auth)

Datenquelle: `profiles` Tabelle

UI-Komponenten:
- FormSection mit Input-Feldern
- FileUploader für Avatar
- Save-Button mit Toast-Feedback

### 1.2 Firma-Formular `/portal/stammdaten/firma`

Funktionen:
- Organisation bearbeiten (Name, Adresse, Steuernummer)
- Team-Mitglieder anzeigen
- Mitglied einladen

Datenquellen: `organizations`, `memberships`, `profiles`

### 1.3 Abrechnung `/portal/stammdaten/abrechnung`

Funktionen:
- Aktueller Plan anzeigen
- Rechnungen (invoices) auflisten
- Credits anzeigen

Datenquellen: `plans`, `invoices` (noch nicht vorhanden → Phase 2 DB-Migration)

### 1.4 Sicherheit `/portal/stammdaten/sicherheit`

Funktionen:
- Passwort ändern (Supabase Auth)
- Aktive Sessions anzeigen
- Session beenden

---

## Phase 2: MOD-03 DMS (Edge Functions verbinden)

### 2.1 Storage `/portal/dms/storage`

Funktionen laut Dokumentation:
- 3-Panel-Layout: Ordner-Baum | Dokument-Liste | Detail
- Ordner erstellen/umbenennen
- Dokument hochladen (mit sot-dms-upload-url Edge Function)
- Dokument herunterladen (mit sot-dms-download-url Edge Function)

Neue DB-Tabelle: `storage_nodes` (Ordnerstruktur)

UI-Komponenten:
- TreeView für Ordner
- DataTable für Dokumente
- FileUploader (Dropzone)
- DetailDrawer (rechts)

### 2.2 Posteingang `/portal/dms/posteingang`

Funktionen:
- Inbound-Items (Caya) anzeigen
- Download, Preview
- "Start sorting" Button

Datenquelle: `inbound_items` oder `documents` mit `source = 'caya'`

### 2.3 Sortieren `/portal/dms/sortieren`

Funktionen:
- Queue-Ansicht
- Accept / Correct / Reject
- Zuweisung zu Property/Contact/Unit

Interface-Action: `LinkDocumentToEntity` (aus INTERFACES.md)

### 2.4 Einstellungen `/portal/dms/einstellungen`

Funktionen:
- Extraction Toggle (automatisches Auslesen)
- Connectors anzeigen

---

## Phase 3: MOD-02 KI Office (komplexeste UI)

### 3.1 E-Mail Client `/portal/office/email`

Funktionen laut Dokumentation:
- 3-Panel-Layout: Folders | Mail-Liste | Detail
- Mail-Account verbinden (IMAP/Gmail/Exchange)
- E-Mails lesen (kein Senden in Phase 1)

Neue DB-Tabelle: `mail_accounts`, `mail_messages` (falls lokal gecached)

Hinweis: Dies ist ein komplexes Feature — Phase 1 zeigt nur "Account verbinden"-UI.

### 3.2 KI-Briefgenerator `/portal/office/brief`

Funktionen:
- Kontakt auswählen (ContactPicker)
- Brief-Template wählen
- Armstrong KI generiert Inhalt
- PDF erstellen + Preview
- Versand via SimpleFax/Briefdienst

Interface-Actions aus INTERFACES.md:
- `GetContactsForLetter`
- `GetSenderIdentity`
- `CreateCommunicationEvent`
- `ArchiveLetterAsDMS`

### 3.3 Kontakte `/portal/office/kontakte`

Funktionen:
- Kontakt-Liste (DataTable)
- Kontakt erstellen/bearbeiten
- Kontakt-Detail

Datenquelle: `contacts` (Backbone-Tabelle)

### 3.4 Kalender `/portal/office/kalender`

Funktionen:
- Kalender-Ansicht
- Termin erstellen
- Erinnerungen

Phase 1: Einfacher Termin-CRUD

---

## Phase 4: MOD-04 Immobilien (Source of Truth)

### 4.1 Portfolio `/portal/immobilien/portfolio`

Funktionen laut Dokumentation:
- 13-Spalten DataTable
- Objekt anlegen (mit sot-property-crud Edge Function)
- Objekt-Detail bearbeiten

Bereits vorhanden: PropertyList, PropertyDetail, PropertyForm

Aktion: Diese Legacy-Komponenten in das neue Tab-System integrieren.

### 4.2 Kontexte `/portal/immobilien/kontexte`

Funktionen:
- Vermieter-Kontexte verwalten
- Eigentumsstrukturen

### 4.3 Sanierung `/portal/immobilien/sanierung`

Funktionen:
- Service Cases
- Unzugeordnete Angebote
- Contractor-Suche (Google Places Integration)

### 4.4 Bewertung `/portal/immobilien/bewertung`

Funktionen:
- Bewertungs-Jobs anlegen
- Credits-System
- Consent für Datenfreigabe

---

## Phase 5: MOD-05 bis MOD-10 (Business-Module)

Jedes Modul folgt dem etablierten Pattern:

| Modul | Haupt-Feature | Wichtigste Integration |
|-------|---------------|------------------------|
| MOD-05 MSV | Lease-Verwaltung, Mieteingänge | Miety Invite Flow (DIA-015) |
| MOD-06 Verkauf | Listing-Publishing, 4 Channels | sot-listing-publish, DIA-011 |
| MOD-07 Finanzierung | Finance Packages, Handoff | Future Room Export, DIA-Consent |
| MOD-08 Investments | Multi-Source-Suche, Favoriten | Kaufy Sync (DIA-013), Investment Engine |
| MOD-09 Vertriebspartner | Partner-Pipeline, Commissions | MOD-06 Listings (DIA-012) |
| MOD-10 Leads | Lead-Inbox, Deal-Kanban | Zone 1 Pool (DIA-016) |

---

## Cross-Modul-Verbindungen (gemäß Flowcharts)

```text
Zone 3 Websites
      │
      ▼
┌─────────────────────────────────────────────────────┐
│  Zone 1: Lead Pool (Admin qualifiziert/verteilt)    │
└─────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────┐
│                    Zone 2 Portal                     │
│  ┌──────┐   ┌──────┐   ┌──────┐   ┌──────┐         │
│  │MOD-10│◄──│MOD-09│◄──│MOD-06│◄──│MOD-04│         │
│  │Leads │   │Partner│   │Verkauf│   │Immob.│         │
│  └──────┘   └──────┘   └──────┘   └──────┘         │
│      │                      │          ▲            │
│      │                      │          │            │
│      ▼                      ▼          │            │
│  ┌──────┐              ┌──────┐   ┌──────┐         │
│  │Deals │              │Kaufy │   │MOD-05│         │
│  │      │              │Publish│   │MSV   │         │
│  └──────┘              └──────┘   └──────┘         │
└─────────────────────────────────────────────────────┘
```

---

## Implementierungs-Reihenfolge

| Schritt | Was | Warum zuerst |
|---------|-----|--------------|
| 1 | Shared Components | Basis für alle Module |
| 2 | Sub-Page-Routing | Jede Sub-URL zeigt eigene Komponente |
| 3 | MOD-01 Stammdaten | Einfachstes Modul, sofort testbar |
| 4 | MOD-03 DMS | Edge Functions bereits vorhanden |
| 5 | MOD-04 Immobilien | Legacy-Code integrieren |
| 6 | MOD-02 KI Office | Komplexeste UI |
| 7 | MOD-05 bis MOD-10 | Geschäfts-Module nach Pattern |

---

## Technische Umsetzungsdetails

### Sub-Page-Routing-Lösung

Jede ModulePage wird so umgebaut:

```tsx
// OfficePage.tsx
const OfficePage = () => {
  const { tab } = useParams(); // email | brief | kontakte | kalender
  
  // Tab-Komponenten dynamisch laden
  const renderContent = () => {
    switch (tab) {
      case 'email': return <OfficeEmailTab />;
      case 'brief': return <OfficeBriefTab />;
      case 'kontakte': return <OfficeKontakteTab />;
      case 'kalender': return <OfficeKalenderTab />;
      default: return <OfficeDashboard />;
    }
  };
  
  return (
    <div className="space-y-6">
      <ModuleHeader title="KI Office" />
      <SubTabNav tabs={subTiles} currentTab={tab} />
      {renderContent()}
    </div>
  );
};
```

### Datenbank-Erweiterungen

Folgende Tabellen werden benötigt:

1. `storage_nodes` - DMS Ordnerstruktur
2. `letter_drafts` - KI-Brief Entwürfe
3. `mail_accounts` - E-Mail Account-Verbindungen
4. `invoices` - Billing-Rechnungen

---

## Schutzmechanismen für Architektur

1. **Module-Isolation**: Jedes Modul hat eigenen Ordner unter `src/pages/portal/[module]/`
2. **Interface-Actions**: Cross-Modul-Aktionen nur über dokumentierte Interfaces
3. **RLS**: Alle Tabellen mit tenant_id-Check
4. **Consent-Gates**: Sensible Aktionen erfordern User-Zustimmung (aus INTERFACES.md)

---

## Zusammenfassung

**Problem**: Alle 10 Module sind leere Hüllen ohne Funktionen.

**Lösung**: Schichtenbasierte Reparatur in 5 Phasen.

**Ergebnis**: Vollständig funktionale Module mit:
- Eingabeformularen
- Datenlisten
- Edge Function-Anbindung
- Cross-Modul-Flows gemäß Dokumentation

**Nächster Schritt**: Phase 0 (Shared Components) + Phase 1 (MOD-01 Stammdaten) implementieren.
