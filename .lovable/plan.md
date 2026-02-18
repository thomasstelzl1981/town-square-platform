

# Affiliate-Partner im Zuhause-Modul und Sanierungsmodul

## Recherche-Ergebnis

### MyHammer — Affiliate-Programm BESTÄTIGT
- **Netzwerk**: Netslave / Instapro (NICHT AWIN)
- **Anmeldung**: https://partner.instapro.com/anmelden.cgi?new=1&cpid=4
- **Provision**: Pro zustande gekommenem Auftrag (Betrag verhandelbar)
- **Tracking**: Eigenes Tracking ueber Netslave-Plattform mit Banner, Textlinks, Deeplinks
- **Zulaessige Kanaele**: Displays, Textlinks, E-Mails (unter Bedingungen)
- **Nicht zulaessig**: Cashbacks, Promo-Codes, Gutscheine
- **Fazit**: Deeplink-Integration moeglich, kein Widget/API fuer eingebettete Suche

### Betreut.de — Affiliate ueber AWIN
- **Netzwerk**: AWIN / Care.com direkt
- **Provision**: CPA 5-10 % pro Premium-Abo
- **Integration**: Deeplink zu betreut.de/haushaltshilfe
- **Keine API** fuer externe Suche

### Aroundhome — Affiliate ueber AWIN (ID 68536)
- **Netzwerk**: AWIN (Advertiser ID 68536)
- **Anmeldung**: https://www.aroundhome.de/affiliateprogramm/
- **Provision**: Lead-basiert (Umsatzbeteiligung pro qualifiziertem Lead)
- **Produkte**: Fenster, Heizung, Daemmung, Solar, Badezimmer, Kueche, Treppen, Garagen
- **Integration**: AWIN-Deeplinks mit SubID-Tracking
- **Fazit**: Ideal fuer Sanierungsmodul — Lead-Formular oder Deeplink zu Kategorie-Seiten

---

## Teil 1: Zuhause-Modul (MOD-20) — Zwei neue Service-Kacheln

### UI-Skizze UebersichtTile

```text
+------------------------------------------------------------------+
|  [Home]  Miety                                              [+]  |
|  Ihr Zuhause auf einen Blick                                     |
+------------------------------------------------------------------+

+---------------------+---------------------+---------------------+
|  Mein Zuhause       |  Street View        |  Satellitenansicht  |
|  Max Mustermann     |  [Google Maps]      |  [Satellite Map]    |
|  Musterstr. 12      |                     |                     |
|  12345 Berlin       |                     |                     |
+---------------------+---------------------+---------------------+

+----------------------------------+----------------------------------+
|  [Wrench]                        |  [Users]                         |
|  Handwerker finden               |  Haushaltshilfe finden           |
|                                  |                                  |
|  Handwerker und Sanierungs-      |  Haushaltshilfen, Putzfrauen     |
|  profis in Ihrer Naehe.          |  und Alltagshelfer in Ihrer      |
|  MyHammer: 40.000+ gepruefte    |  Naehe. Betreut.de: Deutsch-     |
|  Fachleute in ganz Deutschland.  |  lands groesste Plattform.       |
|                                  |                                  |
|  PLZ: 12345 (aus Profil)         |  PLZ: 12345 (aus Profil)         |
|                                  |                                  |
|  [Handwerker suchen ->]          |  [Haushaltshilfe suchen ->]      |
|                                  |                                  |
|  MyHammer          [Partner]     |  betreut.de          [Partner]   |
|  by Instapro Group               |  by Care.com                     |
+----------------------------------+----------------------------------+

+------------------------------------------------------------------+
|  [Camera]  Kameras einrichten                                    |
|  Verbinden Sie eine kompatible IP-Kamera ...                     |
+------------------------------------------------------------------+
```

Die zwei Kacheln nutzen das bestehende `glass-card` Design und oeffnen die externe Plattform in einem neuen Tab.

- **Handwerker finden**: Deeplink zu `my-hammer.de` mit PLZ aus `miety_homes` und UTM/Affiliate-Parametern
- **Haushaltshilfe finden**: Deeplink zu `betreut.de/haushaltshilfe` mit AWIN-Affiliate-Tag

---

## Teil 2: Sanierungsmodul (MOD-04) — Aroundhome-Bereich

### UI-Skizze SanierungTab

Unterhalb der bestehenden WidgetGrid (Sanierungsprojekte) und vor dem Inline-Detail wird ein neuer Bereich "Sanierungspartner finden" eingefuegt:

```text
+------------------------------------------------------------------+
|  [HardHat]  Sanierung                                            |
|  Ausschreibungen, Angebote und Dokumentation                     |
+------------------------------------------------------------------+

+-------------------+-------------------+-------------------+------+
|  [DEMO]           |  [+] Neue         |  Case 1           | ...  |
|  Kernsanierung    |  Sanierung        |  Badsanierung     |      |
|  WE-B01           |  Objekt waehlen   |  Musterstr.       |      |
+-------------------+-------------------+-------------------+------+

+------------------------------------------------------------------+
|  [ExternalLink]  Sanierungspartner finden — Aroundhome            |
|                                                                  |
|  Finden Sie zertifizierte Fachbetriebe fuer Ihr Sanierungs-      |
|  projekt. Aroundhome vermittelt kostenlos bis zu 3 Angebote      |
|  von geprueften Fachfirmen in Ihrer Region.                      |
|                                                                  |
|  +-------------------+-------------------+-------------------+   |
|  |  Fenster &        |  Heizung &        |  Daemmung &       |   |
|  |  Tueren           |  Energie          |  Fassade          |   |
|  |                   |                   |                   |   |
|  |  [Angebote ->]    |  [Angebote ->]    |  [Angebote ->]    |   |
|  +-------------------+-------------------+-------------------+   |
|  +-------------------+-------------------+-------------------+   |
|  |  Badezimmer       |  Kueche           |  Solar &          |   |
|  |                   |                   |  Photovoltaik     |   |
|  |  [Angebote ->]    |  [Angebote ->]    |  [Angebote ->]    |   |
|  +-------------------+-------------------+-------------------+   |
|                                                                  |
|  Aroundhome                                        [Partner]     |
|  Deutschlands groesster Vermittler fuer Sanierung                |
+------------------------------------------------------------------+

--- (Inline-Detail bei Klick auf einen Case) ---
```

