

## DMS & Dokumentenintelligenz — Deep Audit & KI-Maximierung

### Ist-Zustand: Was existiert bereits

```text
BEREICH                    IST-ZUSTAND                                    BEWERTUNG
────────────────────────────────────────────────────────────────────────────────────────
Document Parser            10 Modi (immobilie→allgemein), Gemini 2.5 Pro  ✅ Solide
Post-Eingang               Resend Webhook → PDF → Chunks → Auto-Route    ✅ Solide
NK-Beleg Parser            Spezialisiert, 1 Credit/PDF, nk_beleg_extr.   ✅ Basis
Storage Extractor          Batch-Extraktion, document_chunks für Suche    ✅ Basis
Magic Intake               10 Action-Codes, Armstrong-Doc-Upload          ✅ Solide
V+V Steuer                 AfA-Kalkulation + Plausibilitäts-KI           ✅ Basis
NK-Abrechnung Engine       BetrKV §2 Taxonomie, Verteilerschlüssel       ✅ Basis
Finanzierung Parser        Darlehensvertrag → finance_requests            ✅ Basis
────────────────────────────────────────────────────────────────────────────────────────
WEG-Abrechnung KI-Parse    ❌ FEHLT — manuelles Einpflegen               KRITISCH
Rechnungs-KI               ❌ FEHLT — keine automatische Zuordnung       KRITISCH  
Steuerberater-KI (Anlage V)❌ Nur Plausibilitätscheck, kein Auto-Fill    MITTEL
NK Cross-Validation        ❌ Keine KI-Kreuzprüfung Belege vs. WEG       MITTEL
Datenraum-KI (Bulk)        ❌ Extrahiert Text, aber keine Strukturierung  MITTEL
Finanzierung Aufbereitung  ❌ Kein KI-Bankunterlage-Generator             KRITISCH
E-Mail → Rechnung Auto     ❌ Emails mit Rechnungen nicht erkannt         MITTEL
```

---

### 12 Konkrete KI-Verbesserungen

**1. WEG-Abrechnungs-Parser (KRITISCH — größter Pain Point)**
- Neue Edge Function: `sot-weg-abrechnung-parse`
- Input: WEG-Hausgeldabrechnung als PDF (oft 20-30 Seiten, Tabellen)
- KI extrahiert: Alle Kostenpositionen pro Kostenart → mappt auf `NKCostCategory`
- Output: Befüllt `nk_cost_items` automatisch mit `mapping_source: 'ai'`
- Zwei-Schritt: Gemini 2.5 Flash für Tabellen-CSV-Extraktion → Gemini 2.5 Pro für Kategorie-Mapping
- Nutzung der shared `tabular-parser.ts` + neue `costCategoryMapping.ts` Regeln
- **Effekt**: Stunden manuelle Arbeit → 30 Sekunden KI

**2. Rechnungs-KI mit Auto-Zuordnung**
- Neue Edge Function: `sot-invoice-parse`
- Erkennt aus jeder Rechnung: Absender, Betrag, Datum, MwSt, Verwendungszweck
- Auto-Zuordnung zu Property + NK-Kategorie basierend auf:
  - Absender-Matching (Versorger bereits in `nk_beleg_extractions` bekannt)
  - Betrags-Pattern (wiederkehrende Kosten erkennen)
  - Adress-Matching (Rechnungsadresse = Property-Adresse)
- Speichert in neue Tabelle `invoice_extractions` mit Status `auto_matched` / `needs_review`
- **Effekt**: Rechnungen landen automatisch beim richtigen Objekt

**3. Steuerberater-KI für Anlage V (ERWEITERT)**
- `sot-vv-prefill-check` erweitern zu `sot-vv-steuer-advisor`:
  - Nicht nur Plausibilitätsprüfung, sondern aktiver Steueroptimierungsvorschlag
  - Prüft: §35a-fähige Handwerkerkosten (20% absetzbar), Erhaltungsaufwand vs. Herstellung (3-Jahres-Regel), Leerstandszeiten und Vermietungsabsicht
  - Generiert Anlage-V-Entwurf im ELSTER-XML-Format (oder zumindest strukturierte Vorlage)
  - Vorjahresvergleich: "Ihre Werbungskosten sind um 23% gestiegen — plausibel?"
  - Grenzen: Kein Steuerberatungsersatz, sondern "Vorbereitung für den Steuerberater"

