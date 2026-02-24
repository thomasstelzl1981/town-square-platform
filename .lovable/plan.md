

# Armstrong Begruessung: Nachname statt E-Mail-Prefix verwenden

## Problem
Die Armstrong-Begruessung zeigt "Guten Abend, Mr. rr" — weil `display_name` aus dem Profil den E-Mail-Prefix enthaelt ("rr"), nicht den echten Namen. Die Felder `first_name` ("Ralph") und `last_name` ("Reinhold") sind aber korrekt befuellt.

## Loesung

### 1. PortalDashboard.tsx — Besseren Namen uebergeben
Statt nur `profile?.display_name` wird eine Fallback-Kette verwendet:

```text
last_name > display_name > '' (leer)
```

Konkret: `profile?.last_name || profile?.display_name || ''`

So bekommt die GreetingCard "Reinhold" statt "rr".

### 2. ArmstrongGreetingCard.tsx — Namensformatierung anpassen (Zeile 42)
Die aktuelle Logik `name.split(' ')[0]` ist fuer einen vollen Namen gedacht, nimmt aber bei "rr" einfach "rr". 

Neue Logik:
```text
name vorhanden → "Mr. {name}" (kein split noetig, da bereits der Nachname kommt)
name leer → "Freund"
```

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| src/pages/portal/PortalDashboard.tsx (Zeile 121) | `displayName` Prop: `last_name` bevorzugen |
| src/components/dashboard/ArmstrongGreetingCard.tsx (Zeile 42) | `formattedName` Logik vereinfachen |

### Ergebnis
"Guten Abend, Mr. Reinhold!" statt "Guten Abend, Mr. rr!"

Beide Dateien gehoeren NICHT zu einem eingefrorenen Modul-Pfad (Dashboard-Widget + Portal-Page sind shared/portal), daher kein Freeze-Konflikt.
