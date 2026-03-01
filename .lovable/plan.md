

# CommPro Desk — Zone 1 Brand Phone Assistant Management UI

## Ausgangslage

**Was existiert:**
- 7 Brand-Tabs im CommPro Desk (Kaufy, FutureRoom, Acquiary, SoT, Lennox, Ncore, Otto)
- `BrandPhonePanel.tsx` — eine einfache 2-Spalten-Ansicht mit den bestehenden Cards (Status, Stimme, Content, Rules, Dokumentation, Call Log)
- Knowledge Store für Ncore bereits befüllt (6 Items), alle anderen Brands: leer
- Nur Ncore und Kaufy haben einen aktiven Assistant; die restlichen 5 haben leere `first_message` und `behavior_prompt`
- Die bestehenden Cards sind generisch und für Zone 2 (Endkunden) designed — sie bieten KEIN Knowledge-Management und keine Armstrong-Persona-Konfiguration

**Probleme:**
1. `BrandPhonePanel.tsx` liegt in `src/components/communication-pro/` (MOD-14 frozen) — Zone-Compliance-Verletzung, denn es ist eine Zone-1-Komponente
2. Kein UI zum Verwalten der `armstrong_knowledge_items` pro Brand
3. Kein sichtbarer Hinweis, dass Armstrong immer die Persona ist
4. Kein "Sync to ElevenLabs"-Button mit Status-Feedback
5. Keine Übersicht, welche Brands komplett konfiguriert sind vs. ausstehend

## Freeze-Analyse

| Pfad | Freeze | Aktion |
|------|--------|--------|
| `src/pages/admin/desks/CommProDesk.tsx` | Nicht gefrozen (Zone 1 Admin) | Editierbar |
| `src/components/communication-pro/*` | MOD-14 frozen | Neue Komponenten nach `src/components/admin/desks/commpro/` verschieben |
| `supabase/functions/*` | Nicht gefrozen (infra_freeze: edge_functions = false) | Editierbar |

**Entscheidung:** Alle neuen Komponenten werden in `src/components/admin/desks/commpro/` erstellt (Zone 1 korrekt). Die bestehenden MOD-14-Cards (StatusForwardingCard, VoiceSettingsCard, etc.) werden als shared wiederverwendet, da sie Props-basiert sind und keine Zone-spezifische Logik enthalten — ABER da MOD-14 frozen ist, importieren wir sie nur readonly. Neue Zone-1-spezifische Panels bauen wir neu.

---

## UI-Architektur — Neues BrandAssistantPanel

