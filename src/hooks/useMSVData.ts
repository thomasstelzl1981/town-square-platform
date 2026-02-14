/**
 * useMSVData — Zentraler Daten-Hook für MOD-04 Verwaltung (MSV)
 * 
 * Liest Properties (rental_managed), Units, Leases, Contacts,
 * msv_rent_payments, msv_book_values, msv_bwa_entries.
 * Berechnet Zahlstatus-Ampel, säumige Fälle, Mieterhöhungs-Kandidaten.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDemoToggles } from '@/hooks/useDemoToggles';

export interface MSVProperty {
  id: string;
  name: string;
  address: string;
  city: string;
  houseNo: string;
  unitCount: number;
  activeLeaseCount: number;
  zahlstatus: 'paid' | 'partial' | 'overdue';
  isDemo?: boolean;
}

export interface MSVUnit {
  id: string;
  unitId: string;
  ort: string;
  strasse: string;
  hausnummer: string;
  teNr: string;
  anrede: string;
  vorname: string;
  name: string;
  email: string;
  mobil: string;
  warmmiete: number;
  letzterEingangDatum: string;
  letzterEingangBetrag: number;
  status: 'paid' | 'partial' | 'overdue' | 'vacant';
  leaseId: string | null;
  propertyId: string;
  contactId: string | null;
  lastRentIncreaseAt: string | null;
  paymentDueDay: number | null;
}

export interface MSVMonthEntry {
  label: string;
  soll: number;
  ist: number;
  datum: string;
  differenz: number;
  status: string;
  notiz: string;
  paymentId: string | null;
}

export interface MSVOverdueCase {
  id: string;
  unitId: string;
  adresse: string;
  mieter: string;
  offenerBetrag: number;
  ueberfaelligSeit: string;
  letzteZahlung: { datum: string; betrag: number };
  mahnstufe: number;
  notiz: string;
  leaseId: string | null;
  contactId: string | null;
  propertyId: string;
}

export interface MSVRentIncreaseCase {
  id: string;
  unitId: string;
  mieter: string;
  letzteErhoehung: string | null;
  pruefbarSeit: string | null;
  leaseId: string;
}

// Demo constants
const DEMO_PROPERTY: MSVProperty = {
  id: '__demo_obj_1__',
  name: 'MFH Düsseldorf',
  address: 'Königsallee 42',
  city: 'Düsseldorf',
  houseNo: '42',
  unitCount: 6,
  activeLeaseCount: 5,
  zahlstatus: 'partial',
  isDemo: true,
};

const DEMO_UNITS: MSVUnit[] = [
  { id: '__demo_1__', unitId: 'WE-001', ort: 'Düsseldorf', strasse: 'Königsallee', hausnummer: '42', teNr: 'TE-1.OG-L', anrede: 'Herr', vorname: 'Thomas', name: 'Müller', email: 't.mueller@email.de', mobil: '0171 1234567', warmmiete: 1250, letzterEingangDatum: '2026-02-03', letzterEingangBetrag: 1250, status: 'paid', leaseId: null, propertyId: '__demo_obj_1__', contactId: null, lastRentIncreaseAt: '2023-01-01', paymentDueDay: 3 },
  { id: '__demo_2__', unitId: 'WE-002', ort: 'Düsseldorf', strasse: 'Königsallee', hausnummer: '42', teNr: 'TE-2.OG-R', anrede: 'Frau', vorname: 'Anna', name: 'Schmidt', email: 'a.schmidt@email.de', mobil: '0172 9876543', warmmiete: 980, letzterEingangDatum: '2026-02-05', letzterEingangBetrag: 500, status: 'partial', leaseId: null, propertyId: '__demo_obj_1__', contactId: null, lastRentIncreaseAt: null, paymentDueDay: 3 },
  { id: '__demo_3__', unitId: 'WE-003', ort: 'Düsseldorf', strasse: 'Königsallee', hausnummer: '42', teNr: 'TE-EG-L', anrede: '', vorname: '', name: '', email: '', mobil: '', warmmiete: 0, letzterEingangDatum: '', letzterEingangBetrag: 0, status: 'vacant', leaseId: null, propertyId: '__demo_obj_1__', contactId: null, lastRentIncreaseAt: null, paymentDueDay: null },
];

const DEMO_OVERDUE: MSVOverdueCase[] = [
  { id: '__demo_overdue_1__', unitId: 'WE-002', adresse: 'Königsallee 42, Düsseldorf', mieter: 'Anna Schmidt', offenerBetrag: 480, ueberfaelligSeit: '2026-02-07', letzteZahlung: { datum: '2026-02-05', betrag: 500 }, mahnstufe: 0, notiz: '', leaseId: null, contactId: null, propertyId: '__demo_obj_1__' },
];

const DEMO_RENT_INCREASE: MSVRentIncreaseCase[] = [
  { id: '__demo_ri_1__', unitId: 'WE-001', mieter: 'Thomas Müller', letzteErhoehung: '2023-01-01', pruefbarSeit: '2026-01-01', leaseId: '' },
  { id: '__demo_ri_2__', unitId: 'WE-004', mieter: 'Datum fehlt', letzteErhoehung: null, pruefbarSeit: null, leaseId: '' },
];

export function useMSVData() {
  const { activeTenantId } = useAuth();
  const { isEnabled } = useDemoToggles();
  const showDemo = isEnabled('GP-VERWALTUNG');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['msv-data', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return null;

      // Fetch rental managed properties
      const { data: properties } = await supabase
        .from('properties')
        .select('id, address, city, address_house_no, code, is_demo, rental_managed')
        .eq('tenant_id', activeTenantId)
        .eq('rental_managed', true);

      // Fetch units for those properties
      const propertyIds = properties?.map(p => p.id) || [];
      if (propertyIds.length === 0) return { properties: [], units: [], payments: [], bookValues: [], bwaEntries: [] };

      const [unitsRes, leasesRes, paymentsRes, bookValuesRes, bwaRes] = await Promise.all([
        supabase.from('units').select('*').eq('tenant_id', activeTenantId).in('property_id', propertyIds),
        supabase.from('leases').select('*, contacts:tenant_contact_id(id, first_name, last_name, email, phone, salutation)').eq('tenant_id', activeTenantId).eq('status', 'active'),
        supabase.from('msv_rent_payments').select('*').eq('tenant_id', activeTenantId).in('property_id', propertyIds),
        supabase.from('msv_book_values').select('*').eq('tenant_id', activeTenantId).in('property_id', propertyIds),
        supabase.from('msv_bwa_entries').select('*').eq('tenant_id', activeTenantId).in('property_id', propertyIds),
      ]);

      return {
        properties: properties || [],
        units: unitsRes.data || [],
        leases: leasesRes.data || [],
        payments: paymentsRes.data || [],
        bookValues: bookValuesRes.data || [],
        bwaEntries: bwaRes.data || [],
      };
    },
    enabled: !!activeTenantId,
  });

  // Build MSVProperty list
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const msvProperties: MSVProperty[] = (data?.properties || []).map(p => {
    const propUnits = (data?.units || []).filter(u => u.property_id === p.id);
    const propLeases = (data?.leases || []).filter((l: any) => propUnits.some(u => u.id === l.unit_id));
    const propPayments = (data?.payments || []).filter(pay => pay.property_id === p.id && pay.period_month === currentMonth && pay.period_year === currentYear);

    let zahlstatus: 'paid' | 'partial' | 'overdue' = 'paid';
    if (propPayments.some(pay => pay.status === 'overdue' || pay.status === 'open')) zahlstatus = 'overdue';
    else if (propPayments.some(pay => pay.status === 'partial')) zahlstatus = 'partial';

    return {
      id: p.id,
      name: p.code || p.address,
      address: p.address,
      city: p.city,
      houseNo: p.address_house_no || '',
      unitCount: propUnits.length,
      activeLeaseCount: propLeases.length,
      zahlstatus,
      isDemo: p.is_demo,
    };
  });

  // Add demo property if toggle active
  if (showDemo) {
    msvProperties.unshift(DEMO_PROPERTY);
  }

  // Build MSVUnit list for a selected property
  function getUnitsForProperty(propertyId: string | null): MSVUnit[] {
    if (!propertyId) return [];
    if (propertyId === '__demo_obj_1__') return DEMO_UNITS;

    const propUnits = (data?.units || []).filter(u => u.property_id === propertyId);
    const prop = (data?.properties || []).find(p => p.id === propertyId);

    return propUnits.map(u => {
      const lease = (data?.leases || []).find((l: any) => l.unit_id === u.id);
      const contact = lease?.contacts as any;
      const latestPayment = (data?.payments || [])
        .filter(p => p.unit_id === u.id && p.period_month === currentMonth && p.period_year === currentYear)
        .sort((a, b) => (b.received_date || '').localeCompare(a.received_date || ''))[0];

      const warmmiete = lease ? (lease.monthly_rent + (lease.nk_advance_eur || 0) + (lease.heating_advance_eur || 0)) : 0;

      let status: MSVUnit['status'] = 'vacant';
      if (lease) {
        if (latestPayment) {
          status = latestPayment.status as MSVUnit['status'];
        } else {
          status = 'overdue';
        }
      }

      return {
        id: u.id,
        unitId: u.unit_number || u.code || u.public_id,
        ort: prop?.city || '',
        strasse: prop?.address || '',
        hausnummer: prop?.address_house_no || '',
        teNr: u.code || u.unit_number || '',
        anrede: contact?.salutation || '',
        vorname: contact?.first_name || '',
        name: contact?.last_name || '',
        email: contact?.email || '',
        mobil: contact?.phone || '',
        warmmiete,
        letzterEingangDatum: latestPayment?.received_date || '',
        letzterEingangBetrag: latestPayment?.received_amount || 0,
        status,
        leaseId: lease?.id || null,
        propertyId,
        contactId: contact?.id || null,
        lastRentIncreaseAt: lease?.last_rent_increase_at || null,
        paymentDueDay: lease?.payment_due_day || null,
      };
    });
  }

  // Build month history for a unit
  function getMonthHistory(unitId: string, warmmiete: number): MSVMonthEntry[] {
    if (unitId.startsWith('__demo_')) {
      return generateDemoMonthHistory(warmmiete, DEMO_UNITS.find(u => u.id === unitId)?.status || 'vacant');
    }

    const months: MSVMonthEntry[] = [];
    const startYear = currentYear - 1;

    for (let y = startYear; y <= currentYear; y++) {
      const maxMonth = y === currentYear ? currentMonth : 12;
      for (let m = 1; m <= maxMonth; m++) {
        const payment = (data?.payments || []).find(p => p.unit_id === unitId && p.period_month === m && p.period_year === y);
        const soll = warmmiete;
        const ist = payment?.received_amount || 0;

        months.push({
          label: `${y}-${String(m).padStart(2, '0')}`,
          soll,
          ist,
          datum: payment?.received_date || '',
          differenz: soll - ist,
          status: payment?.status || (soll > 0 ? 'open' : 'vacant'),
          notiz: payment?.note || '',
          paymentId: payment?.id || null,
        });
      }
    }
    return months;
  }

  // Get overdue cases for a property
  function getOverdueCases(propertyId: string | null): MSVOverdueCase[] {
    if (!propertyId) return [];
    if (propertyId === '__demo_obj_1__') return DEMO_OVERDUE;

    const units = getUnitsForProperty(propertyId);
    return units
      .filter(u => u.status === 'overdue' || u.status === 'partial')
      .map(u => {
        const payment = (data?.payments || []).find(p => p.unit_id === u.id && p.period_month === currentMonth && p.period_year === currentYear);
        return {
          id: u.id,
          unitId: u.unitId,
          adresse: `${u.strasse} ${u.hausnummer}, ${u.ort}`,
          mieter: `${u.vorname} ${u.name}`.trim() || 'Unbekannt',
          offenerBetrag: u.warmmiete - (payment?.received_amount || 0),
          ueberfaelligSeit: '', // calculated from due day
          letzteZahlung: { datum: u.letzterEingangDatum, betrag: u.letzterEingangBetrag },
          mahnstufe: payment?.dunning_stage || 0,
          notiz: payment?.dunning_notes || '',
          leaseId: u.leaseId,
          contactId: u.contactId,
          propertyId,
        };
      });
  }

  // Get rent increase candidates
  function getRentIncreaseCases(propertyId: string | null): MSVRentIncreaseCase[] {
    if (!propertyId) return [];
    if (propertyId === '__demo_obj_1__') return DEMO_RENT_INCREASE;

    const units = getUnitsForProperty(propertyId);
    const threeYearsAgo = new Date();
    threeYearsAgo.setMonth(threeYearsAgo.getMonth() - 36);

    return units
      .filter(u => u.leaseId && (
        !u.lastRentIncreaseAt ||
        new Date(u.lastRentIncreaseAt) <= threeYearsAgo
      ))
      .map(u => {
        const lastInc = u.lastRentIncreaseAt ? new Date(u.lastRentIncreaseAt) : null;
        const pruefbar = lastInc ? new Date(lastInc) : null;
        if (pruefbar) pruefbar.setMonth(pruefbar.getMonth() + 36);

        return {
          id: u.id,
          unitId: u.unitId,
          mieter: `${u.vorname} ${u.name}`.trim() || 'Datum fehlt',
          letzteErhoehung: u.lastRentIncreaseAt,
          pruefbarSeit: pruefbar?.toISOString().split('T')[0] || null,
          leaseId: u.leaseId || '',
        };
      });
  }

  return {
    properties: msvProperties,
    isLoading,
    refetch,
    getUnitsForProperty,
    getMonthHistory,
    getOverdueCases,
    getRentIncreaseCases,
    bookValues: data?.bookValues || [],
    bwaEntries: data?.bwaEntries || [],
    showDemo,
  };
}

function generateDemoMonthHistory(warmmiete: number, status: string): MSVMonthEntry[] {
  const months: MSVMonthEntry[] = [];
  const now = new Date();
  const startYear = now.getFullYear() - 1;

  for (let y = startYear; y <= now.getFullYear(); y++) {
    const maxMonth = y === now.getFullYear() ? now.getMonth() + 1 : 12;
    for (let m = 1; m <= maxMonth; m++) {
      const isCurrentMonth = y === now.getFullYear() && m === now.getMonth() + 1;
      const soll = warmmiete;
      let ist = soll;
      let mStatus = 'paid';

      if (isCurrentMonth && status === 'partial') { ist = Math.round(soll * 0.5); mStatus = 'partial'; }
      else if (isCurrentMonth && status === 'overdue') { ist = 0; mStatus = 'overdue'; }
      else if (status === 'vacant') { ist = 0; mStatus = 'vacant'; }

      months.push({
        label: `${y}-${String(m).padStart(2, '0')}`,
        soll, ist,
        datum: ist > 0 ? `${y}-${String(m).padStart(2, '0')}-03` : '',
        differenz: soll - ist,
        status: mStatus,
        notiz: '',
        paymentId: null,
      });
    }
  }
  return months;
}
