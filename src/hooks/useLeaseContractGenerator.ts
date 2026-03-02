/**
 * Hook: Lease Contract Generator
 * Generates lease contract templates using the Briefgenerator (MOD-02)
 * Provides standard German rental contract clauses
 */
import { useAuth } from '@/contexts/AuthContext';

export interface LeaseContractData {
  // Parteien
  landlordName: string;
  landlordAddress: string;
  tenantName: string;
  tenantBirthDate?: string;
  // Objekt
  propertyAddress: string;
  unitDescription: string;
  areaSqm: number;
  roomCount: number;
  floor?: string;
  // Konditionen
  rentColdEur: number;
  nkAdvanceEur: number;
  depositEur: number;
  startDate: string;
  endDate?: string; // null = unbefristet
  noticePeriodMonths: number;
  rentModel: 'FIX' | 'INDEX' | 'STAFFEL';
  // Staffel
  staffelSchedule?: Array<{ date: string; rent: number }>;
  // Index
  indexBaseMonth?: string;
}

export interface LeaseContractSection {
  title: string;
  content: string;
}

/**
 * Generate a standard German lease contract from data.
 * Returns sections that can be assembled into a PDF via Briefgenerator.
 */
export function generateLeaseContractSections(data: LeaseContractData): LeaseContractSection[] {
  const totalRent = data.rentColdEur + data.nkAdvanceEur;
  const befristet = data.endDate ? true : false;

  const sections: LeaseContractSection[] = [
    {
      title: '§ 1 Mietgegenstand',
      content: `Der Vermieter vermietet dem Mieter folgende Wohnung:\n\n${data.propertyAddress}\n${data.unitDescription}\nWohnfläche: ca. ${data.areaSqm} m²\nAnzahl Zimmer: ${data.roomCount}${data.floor ? `\nEtage: ${data.floor}` : ''}\n\nZubehör: Keller, anteilige Gemeinschaftsflächen`
    },
    {
      title: '§ 2 Mietzeit',
      content: befristet
        ? `Das Mietverhältnis beginnt am ${formatDate(data.startDate)} und endet am ${formatDate(data.endDate!)}.\n\nEine vorzeitige Kündigung ist mit einer Frist von ${data.noticePeriodMonths} Monaten zum Monatsende möglich.`
        : `Das Mietverhältnis beginnt am ${formatDate(data.startDate)} und wird auf unbestimmte Zeit geschlossen.\n\nDie Kündigungsfrist beträgt ${data.noticePeriodMonths} Monate zum Monatsende (§573c BGB).`
    },
    {
      title: '§ 3 Miete',
      content: `Die monatliche Miete setzt sich wie folgt zusammen:\n\nNettokaltmiete: ${formatEur(data.rentColdEur)}\nNebenkosten-Vorauszahlung: ${formatEur(data.nkAdvanceEur)}\n────────────────────────\nGesamtmiete: ${formatEur(totalRent)}\n\nDie Miete ist jeweils bis zum 3. Werktag des Monats im Voraus auf das Konto des Vermieters zu überweisen.`
    },
  ];

  // Rent model specific section
  if (data.rentModel === 'INDEX') {
    sections.push({
      title: '§ 3a Indexmiete (§557b BGB)',
      content: `Die Parteien vereinbaren eine Indexmiete gemäß §557b BGB.\n\nBasismonat: ${data.indexBaseMonth || 'Monat des Mietbeginns'}\nIndex: Verbraucherpreisindex des Statistischen Bundesamts\n\nEine Anpassung ist frühestens 12 Monate nach der letzten Anpassung möglich.`
    });
  } else if (data.rentModel === 'STAFFEL' && data.staffelSchedule?.length) {
    const staffelText = data.staffelSchedule
      .map(s => `Ab ${formatDate(s.date)}: ${formatEur(s.rent)}`)
      .join('\n');
    sections.push({
      title: '§ 3a Staffelmiete (§557a BGB)',
      content: `Die Parteien vereinbaren folgende Mietstaffelung:\n\n${staffelText}\n\nWährend der Geltung der Staffelmiete ist eine anderweitige Mieterhöhung ausgeschlossen.`
    });
  }

  sections.push(
    {
      title: '§ 4 Kaution',
      content: `Der Mieter leistet eine Mietkaution in Höhe von ${formatEur(data.depositEur)} (${Math.round(data.depositEur / data.rentColdEur * 10) / 10} Nettokaltmieten).\n\nDie Kaution kann in drei gleichen monatlichen Raten gezahlt werden (§551 Abs. 2 BGB). Die erste Rate ist bei Mietbeginn fällig.\n\nDer Vermieter legt die Kaution getrennt von seinem Vermögen bei einem Kreditinstitut zu dem für Spareinlagen üblichen Zinssatz an (§551 Abs. 3 BGB).`
    },
    {
      title: '§ 5 Betriebskosten',
      content: `Der Mieter trägt die umlagefähigen Betriebskosten gemäß §2 BetrKV.\n\nDie Abrechnung erfolgt jährlich. Der Abrechnungszeitraum entspricht dem Kalenderjahr.\n\nDie Abrechnung muss spätestens 12 Monate nach Ende des Abrechnungszeitraums erfolgen (§556 Abs. 3 BGB).`
    },
    {
      title: '§ 6 Schönheitsreparaturen',
      content: `Der Mieter übernimmt die Schönheitsreparaturen im Rahmen der gesetzlichen Regelungen. Starre Fristenpläne werden nicht vereinbart.\n\nBei Auszug ist die Wohnung in einem ordnungsgemäßen Zustand zu übergeben.`
    },
    {
      title: '§ 7 Tierhaltung',
      content: `Kleintiere (Hamster, Fische, etc.) sind ohne Genehmigung erlaubt.\n\nDie Haltung von Hunden und Katzen bedarf der vorherigen schriftlichen Zustimmung des Vermieters. Die Zustimmung kann nur aus wichtigem Grund verweigert werden.`
    },
    {
      title: '§ 8 Untervermietung',
      content: `Eine Untervermietung oder anderweitige Überlassung der Mietsache an Dritte bedarf der vorherigen schriftlichen Zustimmung des Vermieters (§540 BGB).`
    },
    {
      title: '§ 9 Übergabe und Rückgabe',
      content: `Bei Ein- und Auszug wird ein gemeinsames Übergabeprotokoll erstellt. Zählerstände werden dokumentiert.\n\nDie Schlüssel sind bei Auszug vollständig zurückzugeben.`
    },
    {
      title: '§ 10 Schlussbestimmungen',
      content: `Änderungen und Ergänzungen dieses Vertrages bedürfen der Schriftform.\n\nSollte eine Bestimmung dieses Vertrages unwirksam sein, so bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.\n\nEs gilt ausschließlich deutsches Recht.\n\nGerichtsstand ist der Ort der Mietsache.`
    },
  );

  return sections;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatEur(amount: number): string {
  return amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
}

/**
 * Generate full contract text as a single string for Briefgenerator
 */
export function generateLeaseContractText(data: LeaseContractData): string {
  const sections = generateLeaseContractSections(data);
  const header = `MIETVERTRAG\n\nzwischen\n\n${data.landlordName}\n${data.landlordAddress}\n— nachfolgend „Vermieter" —\n\nund\n\n${data.tenantName}${data.tenantBirthDate ? `\ngeb. am ${formatDate(data.tenantBirthDate)}` : ''}\n— nachfolgend „Mieter" —\n\nwird folgender Mietvertrag geschlossen:\n\n`;
  
  const body = sections.map(s => `${s.title}\n\n${s.content}`).join('\n\n');
  
  const footer = `\n\n\n────────────────────────    ────────────────────────\nOrt, Datum                  Ort, Datum\n\n\n────────────────────────    ────────────────────────\n${data.landlordName}         ${data.tenantName}\n(Vermieter)                 (Mieter)`;

  return header + body + footer;
}

export function useLeaseContractGenerator() {
  const { profile } = useAuth();
  
  return {
    generateSections: generateLeaseContractSections,
    generateFullText: generateLeaseContractText,
  };
}
