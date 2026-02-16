/**
 * useVerwaltungData — Zentraler Daten-Hook für MOD-04 Verwaltung (BWA)
 * 
 * Liest Properties (rental_managed), Units, Leases, Contacts,
 * msv_rent_payments, msv_book_values, msv_bwa_entries.
 * Berechnet Zahlstatus-Ampel, säumige Fälle, Mieterhöhungs-Kandidaten.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDemoToggles } from '@/hooks/useDemoToggles';

export interface VerwaltungProperty {
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

export interface VerwaltungUnit {
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

export interface VerwaltungMonthEntry {
  label: string;
  soll: number;
  ist: number;
  datum: string;
  differenz: number;
  status: string;
  notiz: string;
  paymentId: string | null;
}

export interface VerwaltungOverdueCase {
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

export interface VerwaltungRentIncreaseCase {
  id: string;
  unitId: string;
  mieter: string;
  letzteErhoehung: string | null;
  pruefbarSeit: string | null;
  leaseId: string;
}

// Demo constants removed — MFH Düsseldorf was a phantom property with no DB counterpart.
// Real demo properties (BER-01, MUC-01, HH-01) are fetched from the DB with is_demo=true.

export function useVerwaltungData() {
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

  // Build VerwaltungProperty list
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const verwaltungProperties: VerwaltungProperty[] = (data?.properties || [])
    .filter(p => showDemo || !p.is_demo)
    .map(p => {
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

  // No longer injecting phantom demo property — real demo properties come from DB with is_demo=true

  // Build VerwaltungUnit list for a selected property
  function getUnitsForProperty(propertyId: string | null): VerwaltungUnit[] {
    if (!propertyId) return [];
    if (propertyId === '__demo_obj_1__') return [];

    const propUnits = (data?.units || []).filter(u => u.property_id === propertyId);
    const prop = (data?.properties || []).find(p => p.id === propertyId);

    return propUnits.map(u => {
      const lease = (data?.leases || []).find((l: any) => l.unit_id === u.id);
      const contact = lease?.contacts as any;
      const latestPayment = (data?.payments || [])
        .filter(p => p.unit_id === u.id && p.period_month === currentMonth && p.period_year === currentYear)
        .sort((a, b) => (b.received_date || '').localeCompare(a.received_date || ''))[0];

      const warmmiete = lease ? (lease.monthly_rent + (lease.nk_advance_eur || 0) + (lease.heating_advance_eur || 0)) : 0;

      let status: VerwaltungUnit['status'] = 'vacant';
      if (lease) {
        if (latestPayment) {
          status = latestPayment.status as VerwaltungUnit['status'];
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
  function getMonthHistory(unitId: string, warmmiete: number): VerwaltungMonthEntry[] {
    if (unitId.startsWith('__demo_')) {
      return [];
    }

    const months: VerwaltungMonthEntry[] = [];
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
  function getOverdueCases(propertyId: string | null): VerwaltungOverdueCase[] {
    if (!propertyId) return [];
    if (propertyId === '__demo_obj_1__') return [];

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
  function getRentIncreaseCases(propertyId: string | null): VerwaltungRentIncreaseCase[] {
    if (!propertyId) return [];
    if (propertyId === '__demo_obj_1__') return [];

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
    properties: verwaltungProperties,
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
