

## Armstrong Chatbot — Deep Knowledge & Integration Audit

### Ist-Zustand Analyse

```text
BEREICH              IST                                      PROBLEM
─────────────────────────────────────────────────────────────────────────
Knowledge Base       82 Artikel (6 Kategorien)                Keine KB für: Fahrzeuge, PV, Miety, PetManager, Fortbildung
Conversation Memory  Client-seitig (last 10 messages)         Kein serverseitiges Gedächtnis, kein Cross-Session-Kontext
Zone 3 Personas      Kaufy ✅ FutureRoom ✅ SoT ✅           Acquiary ❌ Lennox ❌ (fallen auf Kaufy-Default zurück)
Entity-Awareness     Entity-Type + ID wird gesendet           Armstrong liest KEINE Entity-Daten aus DB → antwortet "blind"
Proaktivität         Nur MOD-13 Intake hat proaktive Steps    Kein proaktives Handeln in 18 anderen Modulen
DSGVO                Keine Consent-Tracking für KI-Nutzung    Kein DSGVO-Banner oder Opt-in für Zone 3 Chat
Conversation Log     armstrong_action_runs Tabelle existiert   Chat-Nachrichten selbst werden NICHT gespeichert
Module Coverage      17 Module in MVP_MODULES                 MOD-03 (DMS), MOD-05 (MSV), MOD-06 fehlen im Advisor
```

---

### Geplante Verbesserungen (10 Punkte)

**1. Zone 3: Acquiary & Lennox Persona-Prompts im Advisor**
- `sot-armstrong-advisor/index.ts`: Neue `ACQUIARY_SYSTEM_PROMPT` und `LENNOX_SYSTEM_PROMPT` analog zu FutureRoom/SoT
- Route-Dispatch erweitern: `route.includes('/acquiary')` → Acquiary-Prompt, `route.includes('/lennox')` → Lennox-Prompt
- Acquiary-Prompt: Institutioneller Ankauf, Due Diligence, Datenraum-Analyse, Multi-Dokument-Parsing
- Lennox-Prompt: Tierservice-Matching, Buchungsassistenz, Service-Empfehlungen, DSGVO-konform (keine Tierdaten speichern)

**2. Entity-Awareness: Armstrong liest aktive Entität aus DB**
- Wenn `entity.type` + `entity.id` vorhanden → Armstrong lädt Kerndaten aus DB
- `property` → Adresse, Typ, Kaufpreis, Einheiten-Anzahl, Mieteinnahmen
- `mandate` → Suchprofil, Volumen, Status, Region
- `finance_case` → Darlehenssumme, Status, Bankpartner
- Daten werden als `ENTITY_CONTEXT` Block in den System-Prompt injiziert
- DSGVO: Nur eigene Tenant-Daten, RLS bleibt aktiv (Service-Role mit Tenant-Filter)

**3. Knowledge Base erweitern: 5 fehlende Kategorien**
- Neue KB-Artikel als CSV in `public/demo-data/` (Demo Data Governance!)
- Kategorien: `vehicles` (Fahrzeugbewertung, TCO, Leasing), `photovoltaik` (bereits 6 Artikel, auf 15 erweitern), `pet_services` (Tiergesundheit, Impfpläne, Versicherung), `education` (Fortbildungspflichten §34c, IHK-Kurse), `tenant_rights` (Mietrecht-Basics für MOD-20)
- `getModuleCategory()` Mapping erweitern für MOD-17/19/22/15/20

**4. Conversation Memory: Server-seitige Persistenz**
- Neue Tabelle `armstrong_chat_sessions` mit `session_id`, `user_id`, `tenant_id`, `messages JSONB[]`, `created_at`, `last_active_at`
- RLS: Nur eigene Sessions lesen/schreiben
- Advisor speichert jede Nachricht serverseitig → Cross-Session-Kontext möglich
- Retention: 90 Tage (analog Data Event Ledger), dann Auto-Löschung
- DSGVO: User kann eigene Chat-Historie löschen (neuer Button in Armstrong-Einstellungen)

**5. DSGVO-Compliance: KI-Chat Consent in Zone 3**
- Neuer `ArmstrongConsentBanner` in `ArmstrongWidget.tsx`
- Vor dem ersten Chat: "Dieses Gespräch wird von einer KI (Gemini 2.5 Pro) verarbeitet. Ihre Nachrichten werden für die Dauer der Sitzung gespeichert und danach gelöscht. [Einverstanden] [Ablehnen]"
- Consent wird in `localStorage` gespeichert (`armstrong_consent_${website}`)
- Ohne Consent: Chat-Input ist disabled, nur FAQ-Chips sind aktiv

