
# Ergebnisbericht: Multi-Perspektiven-Test der Finanzierungsmodule

## A. Getestete User-Perspektiven und Ergebnisse

### Perspektive 1: Kapitalanleger auf Kaufy (Zone 3 -> Expose -> Finanzierung)

**Flow:** Kaufy Suche -> Expose oeffnen -> Investment Engine konfigurieren -> "Finanzierung beantragen" -> Selbstauskunft -> KDF-Vorcheck -> Einreichen

**Status: FUNKTIONAL mit Verbesserungspotenzial**

| Pruefpunkt | Status | Detail |
|---|---|---|
| CTA-Button "Finanzierung beantragen" | OK | Desktop in Sidebar, Mobile als Sticky-Footer |
| Sheet mit Objekt-Zusammenfassung | OK | Titel, PLZ, Preis, EK, Rate korrekt angezeigt |
| Engine-Params uebergeben | OK | equity, interestRate, monthlyRate, loanAmount korrekt gemappt |
| 3 Accordion-Sektionen | OK | Personal, Einkommen, Ausgaben/Vermoegen |
| Live-KDF-Ampel | OK | Berechnet Einnahmen vs. Ausgaben + Rate, Ampelsystem gruen/gelb/rot |
| DSGVO-Consent | OK | Checkbox vorhanden, Pflichtfeld |
| Submit -> Edge Function | OK | source: 'zone3_kaufy_expose' |
| Lead-Generierung Z1 | OK | leads-Tabelle mit zone1_pool=true |
| Datenraum-Erstellung | OK | tenant-documents/{tenantId}/MOD_11/{requestId}/ |
| Bestaetigungs-E-Mail | WARNUNG | Wird ausgeloest, aber futureroom.com Domain-Verifizierung in Resend noetig |
| Bestaetigungsansicht | OK | Public-ID, Naechste Schritte, Datenraum-Hinweis |

**Verbesserungsvorschlaege:**
1. KaufyFinanceRequestSheet: Die "Naechste Schritte" nach Einreichung erwaehnen noch einen "Link zu Ihrem persoenlichen Datenraum" — wir haben aber beschlossen, dass kein direkter Datenraum-Link kommt, nur E-Mail-Hinweis. Text anpassen auf: "Sie erhalten in Kuerze eine E-Mail mit einer Dokumenten-Checkliste. Senden Sie uns Ihre Unterlagen per E-Mail an finanzierung@futureroom.com unter Angabe Ihrer Vorgangsnummer."
2. Das Sheet hat kein Scroll-Verhalten fuer kleine Bildschirme — bei langen Formularen kann der Submit-Button auf kleinen Laptops nicht sichtbar sein. Der Submit-Button sollte sticky am unteren Rand sein.

---

### Perspektive 2: Normaler Finanzierungskunde auf FutureRoom (Zone 3)

**Flow:** FutureRoom.com -> "Finanzierung starten" -> 6-Step-Wizard -> Quick Submit oder Account erstellen

**Status: FUNKTIONAL**

| Pruefpunkt | Status | Detail |
|---|---|---|
| Homepage | OK | Sauber, 4-Step-Prozess, CTA klar |
| 4-Prozessschritte Darstellung | OK | Anfrage -> Vorpruefung -> Unterlagen -> Finanzierung (korrekt auf 4 erweitert) |
| Wizard (FutureRoomBonitat) | OK | 6 Steps: Kontakt, Objekt, Eckdaten, Kalkulation, Haushalt, Abschluss |
| Live-KDF im Wizard | OK | Wird in Step "Haushalt" berechnet |
| Quick Submit | OK | Ruft sot-futureroom-public-submit auf (source: zone3_quick) |
| Account-Path | OK | Speichert localStorage und leitet zu Login weiter |
| Lead-Generierung | OK | Gleiche Edge Function, Lead in Z1 |
| Bestaetigungsseite | OK | Public-ID, Konto-Erstellen-Option |

