import DeskContactBook from '@/components/admin/desks/DeskContactBook';
import { Building2, Landmark, Briefcase } from 'lucide-react';

const PRESETS = [
  { label: 'Immobilienmakler', intent: 'Immobilienmakler', icon: Building2, category_code: 'real_estate_agent' },
  { label: 'Hausverwaltung', intent: 'Hausverwaltung Immobilienverwaltung', icon: Landmark, category_code: 'property_management' },
  { label: 'Bauträger', intent: 'Bauträger Projektentwickler', icon: Briefcase, category_code: 'real_estate_company' },
];

export default function SalesDeskKontakte() {
  return <DeskContactBook desk="sales" title="Sales Kontakte" searchPresets={PRESETS} />;
}
