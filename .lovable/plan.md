

# Recherche-Modul: Armstrong-Anbindung, Scroll-Fix und Flow-Pruefung

## 1. Scroll-Problem: Seite zu kurz

Aktuell hat die `ResearchTab`-Seite (`max-w-5xl mx-auto space-y-6`) keine Mindesthoehe. Wenn der Demo-Flow oder ein echtes Inline-Detail sich entfaltet, kann die Seite nicht weit genug gescrollt werden, weil der aeussere Container die Hoehe begrenzt.

**Loesung:** In `ResearchTab.tsx` dem aeusseren Container eine `min-h-[120vh]` oder `pb-40` (padding-bottom) hinzufuegen, damit nach dem letzten Element genuegend Platz bleibt und der Nutzer komfortabel scrollen kann.

| Datei | Aenderung |
|-------|-----------|
| `ResearchTab.tsx` | `pb-40` am aeusseren Container hinzufuegen |

---

## 2. Reale Auftraege: Flow-Sichtbarkeit pruefen

Der `ResearchOrderInlineFlow` zeigt bereits alle Sektionen (Eingabe, Credits, KI, Consent, Ergebnisse). Hier ist keine groessere Aenderung noetig — der Flow ist sichtbar sobald man eine Kachel aktiviert.

---

## 3. Armstrong-Anbindung: Recherche Pro als Action registrieren

### Problem
Armstrong kennt in seinem Advisor (`sot-armstrong-advisor/index.ts`) aktuell nur `MVP_MODULES = ["MOD-00", "MOD-04", "MOD-07", "MOD-08", "MOD-13"]`. MOD-14 fehlt komplett. Die vier MOD-14-Actions (`RESEARCH_FREE`, `RESEARCH_PRO`, `IMPORT_CANDIDATES`, `DEDUPE_SUGGEST`) sind zwar im Manifest definiert, aber Armstrong kann sie weder erkennen noch ausfuehren.

### Loesung: Neue Armstrong-Action fuer Recherche-Auftraege

Statt MOD-14 komplett als MVP-Modul freizuschalten (was alle Communication-Pro-Features betreffen wuerde), fuegen wir eine **gezielte Recherche-Action** hinzu:

**A) Neue Action im Manifest (`armstrongManifest.ts`):**

```
ARM.MOD14.CREATE_RESEARCH_ORDER
- title_de: "Rechercheauftrag erstellen und ausfuehren"
- execution_mode: execute_with_confirmation (wegen Credits)
- cost_model: metered
- cost_unit: per_contact
- side_effects: [credits_consumed, external_api_call]
- api_contract: { type: 'edge_function', endpoint: 'sot-research-run-order' }
```

**B) Armstrong Advisor erweitern (`sot-armstrong-advisor/index.ts`):**

1. `ARM.MOD14.CREATE_RESEARCH_ORDER` zu `MVP_EXECUTABLE_ACTIONS` hinzufuegen
2. Eine Action-Definition fuer den Advisor hinzufuegen (analog zu `GLOBAL_ACTIONS`)
3. Intent-Erkennung erweitern: Wenn der Nutzer "recherchiere Immobilienmakler in Muenchen" sagt, soll Armstrong:
   - Den Intent als `ACTION` klassifizieren
   - Die Action `ARM.MOD14.CREATE_RESEARCH_ORDER` vorschlagen
   - Parameter extrahieren: `intent_text`, `region`, `branche`, `max_results`
   - Credit-Kosten anzeigen und Bestaetigung anfordern
   - Bei Bestaetigung: `research_orders`-Eintrag erstellen und `sot-research-run-order` aufrufen
   - Bei Abschluss: Task-Widget am Dashboard erstellen (ueber `ARM.MOD00.CREATE_TASK` mit Link)

**C) Ablauf wenn Armstrong die Recherche ausfuehrt:**

```text
Nutzer: "Armstrong, recherchiere Immobilienmakler in Muenchen"
    |
    v
Armstrong: Intent = ACTION, Action = ARM.MOD14.CREATE_RESEARCH_ORDER
    |
    v
Armstrong zeigt ActionCard:
  "Rechercheauftrag: Immobilienmakler in Muenchen"
  "25 Kontakte x 0,50 EUR = 12,50 EUR"
  [Ausfuehren] [Abbrechen]
    |
    v (Nutzer bestaetigt)
Armstrong:
  1. Erstellt research_order (status: draft -> queued)
  2. Ruft sot-research-run-order auf
  3. Wartet auf Abschluss (polling oder callback)
  4. Erstellt Dashboard-Widget (task_widgets) mit Link
  5. Antwortet: "Recherche abgeschlossen: 18 Kontakte gefunden.
     Ich habe ein Widget auf deinem Dashboard erstellt."
```

**D) Dashboard-Widget nach Abschluss:**

Armstrong erstellt ueber `ARM.MOD00.CREATE_TASK` ein Widget:
- Titel: "Recherche: Immobilienmakler Muenchen"
- Beschreibung: "18 Kontakte gefunden — 14 neu, 4 bereits im Kontaktbuch"
- Link: `/portal/communication-pro/recherche` (mit order_id Query-Param)
- Status: done

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `ResearchTab.tsx` | `pb-40` fuer Scroll-Padding |
| `src/manifests/armstrongManifest.ts` | Neue Action `ARM.MOD14.CREATE_RESEARCH_ORDER` |
| `supabase/functions/sot-armstrong-advisor/index.ts` | MOD-14 Action in `MVP_EXECUTABLE_ACTIONS`, Action-Definition, Intent-Handling fuer Recherche-Auftraege mit Credit-Bestaetigung und Widget-Erstellung |

