

# Zone 2 — Funktionskatalog mit Demo-Blockierung

## Uebersicht

23 Module, 110 Tiles, ca. 130+ unterscheidbare Funktionen.
Spalte **Demo** zeigt: ✅ = sichtbar/nutzbar, 🔒 = Backend-Write blockiert (RLS), 🟡 = Edge Function (muss separat geprueft werden).

---

## MOD-00 Dashboard
| Funktion | Typ | Demo |
|---|---|---|
| Widget-Grid mit KPIs | Read | ✅ |
| Tages-Zitat (sot-zenquotes-proxy) | Edge Fn | 🟡 |
| Armstrong-Chat oeffnen | Edge Fn | 🟡 |
| Navigations-Tiles | Read | ✅ |

## MOD-01 Stammdaten
| Funktion | Typ | Demo |
|---|---|---|
| Profil anzeigen | Read | ✅ |
| Profil bearbeiten (Name, Adresse, Telefon) | Write | 🔒 |
| Avatar-Upload | Storage+Write | 🔒 |
| Vertraege anzeigen | Read | ✅ |
| Abrechnung anzeigen | Read | ✅ |
| Passwort aendern | Auth | 🔒 |
| 2FA aktivieren | Auth | 🔒 |
| Rechtliches (AGB, Datenschutz) | Read | ✅ |
| Demo-Daten Toggles | Write | 🔒 |

## MOD-02 KI Office
| Funktion | Typ | Demo |
|---|---|---|
| E-Mails anzeigen | Read | ✅ |
| E-Mail verfassen/senden | Edge Fn + Write | 🔒🟡 |
| Brief erstellen (KI-generiert) | Edge Fn + Write | 🔒🟡 |
| Brief als PDF exportieren | Client-side | ✅ |
| Kontakte anzeigen | Read | ✅ |
| Kontakt anlegen/bearbeiten | Write | 🔒 |
| Kontakt loeschen | Write | 🔒 |
| Kalender anzeigen | Read | ✅ |
| Termin anlegen/bearbeiten | Write | 🔒 |
| Widgets (Dashboard-Widgets) | Read | ✅ |
| WhatsApp (Platzhalter) | Read | ✅ |
| Videocall erstellen | Edge Fn + Write | 🔒🟡 |
| Videocall beitreten | Edge Fn | 🟡 |

## MOD-03 DMS
| Funktion | Typ | Demo |
|---|---|---|
| Dateien anzeigen (Storage-Tree) | Read | ✅ |
| Datei hochladen | Storage+Write | 🔒 |
| Datei herunterladen | Read | ✅ |
| Ordner erstellen | Write | 🔒 |
| Datei loeschen/verschieben | Write | 🔒 |
| Posteingang anzeigen | Read | ✅ |
| Magic Intake (KI-Dokumentenanalyse) | Edge Fn + Write | 🔒🟡 |
| Sortier-Container verwalten | Write | 🔒 |
| DMS Intelligenz (Einstellungen) | Read | ✅ |

## MOD-04 Immobilien
| Funktion | Typ | Demo |
|---|---|---|
| HOME/Zuhause (Miety inline) | Read | ✅ |
| Portfolio anzeigen | Read | ✅ |
| Immobilie anlegen | Write | 🔒 |
| Immobilienakte oeffnen (Dossier) | Read | ✅ |
| Immobilienakte bearbeiten | Write | 🔒 |
| Mietvertrag anlegen/bearbeiten | Write | 🔒 |
| Mietvertrag loeschen | Write | 🔒 |
| Zahlungsplan / Geldeingang | Read + Edge Fn | ✅🟡 |
| Kontenabgleich (sot-rent-match) | Edge Fn + Write | 🔒🟡 |
| NK-Abrechnung berechnen (ENG-NK) | Client Engine | ✅ |
| Steuertab (Anlage V) | Client Engine | ✅ |
| Sanierung-Tab | Read | ✅ |
| Bewertung (in Akte) | Read + Engine | ✅ |

## MOD-05 Pets
| Funktion | Typ | Demo |
|---|---|---|
| Tiere anzeigen | Read | ✅ |
| Tier anlegen | Write | 🔒 |
| Tierakte oeffnen | Read | ✅ |
| Tierakte bearbeiten | Write | 🔒 |
| Caring (Termine, Impfungen) | Read | ✅ |
| Shop (Affiliate-Links) | External | ✅ |
| Mein Bereich | Read | ✅ |

## MOD-06 Verkauf
| Funktion | Typ | Demo |
|---|---|---|
| Objekte anzeigen | Read | ✅ |
| Expose erstellen/bearbeiten | Write | 🔒 |
| Anfragen anzeigen | Read | ✅ |
| Vorgaenge anzeigen | Read | ✅ |
| Reporting | Read | ✅ |

