import DeskContactBook from '@/components/admin/desks/DeskContactBook';
import { Landmark, Briefcase, Building2, Shield } from 'lucide-react';

const PRESETS = [
  { label: 'Finanzvertrieb', intent: 'Finanzvertrieb Finanzberatung', icon: Briefcase },
  { label: 'Finanzdienstleister', intent: 'Finanzdienstleister Finanzagentur', icon: Landmark },
  { label: 'Versicherungsmakler', intent: 'Versicherungsmakler Versicherungsagentur', icon: Shield },
  { label: 'Bankberater', intent: 'Bankberater Bankfiliale Beratung', icon: Building2 },
];

export default function FinanceDeskKontakte() {
  return <DeskContactBook desk="finance" title="Finance Kontakte" searchPresets={PRESETS} />;
}
