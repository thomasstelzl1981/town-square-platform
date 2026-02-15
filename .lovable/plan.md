

# PV-Integration: Vollstaendiges Formular + Connector ohne Kommandozeile

## Problem 1: Connector-Sektion nicht sichtbar

Die Connector-Sektion ("Connector / Fernueberwachung") ist bereits im Dossier vorhanden (Zeile 212-387 in PVPlantDossier.tsx). Sie wird aber erst sichtbar, wenn du auf eine Anlage oder die Demo-Kachel klickst und dann nach unten scrollst. Das ist korrekt so — aber offenbar war nicht klar, dass man scrollen muss.

## Problem 2: "Neue Anlage erstellen" zeigt nicht alle Felder

Das Erstellformular zeigt aktuell nur 9 Felder (Name, Strasse, Ort, PLZ, kWp, Inbetriebnahme, Provider, WR-Hersteller, WR-Modell). Es fehlen alle anderen Felder aus dem Dossier (MaStR, Netzbetreiber, Zaehler, Batterie, etc.).

**Loesung:** Das Erstellformular wird auf alle Felder erweitert, gruppiert in Sektionen wie im Dossier:
- Stammdaten (Name, Strasse, PLZ, Ort)
- Technik (kWp, WR-Hersteller, WR-Modell, Batterie, Inbetriebnahme)
- Connector (IP-Adresse, Passwort, Intervall — direkt beim Erstellen)
- MaStR (Anlagen-ID, Einheit-ID, Status)
- Netzbetreiber (Netzbetreiber, Stromlieferant, Kundennummer)
- Zaehler (Einspeise- und Bezugszaehler)

## Problem 3: Bridge-Script / Kommandozeile ist nicht nutzbar

Das Python-Script erfordert Kommandozeilen-Kenntnisse und manuelle UUID-Eingabe. Das ist fuer einen normalen Nutzer nicht praktikabel.

**Loesung:** Die Connector-Sektion im Dossier bekommt einen "Verbindung pruefen"-Button, der die Edge Function `pv-connector-bridge` aufruft. Da die Edge Function nicht direkt auf 192.168.x.x zugreifen kann, wird der Flow so umgebaut:

1. **IP + Passwort im UI eingeben** (192.168.178.99 + dein SMA-Passwort)
2. **"Konfiguration speichern"** — speichert die Daten in `pv_connectors.config_json`
3. **Bridge-Anleitung vereinfacht** — der Befehl wird komplett vorausgefuellt (IP, Plant-ID, Tenant-ID, Connector-ID sind bekannt). Du musst nur noch das Passwort und den API-Key einsetzen. Der Befehl wird mit einem Klick kopiert.
4. **Alternativ: Demo-Fallback** — wenn kein Bridge laeuft, zeigt die UI weiterhin synthetische Demo-Daten

### Warum kein reiner UI-Button?

Der SMA Wechselrichter ist nur in deinem lokalen WLAN erreichbar (192.168.178.99). Unsere Cloud-Server koennen diese Adresse nicht erreichen. Das Bridge-Script laeuft auf deinem Computer, der im selben WLAN ist wie der Wechselrichter, und leitet die Daten an unsere Cloud weiter. Das ist die einzige technisch moegliche Loesung fuer lokale Geraete.

## Technische Aenderungen

### Datei: `src/pages/portal/photovoltaik/AnlagenTab.tsx`
- Erstellformular erweitern: alle Felder aus dem Dossier in Sektionen gruppiert
- Connector-Typ und IP direkt im Erstellformular einstellbar
- Automatische Connector-Erstellung beim Speichern (wenn IP eingegeben)

### Datei: `src/pages/portal/photovoltaik/PVPlantDossier.tsx`
- Connector-Sektion: Bridge-Befehl vollstaendig vorausgefuellt (nur Passwort fehlt)
- IP-Feld vorbelegt mit gespeichertem Wert aus config_json
- Klarere Anleitung in der UI: "Fuehre diesen Befehl auf deinem Computer aus (gleiches WLAN wie der Wechselrichter)"

### Datei: `tools/sma_bridge.py`
- Keine Aenderung noetig — das Script ist bereits fertig

