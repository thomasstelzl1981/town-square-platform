/**
 * immoAkteBlocks — Block definitions A-J for Immobilienakte Mastervorlage
 * Pure data, no UI components
 */

export interface FieldDefinition {
  fieldKey: string;
  labelDe: string;
  entity: 'property' | 'unit' | 'lease' | 'loan' | 'nk_period' | 'accounting' | 'document' | 'derived';
  type: 'string' | 'number' | 'decimal' | 'boolean' | 'date' | 'enum' | 'object' | 'string[]' | 'derived';
  notes?: string;
}

export interface BlockDefinition {
  id: string;
  title: string;
  description: string;
  fields: FieldDefinition[];
}

const blockA: BlockDefinition = {
  id: 'A', title: 'Identität / Zuordnung', description: 'Stammdaten zur Objektidentifikation und Steuerungsflags',
  fields: [
    { fieldKey: 'propertyId', labelDe: 'Objekt-ID', entity: 'property', type: 'string' },
    { fieldKey: 'unitId', labelDe: 'Einheit-ID', entity: 'unit', type: 'string' },
    { fieldKey: 'tenantId', labelDe: 'Mandanten-ID', entity: 'property', type: 'string' },
    { fieldKey: 'publicId', labelDe: 'Öffentliche ID', entity: 'property', type: 'string' },
    { fieldKey: 'unitCode', labelDe: 'Objekt-Code', entity: 'unit', type: 'string' },
    { fieldKey: 'propertyType', labelDe: 'Objektart', entity: 'property', type: 'string' },
    { fieldKey: 'category', labelDe: 'Kategorie', entity: 'property', type: 'enum', notes: 'einzelobjekt | globalobjekt' },
    { fieldKey: 'status', labelDe: 'Status', entity: 'property', type: 'enum', notes: 'aktiv | in_pruefung | archiviert | verkauft' },
    { fieldKey: 'saleEnabled', labelDe: 'Verkauf aktiviert', entity: 'property', type: 'boolean' },
    { fieldKey: 'rentalManaged', labelDe: 'Vermietung verwaltet', entity: 'property', type: 'boolean' },
    { fieldKey: 'vermieterKontextId', labelDe: 'Vermieter-Kontext', entity: 'property', type: 'string' },
    { fieldKey: 'reportingRegime', labelDe: 'Reporting-Schema', entity: 'property', type: 'enum', notes: 'VuV | SuSa_BWA' },
  ],
};

const blockB: BlockDefinition = {
  id: 'B', title: 'Adresse', description: 'Standortdaten und Geokoordinaten',
  fields: [
    { fieldKey: 'street', labelDe: 'Straße', entity: 'property', type: 'string' },
    { fieldKey: 'houseNumber', labelDe: 'Hausnummer', entity: 'property', type: 'string' },
    { fieldKey: 'postalCode', labelDe: 'PLZ', entity: 'property', type: 'string' },
    { fieldKey: 'city', labelDe: 'Ort', entity: 'property', type: 'string' },
    { fieldKey: 'locationLabel', labelDe: 'Lage-Label', entity: 'property', type: 'string' },
    { fieldKey: 'locationNotes', labelDe: 'Lage-Notizen', entity: 'property', type: 'string' },
    { fieldKey: 'latitude', labelDe: 'Breitengrad', entity: 'property', type: 'decimal' },
    { fieldKey: 'longitude', labelDe: 'Längengrad', entity: 'property', type: 'decimal' },
  ],
};

