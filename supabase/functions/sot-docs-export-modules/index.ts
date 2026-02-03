import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// MODULES PACKAGE: MOD-01 to MOD-20 Documentation
// ============================================================================

const MOD_01 = `# MOD-01: Stammdaten

## Übersicht
| Attribut | Wert |
|----------|------|
| **Zone** | 2 (Portal) |
| **Pfad** | \`/portal/stammdaten\` |
| **Icon** | User |
| **Org-Types** | all |

## Tiles (4-Tile-Pattern)
- /profil — Persönliche Daten
- /firma — Firmendaten
- /abrechnung — Zahlungsmethoden
- /sicherheit — Passwort, 2FA

## Datenmodell
- \`profiles\` — User profile data
- \`organizations\` — Org settings
- \`memberships\` — User-Org relations
`;

const MOD_02 = `# MOD-02: KI Office

## Übersicht
| Attribut | Wert |
|----------|------|
| **Zone** | 2 (Portal) |
| **Pfad** | \`/portal/office\` |
| **Icon** | Bot |
| **Org-Types** | all |

## Tiles (4-Tile-Pattern)
- /email — E-Mail Integration
- /brief — KI-Briefgenerator
- /kontakte — Kontaktverwaltung
- /kalender — Terminplanung

## Integration
- Resend API für E-Mail
- OpenAI für Briefgenerierung
- Google Calendar Sync (planned)
`;

const MOD_03 = `# MOD-03: DMS

## Übersicht
| Attribut | Wert |
|----------|------|
| **Zone** | 2 (Portal) |
| **Pfad** | \`/portal/dms\` |
| **Icon** | FileText |
| **Org-Types** | all |

## Tiles (4-Tile-Pattern)
- /storage — Dokumenten-Tree
- /posteingang — Inbound Mail
- /sortieren — AI-Classification
- /einstellungen — Connector Setup

## Datenmodell
- \`documents\` — Document metadata
- \`storage_nodes\` — Virtual folder structure
- \`document_links\` — Entity linking
- \`extractions\` — AI extraction results
`;

const MOD_04 = `# MOD-04: Immobilien

## Übersicht
| Attribut | Wert |
|----------|------|
| **Zone** | 2 (Portal) |
| **Pfad** | \`/portal/immobilien\` |
| **Icon** | Building2 |
| **Org-Types** | client |

## Tiles (4-Tile-Pattern)
- /kontexte — Eigentümer-Kontexte
- /portfolio — Immobilien-Übersicht
- /sanierung — Sanierungs-Projekte
- /bewertung — Wertermittlung

## Datenmodell
- \`properties\` — Immobilien
- \`units\` — Einheiten
- \`landlord_contexts\` — Eigentümer-Kontexte
- \`loans\` — Darlehen

## SSOT-Prinzip
MOD-04 ist SSOT für alle Immobiliendaten. MOD-05 und MOD-06 sind read-only Derivate.
`;

const MOD_05 = `# MOD-05: MSV (Mietverwaltung)

## Übersicht
| Attribut | Wert |
|----------|------|
| **Zone** | 2 (Portal) |
| **Pfad** | \`/portal/msv\` |
| **Icon** | KeyRound |
| **Org-Types** | client |

## Tiles (4-Tile-Pattern)
- /objekte — MSV-aktivierte Objekte
- /mieteingang — Zahlungseingänge
- /vermietung — Vermietungsanzeigen
- /einstellungen — Premium-Konfiguration

## Workflows
- Mieteingangs-Matching
- Mahnwesen-Automatisierung
- Exposé-Publishing (Kaufy, Kleinanzeigen)
`;

const MOD_06 = `# MOD-06: Verkauf

## Übersicht
| Attribut | Wert |
|----------|------|
| **Zone** | 2 (Portal) |
| **Pfad** | \`/portal/verkauf\` |
| **Icon** | Gavel |
| **Org-Types** | client |

## Tiles (4-Tile-Pattern)
- /objekte — Verkaufsobjekte
- /vorgaenge — Sales Pipeline
- /reporting — Verkaufsanalysen
- /einstellungen — Verkaufs-Config

## Sales Pipeline
draft → active → reserved → sold | withdrawn
`;

const MOD_07 = `# MOD-07: Finanzierung

## Übersicht
| Attribut | Wert |
|----------|------|
| **Zone** | 2 (Portal) |
| **Pfad** | \`/portal/finanzierung\` |
| **Icon** | Landmark |
| **Org-Types** | client |

## Tiles (4-Tile-Pattern)
- /selbstauskunft — Selbstauskunft (9 Gruppen)
- /dokumente — Dokumenten-Upload
- /anfrage — Anfragedetails
- /status — Antragsstatus

## Selbstauskunft-Gruppen
1. Persönliche Daten
2. Haushalt & Wohnung
3. Beschäftigung
4. Einkommen
5. Vermögen
6. Verpflichtungen
7. Objekt
8. Finanzierungswunsch
9. Bestätigungen
`;