Jede Kategorie-Kachel verlinkt per AWIN-Deeplink auf die entsprechende Aroundhome-Kategorie-Seite (z.B. aroundhome.de/fenster/, aroundhome.de/heizung/).

---

## Teil 3: Zone 1 — PartnerContractsRegistry erweitern

Drei neue Eintraege im `PARTNER_CONTRACTS`-Array:

### MyHammer
```text
id: 'myhammer'
name: 'MyHammer (Instapro Group)'
type: 'affiliate'
module: 'MOD-20 Zuhause (Handwerker)'
purpose: 'Handwerker-Vermittlung (40.000+ Fachleute, 80.000 Auftraege/Monat)'
commissionModel: 'Provision pro zustande gekommenem Auftrag (via Netslave)'
network: 'Netslave / Instapro'
icon: Wrench
group: 'affiliate'
integrationDetails: 'Affiliate-Programm ueber Netslave-Plattform (partner.instapro.com).
  MyHammer ist Teil der Instapro-Gruppe (Europas fuehrender Handwerker-Marktplatz).
  Anmeldung: partner.instapro.com/anmelden.cgi?new=1&cpid=4
  Integration: Deeplinks mit Partner-ID und UTM-Tracking.
  Zulaessig: Displays, Textlinks, E-Mails. Nicht zulaessig: Cashbacks, Gutscheine.
  Keine API fuer externe Suche. PLZ-basierte Deeplinks moeglich.'
```

### Betreut.de
```text
id: 'betreut-de'
name: 'Betreut.de (Care.com)'
type: 'affiliate'
module: 'MOD-20 Zuhause (Haushaltshilfe)'
purpose: 'Haushaltshilfen, Putzfrauen, Seniorenbetreuung, Kinderbetreuung'
commissionModel: 'CPA: 5-10 % pro Premium-Abo-Abschluss'
network: 'AWIN / Direkt'
icon: Heart
group: 'affiliate'
integrationDetails: 'Betreut.de (Teil von Care.com) ist Deutschlands groesste Plattform fuer Alltagshelfer.
  Affiliate-Programm ueber AWIN pruefen oder Direktkontakt (affiliate@care.com).
  Integration: Deeplink zu betreut.de/haushaltshilfe mit Affiliate-Tag.
  Keine API fuer externe Suche. Cookie-Laufzeit: ca. 30 Tage.
  Conversion = Premium-Mitgliedschaft.'
```

### Aroundhome
```text
id: 'aroundhome'
name: 'Aroundhome'
type: 'affiliate'
module: 'MOD-04 Sanierung'
purpose: 'Sanierungsprojekte: Fenster, Heizung, Daemmung, Bad, Kueche, Solar'
commissionModel: 'Lead-Provision (Umsatzbeteiligung pro qualifiziertem Lead)'
network: 'AWIN (Advertiser ID 68536)'
icon: HardHat
group: 'affiliate'
integrationDetails: 'Aroundhome (aroundhome.de) ist Deutschlands groesster Vermittler fuer Sanierungsprojekte.
  AWIN-Programm: Advertiser ID 68536. Anmeldung: aroundhome.de/affiliateprogramm
  Integration: AWIN-Deeplinks zu Kategorie-Seiten (fenster, heizung, daemmung, bad, kueche, solar).
  SubID-Tracking fuer Conversion-Zuordnung. Cookie-Laufzeit: 30 Tage.
  Bis zu 3 kostenlose Angebote von geprueften Fachfirmen pro Lead.'
```

---

## Technische Uebersicht

| Datei | Aenderung |
|-------|-----------|
| `src/pages/portal/miety/components/MietyServiceCards.tsx` | Neue Komponente: 2 Service-Kacheln (MyHammer + Betreut.de) mit PLZ aus Home-Daten |
| `src/pages/portal/miety/tiles/UebersichtTile.tsx` | MietyServiceCards nach den Home-Kacheln (Zeile 258) und vor dem Kamera-Platzhalter (Zeile 261) einfuegen |
| `src/components/sanierung/AroundhomePartnerCard.tsx` | Neue Komponente: Aroundhome-Bereich mit 6 Kategorie-Kacheln als AWIN-Deeplinks |
| `src/pages/portal/immobilien/SanierungTab.tsx` | AroundhomePartnerCard nach der WidgetGrid (Zeile 151) und vor dem PropertySelectDialog (Zeile 153) einfuegen |
| `src/components/admin/integrations/PartnerContractsRegistry.tsx` | 3 neue Eintraege: MyHammer, Betreut.de, Aroundhome |

## Umsetzungsreihenfolge

1. `MietyServiceCards.tsx` erstellen (MyHammer + Betreut.de Deeplink-Kacheln)
2. `UebersichtTile.tsx` anpassen (Service-Kacheln einfuegen)
3. `AroundhomePartnerCard.tsx` erstellen (6 Kategorie-Kacheln mit AWIN-Deeplinks)
4. `SanierungTab.tsx` anpassen (Aroundhome-Bereich einfuegen)
5. `PartnerContractsRegistry.tsx` erweitern (3 neue Partner-Eintraege)