const blockC: BlockDefinition = {
  id: 'C', title: 'Gebäude / Technik', description: 'Bauliche Daten, Flächen und Energieinformationen',
  fields: [
    { fieldKey: 'buildYear', labelDe: 'Baujahr', entity: 'property', type: 'number' },
    { fieldKey: 'usageType', labelDe: 'Nutzungsart', entity: 'property', type: 'enum', notes: 'wohnen | gewerbe | mischnutzung' },
    { fieldKey: 'areaLivingSqm', labelDe: 'Wohnfläche (qm)', entity: 'unit', type: 'decimal' },
    { fieldKey: 'areaUsableSqm', labelDe: 'Nutzfläche (qm)', entity: 'unit', type: 'decimal' },
    { fieldKey: 'roomsCount', labelDe: 'Zimmeranzahl', entity: 'unit', type: 'number' },
    { fieldKey: 'bathroomsCount', labelDe: 'Bäder', entity: 'unit', type: 'number' },
    { fieldKey: 'floor', labelDe: 'Etage', entity: 'unit', type: 'number' },
    { fieldKey: 'unitNumber', labelDe: 'Einheitennummer', entity: 'unit', type: 'string' },
    { fieldKey: 'heatingType', labelDe: 'Heizart', entity: 'unit', type: 'enum', notes: 'zentralheizung | etagenheizung | fernwaerme | waermepumpe | sonstige' },
    { fieldKey: 'energySource', labelDe: 'Energieträger', entity: 'unit', type: 'enum', notes: 'gas | oel | strom | pellets | solar | fernwaerme | sonstige' },
    { fieldKey: 'energyCertType', labelDe: 'Energieausweis-Typ', entity: 'unit', type: 'string' },
    { fieldKey: 'energyCertValue', labelDe: 'Energiekennwert', entity: 'unit', type: 'decimal' },
    { fieldKey: 'energyCertValidUntil', labelDe: 'Energieausweis gültig bis', entity: 'unit', type: 'date' },
    { fieldKey: 'featuresTags', labelDe: 'Ausstattungsmerkmale', entity: 'unit', type: 'string[]' },
  ],
};

const blockD: BlockDefinition = {
  id: 'D', title: 'Recht / Erwerb', description: 'Grundbuchdaten und Erwerbsinformationen',
  fields: [
    { fieldKey: 'landRegisterCourt', labelDe: 'Amtsgericht', entity: 'property', type: 'string' },
    { fieldKey: 'landRegisterOf', labelDe: 'Grundbuch von', entity: 'property', type: 'string' },
    { fieldKey: 'landRegisterSheet', labelDe: 'Blatt', entity: 'property', type: 'string' },
    { fieldKey: 'landRegisterVolume', labelDe: 'Band', entity: 'property', type: 'string' },
    { fieldKey: 'parcelNumber', labelDe: 'Flurstück', entity: 'property', type: 'string' },
    { fieldKey: 'teNumber', labelDe: 'TE-Nr. (Teileigentum)', entity: 'property', type: 'string' },
    { fieldKey: 'purchaseDate', labelDe: 'Kaufdatum', entity: 'property', type: 'date' },
    { fieldKey: 'purchasePrice', labelDe: 'Kaufpreis (EUR)', entity: 'property', type: 'decimal' },
    { fieldKey: 'marketValue', labelDe: 'Verkehrswert (EUR)', entity: 'property', type: 'decimal' },
    { fieldKey: 'acquisitionCosts', labelDe: 'Erwerbsnebenkosten (EUR)', entity: 'property', type: 'decimal' },
    { fieldKey: 'wegFlag', labelDe: 'WEG-Objekt', entity: 'property', type: 'boolean' },
  ],
};

const blockE: BlockDefinition = {
  id: 'E', title: 'Investment / KPIs', description: 'Berechnete Kennzahlen (Read-Only)',
  fields: [
    { fieldKey: 'annualIncome', labelDe: 'Jahreseinnahmen (EUR)', entity: 'derived', type: 'derived', notes: 'Berechnet aus Mieteinnahmen' },
    { fieldKey: 'grossYieldPercent', labelDe: 'Brutto-Rendite (%)', entity: 'derived', type: 'derived', notes: 'annualIncome / purchasePrice × 100' },
    { fieldKey: 'netYieldPercent', labelDe: 'Netto-Rendite (%)', entity: 'derived', type: 'derived', notes: 'Nach Abzug nicht-umlegbarer Kosten' },
    { fieldKey: 'cashflowMonthly', labelDe: 'Cashflow/Monat (EUR)', entity: 'derived', type: 'derived', notes: 'Einnahmen - Ausgaben - Rate' },
    { fieldKey: 'vacancyDays', labelDe: 'Leerstandstage', entity: 'unit', type: 'number' },
  ],
};

