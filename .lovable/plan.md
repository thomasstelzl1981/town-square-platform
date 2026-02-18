

## Demo-Daten aktualisieren: Lennox & Friends Dog Resorts

### Was wird geaendert?

Die Demo-Daten fuer den Pet Manager werden mit den realen Geschaeftsdaten von Lennox & Friends befuellt:

**Robyn Gebhard**
Lennox & Friends Dog Resorts
Rathausstr. 12, 85521 Ottobrunn
Telefon: +49 176 64 12 68 69
E-Mail: info@lennoxandfriends.com

### Betroffene Stellen

**1. `petManagerDemo.ts` — Kunden-Adressen anpassen**

Die Demo-Kunden-Adressen werden von Berlin nach Muenchen/Ottobrunn verlegt, da Lennox & Friends in Ottobrunn sitzt. Das macht die Demo-Daten geografisch konsistent.

**2. `constants.ts` — Kommentar aktualisieren**

Der Provider-Kommentar wird mit dem korrekten Firmennamen versehen.

**3. Dashboard `PMDashboard.tsx` — ManagerVisitenkarte erweitern**

Die ManagerVisitenkarte zeigt aktuell nur die Profildaten des eingeloggten Users (aus auth.profile). Fuer den Pet Manager sollte sie zusaetzlich den Firmennamen und die Rolle "Inhaberin" anzeigen. Das wird ueber die bereits vorhandenen Props `badgeText` und `role` sowie ein optionales `children`-Slot geloest:

- role: "Inhaberin" (statt generisch "Pet Manager")
- badgeText: "Lennox & Friends Dog Resorts" (Firmenname aus provider.company_name)

**4. DB-Seed pruefen**

Die Datenbank-Tabelle `pet_providers` muss den korrekten Firmennamen, Adresse, Telefon und E-Mail enthalten. Da der Provider per DB-Seed angelegt wurde, wird ein Update-Statement erstellt, das die realen Daten eintraegt:

```sql
UPDATE pet_providers SET
  company_name = 'Lennox & Friends Dog Resorts',
  address = 'Rathausstr. 12, 85521 Ottobrunn',
  phone = '+49 176 64 12 68 69',
  email = 'info@lennoxandfriends.com',
  facility_type = 'pension'
WHERE id = 'd0000000-0000-4000-a000-000000000050';
```

### Technische Dateien

| Datei | Aktion |
|-------|--------|
| `src/engines/demoData/petManagerDemo.ts` | EDIT — Kundenadressen auf Muenchen/Ottobrunn-Raum anpassen |
| `src/engines/demoData/constants.ts` | EDIT — Kommentar mit korrektem Firmennamen |
| `src/pages/portal/petmanager/PMDashboard.tsx` | EDIT — ManagerVisitenkarte: role="Inhaberin", badgeText=provider.company_name |
| DB (Insert-Tool) | UPDATE — pet_providers mit realen Lennox-Daten |

### Ergebnis

Nach der Umsetzung zeigt der Pet Manager im Demo-Modus:
- **Visitenkarte**: Robyn Gebhard, Inhaberin, Lennox & Friends Dog Resorts
- **Profil-Seite**: Korrekte Adresse Ottobrunn, Telefon, E-Mail
- **Kunden**: Adressen im Grossraum Muenchen (statt Berlin)
- **Zone 3 Website**: Firmenname "Lennox & Friends Dog Resorts" korrekt
