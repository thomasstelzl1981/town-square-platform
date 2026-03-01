

## Analyse

Der Kauf hat funktioniert (Status 200, Nummer `+498941433040` erfolgreich zugewiesen). Das Problem: Nach dem Kauf zeigt die UI nur einen kurzen Toast "Nummer gekauft" und schliesst den Dialog. Die Karte aktualisiert sich zwar (die Nummer erscheint im Input-Feld), aber es fehlt ein visueller Erfolgs-Moment.

## Plan

**Datei:** `src/components/communication-pro/phone-assistant/StatusForwardingCard.tsx`

Einen **Success-State** nach dem Kauf einbauen:

1. Neuen State `purchaseSuccess` + `purchasedNumber` hinzufuegen
2. Nach erfolgreichem Kauf (`handlePurchaseSelected`): statt Dialog sofort zu schliessen, auf eine Erfolgsansicht im Dialog umschalten
3. Erfolgsansicht zeigt:
   - Gruenes Haekchen-Icon mit Animation
   - "Herzlichen Glueckwunsch!" Ueberschrift
   - "Ihre neue Business-Nummer: +49 89 414 33040" (formatiert)
   - Kurzer Hinweistext: "Sie koennen diese Nummer direkt nutzen oder Ihre bisherige Nummer per Rufweiterleitung darauf umleiten."
   - Button "Verstanden" der den Dialog schliesst und `onRefresh()` ausfuehrt

4. `onRefresh()` wird erst beim Schliessen des Erfolgs-Dialogs aufgerufen (nicht sofort nach Kauf), damit der Nutzer die Erfolgsmeldung in Ruhe lesen kann.

Keine weiteren Dateien betroffen. Keine DB-Aenderungen noetig.