**6. Proaktive Armstrong-Nachrichten in mehr Modulen**
- Pattern aus MOD-13 (`useIntakeListener`) generalisieren zu `useArmstrongProactiveHints`
- Trigger-Events:
  - MOD-04: Property mit unvollständigen Daten geöffnet → "Ich sehe, dass noch X Felder fehlen"
  - MOD-07: Selbstauskunft < 50% befüllt → "Soll ich aus deinen Dokumenten befüllen?"
  - MOD-03: Dokument hochgeladen → "Ich kann das Dokument analysieren. Soll ich?"
  - MOD-20: Mietvertrag hochgeladen → "Mietvertrag erkannt — soll ich Kerndaten extrahieren?"
- Implementierung: Custom Events (`armstrong:proactive`) von Modul-Seiten dispatchen

**7. Fehlende Module im MVP_MODULES Allowlist**
- `MOD-03` (DMS), `MOD-05` (MSV), `MOD-06` (Verkauf) zum `MVP_MODULES` Array hinzufügen
- Neue Actions registrieren:
  - `ARM.MOD03.ANALYZE_DOCUMENT` (Dokument-Zusammenfassung)
  - `ARM.MOD05.EXPLAIN_NK` (Nebenkostenabrechnung erklären)
  - `ARM.MOD06.SUGGEST_PRICE` (KI-Preisempfehlung)

**8. Conversation History an AI senden (statt nur letzte Nachricht)**
- Aktuell sendet `generateExplainResponse` nur `message` als single User-Turn
- Fix: `body.conversation.last_messages` als vollständigen Message-Array an Gemini senden
- Dadurch kann Armstrong auf vorherige Nachrichten referenzieren ("Wie ich vorhin sagte...")

**9. Zone 3 ArmstrongWidget: Streaming statt Blocking**
- Aktuell wartet Widget auf `response.json()` → keine Token-by-Token-Anzeige
- Upgrade auf SSE-Streaming (analog ChatPanel in Zone 2)
- Thinking-Indicator während Armstrong "denkt"
- Markdown-Rendering in Zone 3 Widget (aktuell nur Plaintext)

**10. Armstrong Kontextmenü: "Frag Armstrong" Button auf Entitäten**
- Kontextbezogener "🤖 Frag Armstrong" Button auf:
  - Property-Cards → öffnet Armstrong mit Pre-filled "Analysiere diese Immobilie"
  - Dokument-Cards → "Fasse dieses Dokument zusammen"
  - Finance-Cases → "Prüfe die Finanzierungsbereitschaft"
- Implementierung: `useArmstrongTrigger` Hook mit `openWithPrompt(prompt: string)`

---

### Betroffene Dateien

| Datei | Aktion |
|-------|--------|
| `supabase/functions/sot-armstrong-advisor/index.ts` | Persona-Prompts, Entity-Loading, History, Module-Allowlist |
| `src/components/zone3/ArmstrongWidget.tsx` | DSGVO-Banner, Streaming, Markdown |
| `src/hooks/useArmstrongAdvisor.ts` | Conversation-History senden |
| `src/hooks/useArmstrongProactiveHints.ts` | NEU: Proaktive Nachrichten |
| `src/hooks/useArmstrongTrigger.ts` | NEU: "Frag Armstrong" Kontext-Hook |
| `public/demo-data/demo_kb_*.csv` | NEU: KB-Artikel für fehlende Kategorien |
| DB Migration | `armstrong_chat_sessions` Tabelle |

### Empfohlene Reihenfolge

**Runde 1 (Sofort, High Impact):**
- Punkt 1 (Acquiary/Lennox Personas) + Punkt 8 (Conversation History fix) + Punkt 7 (fehlende Module)

**Runde 2 (UX-Upgrade):**
- Punkt 9 (Streaming in Zone 3) + Punkt 5 (DSGVO-Consent) + Punkt 2 (Entity-Awareness)

**Runde 3 (Proaktivität):**
- Punkt 6 (Proaktive Hints) + Punkt 10 (Frag Armstrong Button) + Punkt 3 (KB erweitern) + Punkt 4 (Session-Persistenz)

