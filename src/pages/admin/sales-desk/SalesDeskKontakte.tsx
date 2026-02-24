import DeskContactBook from '@/components/admin/desks/DeskContactBook';
import { Building2, Landmark, Briefcase } from 'lucide-react';

const PRESETS = [
  { label: 'Immobilienmakler', intent: 'Immobilienmakler', icon: Building2 },
  { label: 'Hausverwaltung', intent: 'Hausverwaltung Immobilienverwaltung', icon: Landmark },
  { label: 'Bauträger', intent: 'Bauträger Projektentwickler', icon: Briefcase },
];

export default function SalesDeskKontakte() {
  return <DeskContactBook desk="sales" title="Sales Kontakte" searchPresets={PRESETS} />;
}