## MOD-07 Finanzierung
| Funktion | Typ | Demo |
|---|---|---|
| Selbstauskunft anzeigen | Read | ✅ |
| Selbstauskunft erstellen/bearbeiten | Write | 🔒 |
| Dokumente hochladen | Storage+Write | 🔒 |
| Finanzierungsanfrage erstellen | Write | 🔒 |
| Finanzierungsanfrage einreichen | Edge Fn + Write | 🔒🟡 |
| Status anzeigen | Read | ✅ |
| Privatkredit-Rechner | Client Engine | ✅ |

## MOD-08 Investment-Suche
| Funktion | Typ | Demo |
|---|---|---|
| Objekte durchsuchen | Read | ✅ |
| Favoriten setzen/entfernen | Write | 🔒 |
| Mandat erstellen | Write | 🔒 |
| Mandat-Detail anzeigen | Read | ✅ |
| Investment-Expose anzeigen | Read | ✅ |
| Simulation (Renditerechner) | Client Engine | ✅ |

## MOD-09 Immomanager (Partner)
| Funktion | Typ | Demo |
|---|---|---|
| Katalog durchsuchen | Read | ✅ |
| Beratungs-Expose oeffnen | Read | ✅ |
| Kunden verwalten | Write | 🔒 |
| Netzwerk anzeigen | Read | ✅ |
| Provisionen anzeigen | Read | ✅ |

## MOD-10 Lead Manager (Partner)
| Funktion | Typ | Demo |
|---|---|---|
| Kampagnen anzeigen | Read | ✅ |
| Kampagne erstellen | Write | 🔒 |
| Brand-Tiles (Kaufy/FR/Acquiary) | Read | ✅ |
| Projekte-Leads anzeigen | Read | ✅ |

## MOD-11 Finanzierungsmanager (Partner)
| Funktion | Typ | Demo |
|---|---|---|
| Dashboard / aktive Faelle | Read | ✅ |
| Finanzierungsakte oeffnen | Read | ✅ |
| Einreichung vorbereiten | Write | 🔒 |
| Einreichung an Bank senden | Edge Fn + Write | 🔒🟡 |
| Provisionen anzeigen | Read | ✅ |
| Archiv durchsuchen | Read | ✅ |

## MOD-12 Akquisemanager (Partner)
| Funktion | Typ | Demo |
|---|---|---|
| Dashboard | Read | ✅ |
| Mandate anzeigen/erstellen | Write | 🔒 |
| Objekteingang (Drag&Drop Upload) | Storage+Write | 🔒 |
| Objekteingang KI-Analyse | Edge Fn | 🟡 |
| Datenbank durchsuchen | Read | ✅ |
| Tools (Portal-Recherche, Geo-Map) | Edge Fn | 🟡 |
| Outbound-Mail (sot-acq-outbound) | Edge Fn + Write | 🔒🟡 |
| Provisionen anzeigen | Read | ✅ |

## MOD-13 Projektmanager (Partner)
| Funktion | Typ | Demo |
|---|---|---|
| Dashboard | Read | ✅ |
| Projekt anlegen | Write | 🔒 |
| Projektakte oeffnen/bearbeiten | Write | 🔒 |
| Kalkulation (ENG-PROJEKT) | Client Engine | ✅ |
| InvestEngine-Expose | Read | ✅ |
| Vertrieb-Tab | Read | ✅ |
| Landing Page erstellen | Write | 🔒 |
| Lead Manager (Projekt-Kampagnen) | Write | 🔒 |
| Project Intake (KI-Analyse) | Edge Fn + Write | 🔒🟡 |

## MOD-14 Communication Pro (Partner)
| Funktion | Typ | Demo |
|---|---|---|
| Serien-E-Mails erstellen/senden | Edge Fn + Write | 🔒🟡 |
| KI-Recherche | Edge Fn | 🟡 |
| Social-Media Drafts erstellen | Write | 🔒 |
| Social-Media Video-Job | Edge Fn + Write | 🔒🟡 |
| KI-Telefonassistent | Edge Fn | 🟡 |

## MOD-15 Fortbildung
| Funktion | Typ | Demo |
|---|---|---|
| Buecher anzeigen | Read | ✅ |
| Fortbildungen anzeigen | Read | ✅ |
| Vortraege anzeigen | Read | ✅ |
| Kurse anzeigen | Read | ✅ |

## MOD-16 Shop
| Funktion | Typ | Demo |
|---|---|---|
| Amazon/Bueroshop24/Miete24/SmartHome | External Links | ✅ |
| Bestellungen anzeigen | Read | ✅ |

