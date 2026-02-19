

# MOD-04 Immobilienakte: Konto-Matching & Tab-Struktur Korrektur

## Analyse der vier gemeldeten Probleme

### 1. Geldeingang: Konto-Dropdown fehlt
**Befund: Code ist vorhanden, aber UI wird blockiert.**
Der Code in `GeldeingangTab.tsx` (Zeile 340-384) enthalt das Bank-Account-Dropdown korrekt. Es wird aus `msv_bank_accounts` geladen. Das Problem: Die gesamte Konto-Auswahl wird nur angezeigt, wenn ein aktives Mietverhaltnis existiert (`leases.length > 0`). Wenn kein aktiver Mietvertrag gefunden wird (z.B. wegen fehlender `unit_id`), zeigt die Komponente nur den leeren Zustand "Kein aktives Mietverhaltnis vorhanden".

**Loesung:** Pruefen, ob `unitId` korrekt an `GeldeingangTab` uebergeben wird. In `PropertyDetailPage.tsx` Zeile 551 wird `unitId={unit?.id || ''}` verwendet -- wenn kein Unit existiert, wird ein leerer String uebergeben, und die Query laeuft mit `.eq('unit_id', '')`, was keine Ergebnisse liefert. Hier muss die Fehlerbehandlung verbessert werden.

### 2. NK-Abrechnung zeigt Mieteinnahmen
**Befund: Korrekt so vorgesehen.**
Die Sektion 3 "Mieteinnahmen & Vorauszahlungen" in der NK-Abrechnung ist absichtlich enthalten. Sie zeigt die NK-Vorauszahlungen des Mieters fuer die Saldo-Berechnung (Kostenumlage minus Vorauszahlungen). Dies ist keine Darstellung der Geldeingaenge, sondern ein Berechnungsschritt fuer die Nebenkostenabrechnung. Hier besteht kein Fehler.

### 3. BWA-Tab: Falsche Ebene (Objekt statt Vermietereinheit)
**Befund: BWA ist aktuell als eigener Tab auf Objektebene in der Immobilienakte.**
Der BWA-Tab wurde als eigenstaendiger Tab in `PropertyDetailPage.tsx` (Zeile 494-497) eingefuegt. Der User hat Recht: BWA (Bewirtschaftungsanalyse) bezieht sich auf die gesamte Vermietereinheit, nicht auf ein einzelnes Objekt.

**Loesung:**
- BWA-Tab aus der PropertyDetailPage (Immobilienakte) entfernen
- BWA als Unterbereich im VerwaltungTab (Steuer/Tax) integrieren, mit einem Switch zwischen "Anlage V" und "BWA" Ansicht
- Die BWA-Engine bereits auf Vermietereinheit-Ebene aggregieren (alle Objekte einer VE zusammenfassen)

### 4. Steuer-Tab: Mieteingaenge als Datenquelle
**Befund: Daten kommen aus den Mietvertraegen (Soll-Miete), NICHT aus den tatsaechlichen Geldeingaengen.**
Der `useVVSteuerData` Hook (Zeile 152-154) berechnet `coldRentAnnual` und `nkAdvanceAnnual` direkt aus der `leases`-Tabelle:
```
coldRentAnnual: propLeases.reduce((s, l) => s + (l.rent_cold_eur || 0) * 12, 0)
```
Das ist die **Soll-Miete** aus dem Vertrag, nicht die tatsaechlich eingegangene Miete aus `rent_payments`.

**Bewertung:** Fuer die Anlage V (Steuererklaerung) ist die Soll-Miete steuerrechtlich korrekt -- das Finanzamt besteuert die vereinbarte Miete, nicht den tatsaechlichen Zahlungseingang. ABER: Es waere hilfreich, die tatsaechlichen Eingaenge als Vergleichswert (Ist vs. Soll) anzuzeigen, damit der Nutzer Diskrepanzen erkennen kann.

**Loesung:** Einen optionalen Hinweis im VVAnlageVForm einbauen, der bei Abweichung zwischen Soll (Vertrag) und Ist (rent_payments) warnt.

---

## Technischer Umsetzungsplan

### Schritt 1: BWA-Tab aus Immobilienakte entfernen
- `PropertyDetailPage.tsx`: BWA-TabsTrigger (Zeile 494-497) und TabsContent (Zeile 556-566) entfernen
- Import von `BWATab` und `BarChart3` Icon entfernen

### Schritt 2: BWA in VerwaltungTab (Steuer) integrieren
- `VerwaltungTab.tsx`: Toggle/Switch einfuegen zwischen "Anlage V" und "BWA" Modus
- Im BWA-Modus: BWATab auf Vermietereinheit-Ebene rendern (aggregiert ueber alle Objekte der gewaehlten VE)
- Props fuer BWATab anpassen: Statt einzelner `propertyId` werden aggregierte Werte aller Objekte der VE uebergeben

### Schritt 3: Geldeingang-Tab robuster machen
- `GeldeingangTab.tsx`: Bessere Behandlung wenn `unitId` leer ist -- Hinweis "Bitte zuerst eine Einheit anlegen" statt stille Fehlabfrage
- Sicherstellen, dass das Konto-Dropdown auch sichtbar bleibt, wenn der automatische Abgleich deaktiviert ist (die manuelle Kontenzuordnung sollte unabhaengig vom Auto-Match-Toggle sein)

### Schritt 4: Steuer-Tab Ist/Soll-Vergleich
- `useVVSteuerData.ts`: Optional die tatsaechlichen Mieteingaenge aus `rent_payments` laden
- Im `VVAnlageVForm`: Warnung anzeigen wenn Ist-Miete von Soll-Miete abweicht (z.B. bei Mietrueckstaenden)

