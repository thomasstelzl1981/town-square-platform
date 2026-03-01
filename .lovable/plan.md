

# Analyse CommPro Desk — Befunde und Maßnahmen

## Befund 1: Sync-Button ist defekt (kritischer Bug)

Die `AgentSyncCard` sendet `brand_key` an die Edge Function, aber `sot-phone-agent-sync` erwartet `assistant_id`. Jeder Klick auf "Agent synchronisieren" liefert den Fehler `assistant_id required`. Der Sync funktioniert für keine einzige Marke über die UI.

**Fix:** `AgentSyncCard` muss die `config.id` (= assistant_id) aus dem Hook mitsenden.

## Befund 2: 6 von 7 Brands haben keinen ElevenLabs-Agent

| Brand | Telefonnummer | ElevenLabs Agent | Prompt | Status |
|-------|--------------|-----------------|--------|--------|
| Ncore | +4989... | Vorhanden | 2.700+ Zeichen | Funktionsfähig |
| Kaufy | +498941432270 | FEHLT | LEER | Nicht funktionsfähig |
| FutureRoom | +498941432401 | FEHLT | LEER | Nicht funktionsfähig |
| Acquiary | +498941432188 | FEHLT | LEER | Nicht funktionsfähig |
| SoT | (vorhanden) | FEHLT | LEER | Nicht funktionsfähig |
| Lennox | +498941434901 | FEHLT | LEER | Nicht funktionsfähig |
| Otto² | (vorhanden) | FEHLT | LEER | Nicht funktionsfähig |

Die Telefonnummern existieren in Twilio, sind aber nicht mit ElevenLabs verbunden. Anrufe werden derzeit nicht beantwortet.

**Fix:** Nach dem Bug-Fix muss jede Marke einmal synchronisiert werden. Dafür baue ich zusätzlich einen "Alle synchronisieren"-Button.

## Befund 3: Wissensbasis ist dünn und enthält keine Website-Inhalte

Jede Marke (außer Ncore) hat nur 3 Knowledge-Items mit jeweils 100-300 Zeichen:
- Persona (Begrüßung)
- Kontaktinfos (Adresse)
- Kernleistungen (1-2 Sätze)

Es gibt **keinen Bezug auf die Zone-3-Websites**. Armstrong kennt die Inhalte der Websites nicht.

**Fix:** Ich reichere die Knowledge Items für alle 6 Brands erheblich an — mit konkreten Leistungen, USPs, Zielgruppen und FAQ-Szenarien, basierend auf dem bekannten Brand-Wissen. Die Website-Inhalte fließen als Knowledge Items in den Store.

## Implementierungsplan

### Schritt 1: AgentSyncCard Bug-Fix
- `config.id` als `assistant_id` an die Edge Function übergeben statt `brand_key`
- Auch `brand_key` weiterhin mitsenden (für Logging)

### Schritt 2: "Alle Brands synchronisieren"-Button
- Neuer Button im CommProDesk-Header oder in der AgentSyncCard
- Iteriert über alle 7 Assistenten und ruft sync für jeden auf
- Fortschrittsanzeige (3/7 synchronisiert...)

### Schritt 3: Knowledge-Items anreichern (SQL Migration)
Für jede der 6 Brands (Kaufy, FutureRoom, Acquiary, SoT, Lennox, Otto²) werden die bestehenden 3 Items inhaltlich erweitert und 2-4 zusätzliche Items hinzugefügt:

- **Kaufy**: KI-Exposé-Analyse, Immobilienmarktplatz, Käufer/Verkäufer-Matching, Preisvergleich
- **FutureRoom**: Digitale Immobilienplattform, Mieterverwaltung, Smart-Home-Integration
- **Acquiary**: Institutionelle Investmentanalyse, Portfolio-Bewertung, Due Diligence
- **SoT**: Plattform-Governance, Multi-Brand-Orchestrierung, Technologie-Stack
- **Lennox**: Pet-Services, Tracker, Lakefields Futter, Robyn Gebhard als Gründerin
- **Otto²**: Baufinanzierung, Versicherungsberatung, Ruselstraße 16 Bogen

### Schritt 4: Edge Function anpassen
- Optional `brand_key` als alternativen Lookup akzeptieren (Fallback wenn `assistant_id` fehlt)