## MOD-17 Car-Management
| Funktion | Typ | Demo |
|---|---|---|
| Fahrzeuge anzeigen | Read | ✅ |
| Fahrzeug anlegen/bearbeiten | Write | 🔒 |
| Boote anzeigen | Read | ✅ |
| Privatjet anzeigen | Read | ✅ |
| Angebote anzeigen | Read | ✅ |

## MOD-18 Finanzen
| Funktion | Typ | Demo |
|---|---|---|
| Dashboard / Vermoegensübersicht | Read + Engine | ✅ |
| Konten anzeigen | Read | ✅ |
| Konto anlegen/bearbeiten | Write | 🔒 |
| Banktransaktionen importieren (CSV) | Write | 🔒 |
| Investment-Portfolio | Read | ✅ |
| Krankenversicherung anzeigen | Read | ✅ |
| Sachversicherungen anzeigen/anlegen | Write | 🔒 |
| Vorsorge anzeigen/anlegen | Write | 🔒 |
| Darlehen anzeigen/anlegen/loeschen | Write | 🔒 |
| Abonnements anzeigen/anlegen | Write | 🔒 |
| Testament & Vollmacht (Vorsorge-Docs) | Read | ✅ |
| Kontrolle (Finanz-Check) | Client Engine | ✅ |

## MOD-19 Photovoltaik
| Funktion | Typ | Demo |
|---|---|---|
| PV-Anlagen anzeigen | Read | ✅ |
| PV-Anlage anlegen | Write | 🔒 |
| PV-Akte oeffnen/bearbeiten | Write | 🔒 |
| Enpal (Vermittlung) | External | ✅ |
| Dokumente | Read | ✅ |

## MOD-20 Miety (Zuhause)
| Funktion | Typ | Demo |
|---|---|---|
| Uebersicht | Read | ✅ |
| Versorgung (Versorger-Daten) | Read | ✅ |
| Smart Home | Read | ✅ |
| Kommunikation (mit Vermieter) | Write | 🔒 |

## MOD-22 Pet Manager (Franchise)
| Funktion | Typ | Demo |
|---|---|---|
| Dashboard | Read | ✅ |
| Profil | Read | ✅ |
| Pension / Kalender | Read | ✅ |
| Leistungen verwalten | Write | 🔒 |
| Buchungen verwalten | Write | 🔒 |
| Mitarbeiter/Dienstplan | Write | 🔒 |
| Kunden verwalten | Write | 🔒 |
| Rechnungen erstellen | Write | 🔒 |
| Rechnungsstatus aendern | Write | 🔒 |

---

## Querschnittsfunktionen (alle Module)

| Funktion | Typ | Demo |
|---|---|---|
| Armstrong Chat (KI-Assistent) | Edge Fn (sot-armstrong-advisor) | 🟡 |
| Armstrong Actions (200+) | Edge Fn + Write | 🔒🟡 |
| Suche (globale Volltextsuche) | Read | ✅ |
| Benachrichtigungen | Read | ✅ |
| Demo-Toggle (Seed/Cleanup) | Write | 🔒 |
| Tenant-Reset | Edge Fn + Write | 🔒🟡 |

---

## Zusammenfassung

```text
Kategorie                   Anzahl    Demo-Status
──────────────────────────────────────────────────
Read-Only (Anzeige)          ~75      ✅ Voll nutzbar
Client-Engine (Rechner)       ~8      ✅ Voll nutzbar
External Links (Affiliate)    ~6      ✅ Voll nutzbar
Write (DB Insert/Update/Del) ~45      🔒 RLS blockiert
Edge Functions (KI/API)      ~15      🟡 Muss geprueft werden
Edge + Write kombiniert      ~12      🔒🟡 Doppelt blockiert
──────────────────────────────────────────────────
Gesamt                      ~161
```

## Offene Punkte

1. **🟡 Edge Functions im Demo:** Die RLS blockiert zwar DB-Writes, aber Edge Functions (Armstrong, Recherche, Videocalls) verbrauchen Credits/API-Calls. Hier muss entschieden werden: komplett sperren oder mit Budget-Limit erlauben?

2. **`useDemoReadOnly` Integration:** Der Hook existiert, wird aber noch in **keinem einzigen** Component importiert. Alle 🔒-Funktionen brauchen Frontend-Guards (Buttons disablen, Toast bei Klick).

3. **Armstrong im Demo:** Der KI-Assistent ist das Hauptargument fuer die Demo. Komplett sperren waere kontraproduktiv. Vorschlag: Armstrong erlauben, aber mit Demo-Credit-Limit (z.B. 10 Anfragen pro Session).