**Verbesserungsvorschlaege:**
3. Die FutureRoom Bestaetigungsseite (nach Quick-Submit) erwaehnt "Ein Finanzierungsmanager wird sich innerhalb von 48 Stunden bei Ihnen melden" — sollte ergaenzt werden um den Hinweis zur Unterlagen-E-Mail (analog zur Kaufy-Bestaetigung), da die E-Mail automatisch rausgeht.
4. Im FutureRoom-Wizard fehlt die `source`-Angabe — der Wizard sendet kein `source`-Feld im Payload, die Edge Function faellt auf 'zone3_quick' zurueck. Das ist korrekt, aber fuer Tracing sollte explizit `source: 'zone3_futureroom_wizard'` mitgegeben werden.

---

### Perspektive 3: Bestandskunde in MOD-07 (Zone 2 Portal)

**Flow:** Portal -> Finanzierung -> Selbstauskunft ausfuellen -> Anfrage erstellen -> Einreichen

**Status: FUNKTIONAL**

| Pruefpunkt | Status | Detail |
|---|---|---|
| SelbstauskunftTab | OK | V2-Formular mit persistent Profile |
| AnfrageTab | OK | MagicIntake + Kaufy-Suche + Eckdaten + Kalkulator + Haushaltsrechnung |
| Kaufy-Objektsuche | OK | Durchsucht v_public_listings, Auto-Fill |
| MagicIntake | OK | Sofortige Akten-Initialisierung |
| HouseholdCalculationCard | OK | T-Konto-Layout, CALC_MATRIX-Logik |

**Kein Aenderungsbedarf** — MOD-07 funktioniert eigenstaendig und korrekt.

---

### Perspektive 4: Projektant in MOD-13 (Zone 2)

**Flow:** Projekt anlegen -> Landing Page erstellen -> Expose mit Finanzierungs-CTA

**Status: GEPLANT, NOCH NICHT IMPLEMENTIERT**

Der Golden Path GP-FINANCE-Z3 erwaehnt MOD-13 Landing Pages als Quelle (`module: 'ZONE-3/MOD-07/MOD-11'`), aber die Integration des `KaufyFinanceRequestSheet` in die Landing Pages ist noch nicht umgesetzt. Das ist konsistent mit der Aussage im Plan: "Die Variante Kaufy werden wir zukuenftig in unserer Landingpage-Konzept mit einbetten aus Modul 13." — Also kein Fehler, aber als offener Punkt dokumentiert.

---

### Perspektive 5: Finanzierungsmanager in MOD-11 (Zone 2)

**Flow:** Dashboard -> Mandate sehen -> Fall oeffnen -> Selbstauskunft bearbeiten -> Split-View -> Bankeinreichung

**Status: FUNKTIONAL**

| Pruefpunkt | Status | Detail |
|---|---|---|
| FMDashboard | OK | Faelle, Mandate, Visitenkarte |
| FMFinanzierungsakte (Neuanlage) | OK | MagicIntake + Kaufy-Suche + Selbstauskunft |
| FMFallDetail (bestehender Fall) | OK | Split-View Toggle funktioniert |
| Split-View Layout | OK | Links: Kurzbeschreibung/Objekt/Kalkulator/Datenraum, Rechts: Selbstauskunft |
| Datenraum-Tile | OK | Zeigt MOD_11/{requestId} Pfad |
| Speichern Selbstauskunft | OK | Ueber "Speichern"-Button in Selbstauskunft-Header |
| Status-Workflow | OK | Annehmen -> Bearbeitung -> Ready -> Abschliessen |

**Verbesserungsvorschlaege:**
5. FMFallDetail: Das Datenraum-Tile ist nur ein Platzhalter ("Unterlagen per E-Mail oder DMS-Upload bereitstellen"). Es fehlt ein Button "Datenraum oeffnen", der zum Storage-Browser navigiert. Das ist ein Feature-Wunsch, kein Bug.
6. FMFallDetail: Bei Zone-3-Anfragen (source: zone3_kaufy_expose / zone3_quick) sind die Antragsteller-Daten im `applicant_snapshot` JSON gespeichert, aber die Selbstauskunft im FallDetail laedt aus `applicant_profiles`. Wenn kein `applicant_profiles`-Eintrag existiert (nur Snapshot), sind die Felder leer. Die Edge Function muesste optional einen `applicant_profiles`-Eintrag aus dem Snapshot erstellen.