const blockF: BlockDefinition = {
  id: 'F', title: 'Mietverhältnisse', description: 'Mietvertrags- und Mieteinnahmedaten',
  fields: [
    { fieldKey: 'leaseId', labelDe: 'Mietvertrags-ID', entity: 'lease', type: 'string' },
    { fieldKey: 'tenantContactId', labelDe: 'Mieter-Kontakt-ID', entity: 'lease', type: 'string' },
    { fieldKey: 'tenantName', labelDe: 'Mietername', entity: 'lease', type: 'string' },
    { fieldKey: 'tenancyStatus', labelDe: 'Status', entity: 'lease', type: 'enum', notes: 'ACTIVE | VACANT | TERMINATING | ENDED' },
    { fieldKey: 'leaseType', labelDe: 'Vertragstyp', entity: 'lease', type: 'enum', notes: 'unbefristet | befristet | staffel | index | gewerbe' },
    { fieldKey: 'startDate', labelDe: 'Mietbeginn', entity: 'lease', type: 'date' },
    { fieldKey: 'endDate', labelDe: 'Mietende', entity: 'lease', type: 'date' },
    { fieldKey: 'rentColdEur', labelDe: 'Kaltmiete (EUR)', entity: 'lease', type: 'decimal' },
    { fieldKey: 'nkAdvanceEur', labelDe: 'NK-Vorauszahlung (EUR)', entity: 'lease', type: 'decimal' },
    { fieldKey: 'heatingAdvanceEur', labelDe: 'HK-Vorauszahlung (EUR)', entity: 'lease', type: 'decimal' },
    { fieldKey: 'rentWarmEur', labelDe: 'Warmmiete (EUR)', entity: 'lease', type: 'derived', notes: 'rentColdEur + nkAdvanceEur + heatingAdvanceEur' },
    { fieldKey: 'depositAmountEur', labelDe: 'Kaution (EUR)', entity: 'lease', type: 'decimal' },
    { fieldKey: 'depositStatus', labelDe: 'Kautionsstatus', entity: 'lease', type: 'enum', notes: 'PAID | OPEN | PARTIAL' },
    { fieldKey: 'paymentDueDay', labelDe: 'Fälligkeitstag', entity: 'lease', type: 'number' },
    { fieldKey: 'rentModel', labelDe: 'Mietmodell', entity: 'lease', type: 'enum', notes: 'FIX | INDEX | STAFFEL' },
    { fieldKey: 'nextRentAdjustmentDate', labelDe: 'Nächste Mietanpassung', entity: 'lease', type: 'date' },
  ],
};

const blockG: BlockDefinition = {
  id: 'G', title: 'WEG / Nebenkosten', description: 'Hausgeld, Miteigentumsanteile und Abrechnungen',
  fields: [
    { fieldKey: 'wegFlag', labelDe: 'WEG-Objekt', entity: 'property', type: 'boolean' },
    { fieldKey: 'meaShare', labelDe: 'MEA-Anteil', entity: 'unit', type: 'decimal' },
    { fieldKey: 'meaTotal', labelDe: 'MEA-Gesamt', entity: 'property', type: 'decimal' },
    { fieldKey: 'hausgeldMonthlyEur', labelDe: 'Hausgeld/Monat (EUR)', entity: 'unit', type: 'decimal' },
    { fieldKey: 'allocationKeyDefault', labelDe: 'Verteilerschlüssel', entity: 'property', type: 'enum', notes: 'SQM | PERSONS | MEA | CONSUMPTION | UNITS' },
    { fieldKey: 'managerContactId', labelDe: 'Verwalter-Kontakt-ID', entity: 'property', type: 'string' },
    { fieldKey: 'managerContactName', labelDe: 'Verwalter-Name', entity: 'property', type: 'string' },
    { fieldKey: 'periodCurrent', labelDe: 'Aktuelle Abrechnungsperiode', entity: 'nk_period', type: 'string' },
    { fieldKey: 'lastSettlementDate', labelDe: 'Letzte Abrechnung', entity: 'nk_period', type: 'date' },
    { fieldKey: 'lastSettlementBalanceEur', labelDe: 'Abrechnungsergebnis (EUR)', entity: 'nk_period', type: 'decimal' },
    { fieldKey: 'allocatablePaEur', labelDe: 'Umlegbar p.a. (EUR)', entity: 'nk_period', type: 'decimal' },
    { fieldKey: 'nonAllocatablePaEur', labelDe: 'Nicht umlegbar p.a. (EUR)', entity: 'nk_period', type: 'decimal' },
    { fieldKey: 'topCostBlocks', labelDe: 'Top-Kostenblöcke', entity: 'nk_period', type: 'object' },
  ],
};