const MOD_08 = `# MOD-08: Investment-Suche

## Übersicht
| Attribut | Wert |
|----------|------|
| **Zone** | 2 (Portal) |
| **Pfad** | \`/portal/investments\` |
| **Icon** | Search |
| **Org-Types** | client |

## Tiles (4-Tile-Pattern)
- /suche — Objektsuche
- /favoriten — Watchlist
- /mandat — Suchmandat
- /simulation — Portfolio-Simulation

## Investment-Engine
40-Jahres-Projektion mit:
- Kaufnebenkosten
- Mietentwicklung
- Steuerberechnung (AfA)
- Wertsteigerung
`;

const MOD_09 = `# MOD-09: Vertriebspartner

## Übersicht
| Attribut | Wert |
|----------|------|
| **Zone** | 2 (Portal) |
| **Pfad** | \`/portal/vertriebspartner\` |
| **Icon** | Users |
| **Org-Types** | partner |

## Tiles (4-Tile-Pattern)
- /katalog — Objektkatalog
- /beratung — Beratungs-Tools
- /kunden — Kundenprojekte
- /network — Partner-Netzwerk

## Partner-Workflow
Verifizierung → Katalogzugang → Beratung → Provision
`;

const MOD_10 = `# MOD-10: Leads

## Übersicht
| Attribut | Wert |
|----------|------|
| **Zone** | 2 (Portal) |
| **Pfad** | \`/portal/leads\` |
| **Icon** | UserPlus |
| **Org-Types** | partner |

## Tiles (4-Tile-Pattern)
- /inbox — Pool-Leads
- /meine — Eigene Leads
- /pipeline — Deal-Pipeline
- /werbung — Meta Ads (planned)

## Lead-Lifecycle
captured → assigned → qualified → converted | lost
`;

const MOD_11 = `# MOD-11: Finanzierungsmanager

## Übersicht
| Attribut | Wert |
|----------|------|
| **Zone** | 2 (Portal) |
| **Pfad** | \`/portal/finanzierungsmanager\` |
| **Icon** | Landmark |
| **Org-Types** | partner |
| **Requires Role** | finance_manager |

## Tiles (4-Tile-Pattern)
- /how-it-works — So funktioniert's
- /selbstauskunft — Fall-Dossier
- /einreichen — Bank-Einreichung
- /status — Case-Tracking

## Workflow
Zone 1 FutureRoom → Mandate Inbox → Accept → Process → Submit to Bank
`;

const MOD_12 = `# MOD-12: Akquise-Manager

## Übersicht
| Attribut | Wert |
|----------|------|
| **Zone** | 2 (Portal) |
| **Pfad** | \`/portal/akquise-manager\` |
| **Icon** | Briefcase |
| **Org-Types** | partner |

## Tiles (4-Tile-Pattern)
- /dashboard — Akquise-Übersicht
- /kunden — Kundenakquise
- /mandate — Aktive Mandate
- /tools — Akquise-Werkzeuge
`;

const MOD_13 = `# MOD-13: Projekte

## Übersicht
| Attribut | Wert |
|----------|------|
| **Zone** | 2 (Portal) |
| **Pfad** | \`/portal/projekte\` |
| **Icon** | FolderKanban |
| **Org-Types** | all |

## Tiles (4-Tile-Pattern)
- /uebersicht — Projektübersicht
- /timeline — Gantt/Meilensteine
- /dokumente — Projektdokumente
- /einstellungen — Projekt-Config
`;

const MOD_14 = `# MOD-14: Communication Pro

## Übersicht
| Attribut | Wert |
|----------|------|
| **Zone** | 2 (Portal) |
| **Pfad** | \`/portal/communication-pro\` |
| **Icon** | Mail |
| **Org-Types** | partner |

## Tiles (4-Tile-Pattern)
- /serien-emails — Massen-E-Mail
- /recherche — Kontakt-Recherche
- /social — Social Media
- /agenten — KI-Outreach Agents
`;

const MOD_15 = `# MOD-15: Fortbildung

## Übersicht
| Attribut | Wert |
|----------|------|
| **Zone** | 2 (Portal) |
| **Pfad** | \`/portal/fortbildung\` |
| **Icon** | GraduationCap |
| **Org-Types** | partner |

## Tiles (4-Tile-Pattern)
- /katalog — Kurs-Katalog
- /meine-kurse — Laufende Kurse
- /zertifikate — Erworbene Zertifikate
- /einstellungen — Lernpräferenzen
`;

const MOD_16 = `# MOD-16: Services

## Übersicht
| Attribut | Wert |
|----------|------|
| **Zone** | 2 (Portal) |
| **Pfad** | \`/portal/services\` |
| **Icon** | Wrench |
| **Org-Types** | all |

## Tiles (4-Tile-Pattern)
- /katalog — Dienstleistungs-Katalog
- /anfragen — Offene Anfragen
- /auftraege — Aktive Aufträge
- /einstellungen — Präferenzen
`;