```text
┌──────────────────────────────────────────────────────────────┐
│ COMMPRO DESK HEADER (OperativeDeskShell)                     │
│ Brand Tabs: [Kaufy] [FutureRoom] [Acquiary] [SoT] ...       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌─ SEKTION 1: ARMSTRONG IDENTITY ──────────────────────────┐ │
│ │ 🤖 Armstrong · {Brand}                                   │ │
│ │ Armstrong-Avatar | Begrüßung (editierbar)                │ │
│ │ "Guten Tag, Sie sprechen mit Armstrong von Ncore..."     │ │
│ │                                                          │ │
│ │ Persona-Prompt (editierbar, auto-generiert aus Knowledge)│ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─ SEKTION 2: STATUS & TELEFONNUMMER ─┐┌─ STIMME ─────────┐ │
│ │ Aktiv: [Toggle]                     ││ Stimmprofil-Grid  │ │
│ │ Nummer: +49 89 4143 3040  [📋][🗑️]  ││ Stability/Clarity │ │
│ │ oder: [Nummer kaufen]               ││ Speed Sliders     │ │
│ │ Binding: ● Aktiv                    ││                   │ │
│ │ GSM-Codes (collapsible)             ││                   │ │
│ └─────────────────────────────────────┘└───────────────────┘ │
│                                                              │
│ ┌─ SEKTION 3: WISSENSBASIS (Knowledge Store) ─────────────┐ │
│ │ 📚 Brand-Wissen für Armstrong                            │ │
│ │ ┌──────────────────────────────────────────────────────┐ │ │
│ │ │ [Brand Persona]  Prio 10  instruction  ✏️ 🗑️        │ │ │
│ │ │ [Kontaktinfos]   Prio 15  instruction  ✏️ 🗑️        │ │ │
│ │ │ [Kernleistungen] Prio 20  faq          ✏️ 🗑️        │ │ │
│ │ │ [Privatstiftung]  Prio 25  faq          ✏️ 🗑️        │ │ │
│ │ │ [KI-Integration] Prio 30  faq          ✏️ 🗑️        │ │ │
│ │ └──────────────────────────────────────────────────────┘ │ │
│ │ [+ Wissensartikel hinzufügen]                           │ │
│ │                                                          │ │
│ │ Info: "Diese Artikel fließen automatisch in den          │ │
│ │ Armstrong-Prompt ein. Priorität bestimmt die Reihenfolge"│ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─ SEKTION 4: REGELN ────────┐┌─ DOKUMENTATION ───────────┐ │
│ │ ☑ Name erfassen            ││ E-Mail-Benachrichtigung    │ │
│ │ ☑ Anliegen erfassen        ││ Portal-Log                 │ │
│ │ ☑ Rückrufnummer bestätigen ││ Auto-Zusammenfassung       │ │
│ │ ☑ Dringlichkeit            ││ Aufgaben extrahieren       │ │
│ │ Max. Dauer: [120s]         ││ Aufbewahrung: [90 Tage]    │ │
│ └────────────────────────────┘└────────────────────────────┘ │
│                                                              │
│ ┌─ SEKTION 5: SYNC & VORSCHAU ────────────────────────────┐ │
│ │ [🔄 Agent synchronisieren]  Letzter Sync: 01.03.26 16:48│ │
│ │ Generierter Prompt (readonly, expandable):               │ │
│ │ ┌────────────────────────────────────────────────────┐   │ │
│ │ │ Du bist Armstrong, der KI-Assistent von Ncore...  │   │ │
│ │ │ ## WISSENSBASIS — NCORE                            │   │ │
│ │ │ ### Kernleistungen von Ncore ...                   │   │ │
│ │ │ ## GESPRÄCHSREGELN ...                             │   │ │
│ │ │ ## FORMATIERUNG (TELEFON) ...                      │   │ │
│ │ └────────────────────────────────────────────────────┘   │ │
│ │ Prompt-Länge: 2.741 Zeichen                             │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─ SEKTION 6: ANRUFPROTOKOLL ─────────────────────────────┐ │
│ │ (bestehende CallLogSection — readonly import)            │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Implementierungsplan

### Schritt 1: Neues Komponentenverzeichnis + BrandAssistantPanel

**Neue Dateien in `src/components/admin/desks/commpro/`:**

1. **`BrandAssistantPanel.tsx`** — Hauptpanel (ersetzt altes BrandPhonePanel)
   - Empfängt `brandKey` + `brandLabel`
   - Nutzt `useBrandPhoneAssistant` Hook (nicht frozen, liegt in `src/hooks/`)
   - Nutzt neuen `useBrandKnowledge` Hook für Knowledge Items
   - Armstrong-Identity-Header oben mit Brand-Name und fester Persona-Kennzeichnung
   - 6 Sektionen vertikal gestapelt

2. **`ArmstrongIdentityCard.tsx`** — Sektion 1
   - Zeigt Armstrong-Avatar/Icon + Brand-Name
   - Editierbares `first_message` Feld (Begrüßung)
   - Read-only Hinweis: "Armstrong meldet sich immer als Assistent von {Brand}"
   - Auto-generierte Vorschau der Begrüßung

3. **`BrandKnowledgeCard.tsx`** — Sektion 3 (Knowledge Store UI)
   - Liste aller `armstrong_knowledge_items` WHERE `brand_key = {brandKey}`
   - Sortiert nach `phone_prompt_priority`
   - Jedes Item: title_de, category Badge, priority, Edit/Delete Buttons
   - "Neuen Artikel hinzufügen" Button → Inline-Formular oder Dialog
   - Formular-Felder: title_de, category (Select: brand_persona/faq/instruction), content (Textarea), phone_prompt_priority (Number)
   - Info-Box: erklärt, dass diese Items automatisch in den Armstrong-Prompt einfließen

4. **`AgentSyncCard.tsx`** — Sektion 5
   - "Agent synchronisieren" Button → ruft `sot-phone-agent-sync` mit `action: 'sync'`
   - Zeigt den generierten `behavior_prompt` aus der DB (readonly, collapsible)
   - Zeigt Prompt-Länge, letzten Sync-Zeitpunkt
   - Status-Badges für Sync-Ergebnis (Agent created/updated, Phone imported/assigned)

### Schritt 2: Neuer Hook `useBrandKnowledge`

**Datei: `src/hooks/useBrandKnowledge.ts`**
- CRUD-Operationen auf `armstrong_knowledge_items` WHERE `brand_key = {brandKey}`
- `fetchItems()` — SELECT * ORDER BY phone_prompt_priority
- `createItem(item)` — INSERT mit auto-generiertem item_code
- `updateItem(id, updates)` — UPDATE
- `deleteItem(id)` — DELETE
- Reaktive Query mit `@tanstack/react-query`

### Schritt 3: CommProDesk Update

**Datei: `src/pages/admin/desks/CommProDesk.tsx`**
- Import ändern: von `BrandPhonePanel` (MOD-14) auf neues `BrandAssistantPanel` (Zone 1)
- Alles andere bleibt gleich (Tabs, Routing, OperativeDeskShell)

### Schritt 4: Knowledge-Daten für alle 7 Brands seeden

Für die 6 Brands ohne Knowledge Items (Kaufy, FutureRoom, Acquiary, SoT, Lennox, Otto) werden initiale `armstrong_knowledge_items` per SQL INSERT erstellt:
- **Jede Brand erhält mindestens 3 Items:**
  1. `brand_persona` (Prio 10) — Armstrong-Identität für diese Marke
  2. Kontaktinfos (Prio 15) — Adresse, Website, Telefon
  3. Kernleistungen (Prio 20) — Was die Firma macht

Die Inhalte werden aus den bestehenden Memory-Einträgen und Zone-3-Website-Daten zusammengestellt:
- **Kaufy**: Immobilienmarktplatz, KI-Exposé-Analyse
- **FutureRoom**: Digitale Immobilienplattform, 089 66667788
- **Acquiary**: Institutionelle Investmentanalyse
- **SoT**: Plattform-Governance, Barbarastraße 2D
- **Lennox**: Pet-Services, Robyn Gebhard
- **Otto²**: Baufinanzierung, Ruselstraße 16, 94327 Bogen

### Schritt 5: Bestehende shared Cards wiederverwenden

Die folgenden Cards aus `src/components/communication-pro/phone-assistant/` werden **importiert, nicht kopiert** (sie sind props-basiert und zonenagnostisch):
- `StatusForwardingCard` — Telefonnummer-Management
- `VoiceSettingsCard` — Stimmprofile + Sliders
- `RulesCard` — Reaktionslogik-Checkboxen
- `DocumentationCard` — E-Mail, Portal-Log, Aufbewahrung
- `CallLogSection` — Anrufprotokoll

Da MOD-14 frozen ist, werden diese **nur importiert, nicht modifiziert**. Neue Sektionen (Armstrong Identity, Knowledge Store, Agent Sync) werden als neue Zone-1-Komponenten erstellt.

---

## Technische Details

### Datenbank
- Keine Schema-Änderungen nötig — `armstrong_knowledge_items` hat bereits `brand_key` und `phone_prompt_priority`
- Nur INSERT für neue Knowledge Items (6 Brands × 3 Items = 18 Inserts)

### Edge Functions
- `sot-phone-agent-sync` bleibt unverändert — es assembelt bereits den Prompt aus Knowledge Items
- Der neue "Sync"-Button ruft diese Funktion direkt auf

### Keine Zone-2-Änderungen
- Zone 2 (`KiTelefonPage`, `usePhoneAssistant`) bleibt komplett unberührt
- Die Knowledge-Verwaltung ist rein Zone 1