const blockH: BlockDefinition = {
  id: 'H', title: 'Finanzierung', description: 'Darlehenskonditionen und Tilgungsinformationen',
  fields: [
    { fieldKey: 'loanId', labelDe: 'Darlehens-ID', entity: 'loan', type: 'string' },
    { fieldKey: 'bankName', labelDe: 'Bank', entity: 'loan', type: 'string' },
    { fieldKey: 'loanNumber', labelDe: 'Darlehensnummer', entity: 'loan', type: 'string' },
    { fieldKey: 'originalAmountEur', labelDe: 'Ursprungsbetrag (EUR)', entity: 'loan', type: 'decimal' },
    { fieldKey: 'outstandingBalanceEur', labelDe: 'Restschuld (EUR)', entity: 'loan', type: 'decimal' },
    { fieldKey: 'balanceAsofDate', labelDe: 'Stand per', entity: 'loan', type: 'date' },
    { fieldKey: 'interestRatePercent', labelDe: 'Zinssatz (%)', entity: 'loan', type: 'decimal' },
    { fieldKey: 'fixedInterestEndDate', labelDe: 'Zinsbindung bis', entity: 'loan', type: 'date' },
    { fieldKey: 'annuityMonthlyEur', labelDe: 'Annuität/Monat (EUR)', entity: 'loan', type: 'decimal' },
    { fieldKey: 'repaymentRatePercent', labelDe: 'Tilgungssatz (%)', entity: 'loan', type: 'decimal' },
    { fieldKey: 'specialRepaymentRightEur', labelDe: 'Sondertilgungsrecht (EUR/Jahr)', entity: 'loan', type: 'decimal' },
    { fieldKey: 'contactPerson', labelDe: 'Ansprechpartner', entity: 'loan', type: 'object', notes: 'name, phone, email' },
  ],
};

const blockI: BlockDefinition = {
  id: 'I', title: 'Accounting minimal', description: 'AfA- und Buchhaltungsdaten',
  fields: [
    { fieldKey: 'accountingId', labelDe: 'Accounting-ID', entity: 'accounting', type: 'string', notes: 'UI pending' },
    { fieldKey: 'landSharePercent', labelDe: 'Grundstücksanteil (%)', entity: 'accounting', type: 'decimal', notes: 'UI pending' },
    { fieldKey: 'buildingSharePercent', labelDe: 'Gebäudeanteil (%)', entity: 'accounting', type: 'decimal', notes: 'UI pending' },
    { fieldKey: 'bookValueEur', labelDe: 'Buchwert (EUR)', entity: 'accounting', type: 'decimal', notes: 'UI pending' },
    { fieldKey: 'afaRatePercent', labelDe: 'AfA-Satz (%)', entity: 'accounting', type: 'decimal', notes: 'UI pending' },
    { fieldKey: 'afaStartDate', labelDe: 'AfA-Beginn', entity: 'accounting', type: 'date', notes: 'UI pending' },
    { fieldKey: 'afaMethod', labelDe: 'AfA-Methode', entity: 'accounting', type: 'enum', notes: 'linear | degressiv — UI pending' },
    { fieldKey: 'remainingUsefulLifeYears', labelDe: 'Restnutzungsdauer (Jahre)', entity: 'accounting', type: 'number', notes: 'UI pending' },
    { fieldKey: 'modernizationCostsEur', labelDe: 'Modernisierungskosten (EUR)', entity: 'accounting', type: 'decimal', notes: 'UI pending' },
    { fieldKey: 'modernizationYear', labelDe: 'Modernisierungsjahr', entity: 'accounting', type: 'number', notes: 'UI pending' },
    { fieldKey: 'coaVersion', labelDe: 'Kontenrahmen-Version', entity: 'accounting', type: 'string', notes: 'UI pending' },
    { fieldKey: 'accountMappings', labelDe: 'Kontenzuordnung', entity: 'accounting', type: 'object', notes: 'UI pending' },
  ],
};