**4. NK-Kreuzvalidierung: Belege vs. WEG-Abrechnung**
- Neue Funktion in `sot-nk-beleg-parse` oder separater Endpoint
- KI vergleicht: Summe aller NK-Belege vs. Hausgeld-Ist lt. WEG-Abrechnung
- Erkennt: Fehlende Belege, doppelte Buchungen, Abweichungen > 10%
- Output: Validierungsreport mit Ampelsystem (Grün/Gelb/Rot pro Kostenart)
- **Effekt**: Kein "vergessener" Beleg mehr, NK-Abrechnung wird wasserdicht

**5. Datenraum-Intelligenz (ENG-STOREX Upgrade)**
- Aktuell: `sot-storage-extractor` extrahiert nur Volltext in `document_chunks`
- Upgrade: Strukturierte Extraktion per Dokument-Typ
  - Kaufverträge → Notardaten, Kaufpreis, Übergabedatum, Grundbuchdaten
  - Mietverträge → Kaltmiete, NK-Vorauszahlung, Kündigungsfrist, Mietbeginn
  - Versicherungspolicen → Policennr., Prämie, Deckungssumme
- Extrahierte Daten → `document_structured_data` (neue JSONB-Tabelle)
- Armstrong kann dann fragen: "Wann endet der Mietvertrag von Wohnung 3?" → direkte Antwort
- **Effekt**: Datenraum wird zur durchsuchbaren Wissensbasis

**6. Finanzierungs-Aufbereitung KI (KRITISCH)**
- Neue Edge Function: `sot-finance-prepare`
- Sammelt automatisch alle nötigen Bankunterlagen:
  - Selbstauskunft (aus `selbstauskunft_profiles`)
  - Objektdaten (aus `properties`)
  - Einkommensnachweise (aus DMS, auto-erkannt)
  - Vermögensübersicht (aus `household_persons` + Bankkonten)
- Generiert: Bankunterlage-Paket als strukturierten Export
- KI-Prüfung: "Fehlende Unterlagen für Bankantrag: Grundbuchauszug, letzte 3 Gehaltsabrechnungen"
- Berechnet: Kapitaldienstfähigkeit (bereits in ENG-FINANCE), aber als Bankformular-Output
- **Effekt**: Finanzierungsanfrage in 5 Minuten statt 2 Stunden

**7. E-Mail → Rechnung Auto-Erkennung**
- In `sot-inbound-receive` → `triggerDocumentExtraction()`:
  - Wenn `doc_type === 'rechnung'` automatisch erkannt → `sot-invoice-parse` aufrufen
  - Kette: E-Mail → PDF-Extraktion → Rechnungserkennung → Auto-Zuordnung → Benachrichtigung
- Auch in `sot-mail-sync` für Gmail-Anhänge: PDF-Attachments scannen
- **Effekt**: Rechnungen per E-Mail werden automatisch verarbeitet

**8. Intelligente Dokumenten-Ablage (Auto-Filing)**
- In `sot-document-parser`: Nach Parsing automatisch DMS-Pfad bestimmen
  - Kaufvertrag → `{Property}/02_Grundbuch/`
  - Mietvertrag → `{Property}/03_Mietvertraege/`
  - NK-Beleg → `{Property}/04_Nebenkostenabrechnung/{Jahr}/`
  - Versicherung → `{Property}/05_Versicherung/`
- Erstellt automatisch `storage_node` + `document_link` am richtigen Ort
- User bekommt nur noch: "Dokument erkannt als Mietvertrag → abgelegt bei Objekt München, Wohnung 3"
- **Effekt**: Zero-Touch Ablage

**9. NK-Abrechnungs-Vorschau mit KI-Textgenerierung**
- `engines/nkAbrechnung/pdfExport.ts` erweitern:
  - KI generiert Anschreiben für Mieter basierend auf Matrix-Ergebnis
  - Personalisiert: "Sehr geehrte Frau Müller, für den Zeitraum... ergibt sich ein Guthaben von..."
  - Rechtssichere Formulierungen (Widerspruchsfrist, Belegeinsicht)
