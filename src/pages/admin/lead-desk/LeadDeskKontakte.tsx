import DeskContactBook from '@/components/admin/desks/DeskContactBook';
import { Shield, Users } from 'lucide-react';

const PRESETS = [
  { label: 'Versicherungskaufleute', intent: 'Versicherungskaufleute Versicherungsagentur', icon: Shield, category_code: 'insurance_broker_34d' },
  { label: 'Mehrfachagenten', intent: 'Mehrfachagent Versicherungsmakler unabhängig', icon: Users, category_code: 'insurance_broker_34d' },
];

export default function LeadDeskKontakte() {
  return <DeskContactBook desk="insurance" title="Insurance Kontakte" searchPresets={PRESETS} />;
}
