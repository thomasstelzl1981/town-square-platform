import DeskContactBook from '@/components/admin/desks/DeskContactBook';
import { Shield, Users } from 'lucide-react';

const PRESETS = [
  { label: 'Versicherungskaufleute', intent: 'Versicherungskaufleute Versicherungsagentur', icon: Shield },
  { label: 'Mehrfachagenten', intent: 'Mehrfachagent Versicherungsmakler unabhängig', icon: Users },
];

export default function LeadDeskKontakte() {
  return <DeskContactBook desk="insurance" title="Insurance Kontakte" searchPresets={PRESETS} />;
}