const blockJ: BlockDefinition = {
  id: 'J', title: 'Dokumente / Datenraum', description: '18 Dokumentkategorien (11 Primär + 7 Erweiterung)',
  fields: [
    { fieldKey: 'DOC_PURCHASE_CONTRACT', labelDe: 'Kaufvertrag', entity: 'document', type: 'object', notes: 'docType + status + path' },
    { fieldKey: 'DOC_LEASE_CONTRACT', labelDe: 'Mietvertrag', entity: 'document', type: 'object', notes: 'docType + status + path' },
    { fieldKey: 'DOC_LAND_REGISTER', labelDe: 'Grundbuchauszug', entity: 'document', type: 'object', notes: 'docType + status + path' },
    { fieldKey: 'DOC_ENERGY_CERT', labelDe: 'Energieausweis', entity: 'document', type: 'object', notes: 'docType + status + path' },
    { fieldKey: 'DOC_FLOORPLAN', labelDe: 'Grundriss', entity: 'document', type: 'object', notes: 'docType + status + path' },
    { fieldKey: 'DOC_DIVISION_DECLARATION', labelDe: 'Teilungserklärung', entity: 'document', type: 'object', notes: 'docType + status + path' },
    { fieldKey: 'DOC_INSURANCE_BUILDING', labelDe: 'Gebäudeversicherung', entity: 'document', type: 'object', notes: 'docType + status + path' },
    { fieldKey: 'DOC_WEG_ANNUAL_STATEMENT', labelDe: 'WEG-Abrechnung', entity: 'document', type: 'object', notes: 'docType + status + path' },
    { fieldKey: 'DOC_WEG_BUDGET_PLAN', labelDe: 'Wirtschaftsplan', entity: 'document', type: 'object', notes: 'docType + status + path' },
    { fieldKey: 'DOC_NK_STATEMENT', labelDe: 'NK-Abrechnung', entity: 'document', type: 'object', notes: 'docType + status + path' },
    { fieldKey: 'DOC_LOAN_BUCKET', labelDe: 'Darlehensunterlagen', entity: 'document', type: 'object', notes: 'docType + status + path' },
    { fieldKey: 'DOC_PROJECT', labelDe: 'Projektdokumentation', entity: 'document', type: 'object', notes: 'docType + status + path' },
    { fieldKey: 'DOC_EXPOSE_BUY', labelDe: 'Exposé Ankauf', entity: 'document', type: 'object', notes: 'docType + status + path' },
    { fieldKey: 'DOC_VALUATION_SHORT', labelDe: 'Kurzgutachten', entity: 'document', type: 'object', notes: 'docType + status + path' },
    { fieldKey: 'DOC_INVOICE', labelDe: 'Rechnungen', entity: 'document', type: 'object', notes: 'docType + status + path' },
    { fieldKey: 'DOC_PHOTOS', labelDe: 'Fotos', entity: 'document', type: 'object', notes: 'docType + status + path' },
    { fieldKey: 'DOC_RENOVATION', labelDe: 'Sanierung', entity: 'document', type: 'object', notes: 'docType + status + path' },
    { fieldKey: 'DOC_PROPERTY_TAX', labelDe: 'Grundsteuer', entity: 'document', type: 'object', notes: 'docType + status + path' },
  ],
};

export const IMMO_AKTE_BLOCKS: BlockDefinition[] = [blockA, blockB, blockC, blockD, blockE, blockF, blockG, blockH, blockI, blockJ];
export const IMMO_AKTE_BLOCK_J = blockJ;