const MOD_17 = `# MOD-17: Car-Management

## Übersicht
| Attribut | Wert |
|----------|------|
| **Zone** | 2 (Portal) |
| **Pfad** | \`/portal/cars\` |
| **Icon** | Car |
| **Org-Types** | partner |

## Tiles (4-Tile-Pattern)
- /uebersicht — Fuhrpark-Dashboard
- /fahrzeuge — Fahrzeugverwaltung
- /service — Wartung & Reparatur
- /einstellungen — Fuhrpark-Config
`;

const MOD_18 = `# MOD-18: Finanzanalyse

## Übersicht
| Attribut | Wert |
|----------|------|
| **Zone** | 2 (Portal) |
| **Pfad** | \`/portal/finanzanalyse\` |
| **Icon** | LineChart |
| **Org-Types** | client |

## Tiles (4-Tile-Pattern)
- /dashboard — Finanz-Übersicht
- /reports — Finanzberichte
- /szenarien — Was-wäre-wenn
- /einstellungen — Analyse-Parameter
`;

const MOD_19 = `# MOD-19: Photovoltaik

## Übersicht
| Attribut | Wert |
|----------|------|
| **Zone** | 2 (Portal) |
| **Pfad** | \`/portal/photovoltaik\` |
| **Icon** | Sun |
| **Org-Types** | client |

## Tiles (4-Tile-Pattern)
- /angebot — PV-Angebote
- /checkliste — Installations-Vorbereitung
- /projekt — Laufende Projekte
- /einstellungen — PV-Config
`;

const MOD_20 = `# MOD-20: Miety

## Übersicht
| Attribut | Wert |
|----------|------|
| **Zone** | 2 (Portal) |
| **Pfad** | \`/portal/miety\` |
| **Icon** | Home |
| **Org-Types** | renter |

## ⚠️ EXCEPTION: 6 Tiles

MOD-20 ist die einzige Ausnahme vom 4-Tile-Pattern.

## Tiles (6-Tile-Exception)
- /uebersicht — Mieter-Dashboard
- /dokumente — Mietvertrag & Unterlagen
- /kommunikation — Chat mit Vermieter
- /zaehlerstaende — Verbrauchserfassung
- /versorgung — Strom, Gas, Wasser
- /versicherungen — Hausrat & Haftpflicht

## Mieter-Zugang
Einladung durch Vermieter via MOD-05 MSV → /miety/invite
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Starting MODULES package generation...');
    
    const zip = new JSZip();
    
    // Add all module docs
    zip.file('docs/modules/MOD-01_STAMMDATEN.md', MOD_01);
    zip.file('docs/modules/MOD-02_KI_OFFICE.md', MOD_02);
    zip.file('docs/modules/MOD-03_DMS.md', MOD_03);
    zip.file('docs/modules/MOD-04_IMMOBILIEN.md', MOD_04);
    zip.file('docs/modules/MOD-05_MSV.md', MOD_05);
    zip.file('docs/modules/MOD-06_VERKAUF.md', MOD_06);
    zip.file('docs/modules/MOD-07_FINANZIERUNG.md', MOD_07);
    zip.file('docs/modules/MOD-08_INVESTMENTS.md', MOD_08);
    zip.file('docs/modules/MOD-09_VERTRIEBSPARTNER.md', MOD_09);
    zip.file('docs/modules/MOD-10_LEADGENERIERUNG.md', MOD_10);
    zip.file('docs/modules/MOD-11_FINANZIERUNGSMANAGER.md', MOD_11);
    zip.file('docs/modules/MOD-12_AKQUISE_MANAGER.md', MOD_12);
    zip.file('docs/modules/MOD-13_PROJEKTE.md', MOD_13);
    zip.file('docs/modules/MOD-14_COMMUNICATION_PRO.md', MOD_14);
    zip.file('docs/modules/MOD-15_FORTBILDUNG.md', MOD_15);
    zip.file('docs/modules/MOD-16_SERVICES.md', MOD_16);
    zip.file('docs/modules/MOD-17_CAR_MANAGEMENT.md', MOD_17);
    zip.file('docs/modules/MOD-18_FINANZANALYSE.md', MOD_18);
    zip.file('docs/modules/MOD-19_PHOTOVOLTAIK.md', MOD_19);
    zip.file('docs/modules/MOD-20_MIETY.md', MOD_20);
    
    const zipContent = await zip.generateAsync({ type: 'base64' });
    
    console.log('MODULES package generated successfully');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        package: 'modules',
        zipBase64: zipContent,
        files: Array.from({length: 20}, (_, i) => `docs/modules/MOD-${String(i+1).padStart(2, '0')}_*.md`)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error generating MODULES package:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