- Neue Edge Function: `sot-nk-letter-generate`
- **Effekt**: Komplette NK-Abrechnung inkl. Anschreiben in einem Klick

**10. Vermieter-Steuer Jahresabschluss-Assistent**
- In `VVAnlageVForm.tsx`: "KI-Jahresabschluss" Button
  - KI prüft ALLE Objekte eines Vermieter-Kontexts auf einmal
  - Erkennt systemübergreifende Optimierungen (Verlustverrechnung zwischen Objekten)
  - Generiert Zusammenfassung für Steuerberater als PDF
  - Warnt bei §15b EStG Risiken (Verlustverrechnungsbeschränkung)
- **Effekt**: Steuerberater-Übergabe wird zum One-Click

**11. Posteingang: KI-Sortierung + Priority-Scoring**
- In `sot-inbound-receive`: Nach Extraktion → KI-Klassifizierung
  - `priority: 'urgent'` → Fristen (Grundsteuerbescheid, Mahnung, Kündigungen)
  - `priority: 'normal'` → Abrechnungen, Policen
  - `priority: 'low'` → Werbung, Info-Post
- Armstrong benachrichtigt bei `urgent`: "Fristgebundenes Dokument erkannt: Grundsteuerbescheid — Einspruchsfrist endet am..."
- **Effekt**: Wichtige Post wird sofort sichtbar

**12. Finanzierungsmanager: KI-Bankpartner-Matching**
- Neue Edge Function: `sot-finance-bank-match`
- Input: Objektdaten + Kundenprofil + Finanzierungsstruktur
- KI schlägt passende Bankpartner vor basierend auf:
  - Objektart (Kapitalanlage vs. Eigennutzung)
  - Eigenkapitalquote
  - Beleihungsauslauf
  - Regionale Banken vs. überregionale Anbieter
- Output: Top-5 Bankempfehlungen mit Begründung
- **Effekt**: Finanzierungsberater spart Research-Zeit

---

### Betroffene Dateien

| Datei | Aktion | Priorität |
|-------|--------|-----------|
| `supabase/functions/sot-weg-abrechnung-parse/index.ts` | NEU | P0 |
| `supabase/functions/sot-invoice-parse/index.ts` | NEU | P0 |
| `supabase/functions/sot-vv-prefill-check/index.ts` | ERWEITERN → Advisor | P1 |
| `supabase/functions/sot-nk-beleg-parse/index.ts` | Cross-Validation hinzufügen | P1 |
| `supabase/functions/sot-storage-extractor/index.ts` | Strukturierte Extraktion | P1 |
| `supabase/functions/sot-finance-prepare/index.ts` | NEU | P0 |
| `supabase/functions/sot-inbound-receive/index.ts` | Auto-Invoice + Priority | P1 |
| `supabase/functions/sot-nk-letter-generate/index.ts` | NEU | P2 |
| `supabase/functions/sot-finance-bank-match/index.ts` | NEU | P2 |
| `src/engines/nkAbrechnung/engine.ts` | WEG-Parse Integration | P0 |
| `src/components/vv/VVAnlageVForm.tsx` | Jahresabschluss-Button | P1 |
| DB Migration | `invoice_extractions`, `document_structured_data` | P0 |

### Empfohlene Reihenfolge

**Runde 1 (P0 — Kern-Intelligenz):**
1. WEG-Abrechnungs-Parser (`sot-weg-abrechnung-parse`)
2. Rechnungs-KI (`sot-invoice-parse`) + DB-Tabelle
3. Finanzierungs-Aufbereitung (`sot-finance-prepare`)

**Runde 2 (P1 — Cross-Validation & Tiefe):**
4. NK-Kreuzvalidierung
5. Steuerberater-KI Erweiterung
6. Datenraum-Intelligenz Upgrade
7. E-Mail → Rechnung Auto-Chain
8. Posteingang Priority-Scoring

**Runde 3 (P2 — Komfort):**
9. NK-Anschreiben Generator
10. Jahresabschluss-Assistent
11. Bank-Matching KI
12. Auto-Filing

