

## Analyse: Zwei getrennte Probleme

### Problem 1: Warum so viele Assistenten?

Beide Hooks (`usePhoneAssistant.ts` für Zone 2 und `useBrandPhoneAssistant.ts` für Zone 1) haben **Auto-Create-Logik**: Wenn kein Assistent gefunden wird, wird automatisch einer angelegt.

| Assistent | Quelle | Wie entstanden |
|---|---|---|
| 3x "Mein Telefonassistent" (user_id gesetzt) | `usePhoneAssistant.ts` Zeile 86-91 | Jeder User, der die KI-Telefon-Seite in Zone 2 öffnet, bekommt automatisch einen persönlichen Assistenten |
| Acquiary, Otto, Ncore, Kaufy, Futureroom, Sot, Lennox | `useBrandPhoneAssistant.ts` Zeile 40-49 | Jede Brand-Seite in Zone 1, die besucht wird, erzeugt automatisch einen Brand-Assistenten |

Das Auto-Create-Verhalten ist **gewollt** für Zone 1 (Brand-Assistenten) — aber die 3 persönlichen Assistenten sind Nebenprodukte davon, dass User die Zone-2-Telefon-Seite besucht haben. Das ist kein Bug, sondern erwartetes Verhalten des Zone-2-Hooks.

**Aufräumen**: Die 3 persönlichen Assistenten (ohne Nummer, ohne Konfiguration) können gelöscht werden, falls Zone 2 noch nicht aktiv sein soll. Alternativ belassen wir sie — sie stören nicht.

### Problem 2: Warum wird aufgelegt ("kann dieses Gespräch nicht fortsetzen")

Die Fehlerkette im Log:

```text
1. sot-phone-inbound: Findet Ncore-Assistenten (is_enabled=true) ✅
2. sot-phone-inbound: Versucht Call-Session zu erstellen mit user_id=NULL ❌
   → DB-Fehler: 'null value in column "user_id" violates not-null constraint'
   → Session wird NICHT erstellt
3. sot-phone-inbound: Gibt trotzdem TwiML mit <Gather> zurück (Begrüßung spielt ab) ✅
4. User spricht → Twilio sendet SpeechResult an sot-phone-converse
5. sot-phone-converse: Sucht Session per CallSid → findet NICHTS (wurde nie erstellt)
   → "No session for CallSid" → "Entschuldigung, ich kann dieses Gespräch nicht fortsetzen" → Hangup ❌
```

**Root Cause**: Die Tabelle `commpro_phone_call_sessions` hat `user_id` als `NOT NULL`. Brand-Assistenten (Ncore) haben keinen `user_id`. Der Code im letzten Fix versuchte das zu handhaben (Zeile 87-92 in inbound), aber die DB-Constraint blockiert es.

### Fix-Plan

**1. DB-Migration: `user_id` auf nullable setzen**

```sql
ALTER TABLE commpro_phone_call_sessions ALTER COLUMN user_id DROP NOT NULL;
```

Das ist korrekt, weil Brand-Assistenten (Zone 1) keinen individuellen User haben — der Anruf gehört zur Marke, nicht zu einem User.

**2. Aufräumen der persönlichen Assistenten** (optional)

Die 3 "Mein Telefonassistent"-Einträge löschen, da Zone 2 noch nicht live ist. Oder belassen — sie sind inaktiv und stören den Flow nicht.

**3. Keine Edge-Function-Änderungen nötig**

Der Code in `sot-phone-inbound` behandelt `user_id: null` bereits korrekt (Zeile 87-92: `if (assistant.user_id) { sessionInsert.user_id = assistant.user_id; }`). Das Problem ist ausschließlich die DB-Constraint. Sobald die Spalte nullable ist, funktioniert der gesamte Flow.

### Erwartetes Ergebnis nach Fix

```text
Anruf → Begrüßung → User spricht → KI antwortet → Loop → Verabschiedung → Email an info@systemofatown.com
```

