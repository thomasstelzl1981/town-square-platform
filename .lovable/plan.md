
# Drei-Phasen-Plan: Umsatz-CSV-Import + Demodaten

## Uebersicht

Der CSV-Import gehoert NICHT zum Konto-Anlegen, sondern zu einem bereits angelegten Konto. Man oeffnet das Konto (KontoAkteInline), und dort kann man Umsaetze per CSV importieren — wiederholbar und idempotent.

---

## Phase 1: CSV-Import fuer Umsaetze am angelegten Konto

### Was aendert sich?

Die `KontoAkteInline`-Komponente (Konto-Detailansicht) bekommt in der Sektion "Kontobewegungen" einen Import-Button.

### Aenderungen

**`src/components/finanzanalyse/KontoAkteInline.tsx`**

- Neuer Button "Umsaetze importieren" (Upload-Icon) in der Sektion "Kontobewegungen"
- Klick oeffnet einen Import-Dialog (`TransactionCsvImportDialog`)
- Nach erfolgreichem Import werden die Transaktionen aus der DB neu geladen
- Die Transaktions-Tabelle zeigt dann sowohl Demo- als auch echte DB-Transaktionen an (je nach `isDemo`)

**`src/components/finanzanalyse/TransactionCsvImportDialog.tsx`** (NEU)

- Dialog mit FileUploader fuer `.csv` und `.xlsx`
- Erwartete Spalten: `Datum`, `Valuta`, `Buchungsart`, `Gegenpartei`, `IBAN`, `Verwendungszweck`, `Betrag`, `Saldo`
- Spalten-Mapping per Header (flexibel, wie im bestehenden AddBankAccountDialog)
- Nach Upload: Vorschau-Tabelle mit allen erkannten Zeilen
- **Duplikat-Erkennung**: Vor dem Insert wird geprueft ob eine Transaktion mit gleichem `account_ref + booking_date + amount_eur + purpose_text` bereits existiert. Duplikate werden in der Vorschau gelb markiert und vom Import ausgeschlossen
- Import-Button: Batch-Insert in die bestehende `bank_transactions`-Tabelle
- Mapping auf DB-Spalten:
  - `Datum` -> `booking_date`
  - `Valuta` -> `value_date`
  - `Betrag` -> `amount_eur`
  - `Gegenpartei` -> `counterparty`
  - `Verwendungszweck` -> `purpose_text`
  - `account_ref` = Konto-ID oder IBAN des Kontos

**DB: `bank_transactions`** — bereits vorhanden, keine Migration noetig. Felder passen:
- `id`, `tenant_id`, `account_ref`, `booking_date`, `value_date`, `amount_eur`, `counterparty`, `purpose_text`, `match_status`

**Duplikat-Pruefung (idempotent)**:
- Vor dem Insert: Alle bestehenden Transaktionen fuer das Konto laden (per `account_ref`)
- Composite Key: `booking_date + amount_eur + purpose_text` (normalisiert)
- Bereits vorhandene werden in der Vorschau als "bereits vorhanden" markiert und uebersprungen

### Rueckbau AddBankAccountDialog

Der CSV-Tab im `AddBankAccountDialog` wird entfernt, da CSV-Import dort nicht hingehoert. Der Dialog wird wieder zum reinen Einzelkonto-Formular.

---

## Phase 2: Demo-Transaktionsdaten als CSV erzeugen

### Was aendert sich?

Die ~97 Demo-Buchungen aus `buildDemoTransactions()` werden als CSV-Datei im Projekt abgelegt, damit sie als echte Testdaten fuer den Import dienen.

### Aenderungen

**`public/demo-data/demo_bank_transactions.csv`** (NEU)

Generiert aus der bestehenden `buildDemoTransactions()`-Logik. Format:

```
Datum;Valuta;Buchungsart;Gegenpartei;IBAN;Verwendungszweck;Betrag;Saldo
2025-01-01;2025-01-02;Gutschrift;Bergmann, Klaus;DE12500105170648489890;Miete WE-01 BER-01 01/2025;1150.00;6350.00
2025-01-01;2025-01-02;Gutschrift;Yilmaz, Ayse;DE27100777770209299700;Miete WE-01 MUC-01 01/2025;1580.00;7930.00
...
```

- Semikolon-getrennt (deutsches Standard-Format)
- Alle ~97 Zeilen aus dem Generator
- Die Datei wird manuell erzeugt (einmalig die Daten aus `buildDemoTransactions()` serialisiert)

**`public/demo-data/demo_bank_accounts.csv`** (NEU)

```
Kontobezeichnung;IBAN;Bank;BIC;Kontoinhaber;Zuordnung
Girokonto Sparkasse;DE89370400440532013000;Sparkasse;COBADEFFXXX;Max Mustermann;Vermietereinheit
```

---

## Phase 3: Demo-CSV in angelegtes Demo-Konto importieren + testen

### Was aendert sich?

In der `KontoAkteInline` wird fuer Demo-Konten ein zusaetzlicher Button "Demo-Umsaetze laden" angeboten, der die CSV aus `public/demo-data/` automatisch holt und ueber den gleichen Import-Pfad einfuegt.

### Aenderungen

**`src/components/finanzanalyse/KontoAkteInline.tsx`**

- Fuer echte Konten: Transaktionen werden per DB-Query aus `bank_transactions` geladen (statt leeres Array)
- Fuer Demo-Konten: Bleibt clientseitig (`DEMO_TRANSACTIONS`), PLUS optionaler Button "Demo-CSV importieren" der die CSV-Datei fetcht und den gleichen Import-Dialog fuellt
- Damit kann man testen: Demo-Konto anlegen -> CSV importieren -> Duplikate pruefen -> nochmal importieren (0 neue Zeilen)

### Test-Szenario

1. Konto manuell anlegen (IBAN: DE89370400440532013000)
2. Konto oeffnen -> "Umsaetze importieren"
3. `demo_bank_transactions.csv` hochladen
4. Vorschau zeigt ~97 Zeilen, alle gruen
5. Importieren -> 97 Zeilen in DB
6. Nochmal importieren -> 0 neue Zeilen (alle als Duplikat markiert)

---

## Betroffene Dateien (alle Phasen)

| Datei | Phase | Aenderung |
|-------|-------|-----------|
| `src/components/finanzanalyse/TransactionCsvImportDialog.tsx` | 1 | NEU: Import-Dialog fuer Umsaetze |
| `src/components/finanzanalyse/KontoAkteInline.tsx` | 1+3 | Import-Button + DB-Query fuer Transaktionen |
| `src/components/shared/AddBankAccountDialog.tsx` | 1 | CSV-Tab entfernen, wieder nur Einzelformular |
| `public/demo-data/demo_bank_transactions.csv` | 2 | NEU: ~97 Demo-Buchungen |
| `public/demo-data/demo_bank_accounts.csv` | 2 | NEU: Demo-Kontostammdaten |