---

## B. Spec- und Manifest-Abgleich

| Manifest/Spec | Status | Detail |
|---|---|---|
| GP_FINANCE_Z3.ts | OK | 6 Phasen, 8 Steps, 9 Fail-States, korrekte Ledger-Events |
| goldenPaths/index.ts | OK | GP-FINANCE-Z3 registriert, alle Ledger-Events in Whitelist |
| LEDGER_EVENT_WHITELIST | OK | Alle finance.z3.* Events vorhanden (13 Events) |
| Edge Function | OK | sot-futureroom-public-submit mit Lead + Datenraum + Email |
| routesManifest.ts | NICHT GEPRUEFT | Sollte Kaufy/FutureRoom-Routen enthalten (besteht bereits) |

---

## C. Empfohlene Reparaturen (geringes Risiko)

Diese Aenderungen sind kleine Textkorrekturen und Ergaenzungen, die keine Architektur-Auswirkungen haben:

### 1. KaufyFinanceRequestSheet — Bestaetigungstext anpassen (Zeilen 294-298)
Aktueller Text erwaehnt faelschlicherweise einen "Link zu Ihrem persoenlichen Datenraum". Korrekt: Nur E-Mail-Hinweis.

### 2. FutureRoomBonitat — Source-Feld explizit setzen
Im `handleQuickSubmit` das Feld `source: 'zone3_futureroom_wizard'` im Payload ergaenzen, damit die Herkunft in der Edge Function korrekt getrackt wird.

### 3. FutureRoomBonitat — Bestaetigungsseite ergaenzen
Nach Quick-Submit den Hinweis ergaenzen: "Sie erhalten in Kuerze eine E-Mail mit einer Dokumenten-Checkliste und Ihrer Vorgangsnummer."

### 4. KaufyFinanceRequestSheet — Submit-Button sticky machen
Den "Finanzierung einreichen"-Button als sticky Footer im Sheet positionieren, damit er auf kleinen Bildschirmen sichtbar bleibt.

---

## D. Groessere Verbesserungsvorschlaege (spaeter)

1. **Datenraum-Browser im FMFallDetail**: Button "Datenraum oeffnen" der die Dateien aus `tenant-documents/{tenantId}/MOD_11/{requestId}/` auflistet und Uploads erlaubt.
2. **Snapshot-zu-Profil-Migration**: Bei Zone-3-Anfragen automatisch einen `applicant_profiles`-Eintrag aus dem `applicant_snapshot` erstellen, damit der Finanzierungsmanager die Selbstauskunft direkt bearbeiten kann.
3. **MOD-13 Landing Page Integration**: `KaufyFinanceRequestSheet` auch in die Landing Pages einbetten (source: `zone3_landing_page`).
4. **E-Mail-Domain-Verifizierung**: `futureroom.com` in Resend verifizieren, damit die Bestaetigungs-E-Mails tatsaechlich zugestellt werden.

---

## E. Technische Details der Reparaturen

### Datei 1: `src/components/zone3/KaufyFinanceRequestSheet.tsx`
- **Zeilen 296-298**: Bestaetigungstext aendern — "Link zu Ihrem persoenlichen Datenraum" entfernen, ersetzen durch E-Mail-Hinweis mit `finanzierung@futureroom.com`
- **Zeile 313**: SheetContent: Submit-Button aus dem scrollbaren Bereich heraus in einen sticky Footer verschieben

### Datei 2: `src/pages/zone3/futureroom/FutureRoomBonitat.tsx`
- **Zeile 127 (handleQuickSubmit body)**: `source: 'zone3_futureroom_wizard'` zum Payload hinzufuegen
- **Zeile 203**: Bestaetigungstext ergaenzen um E-Mail-Hinweis

### Datei 3: Keine weiteren Dateien betroffen

Alle Aenderungen sind reine UI/Text-Korrekturen und betreffen keine Zone-2-Architektur oder Datenbankstruktur.
