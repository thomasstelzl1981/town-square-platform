/**
 * AcquiaryKontakte — Now delegates to shared DeskContactBook
 */
import DeskContactBook from '@/components/admin/desks/DeskContactBook';
import { Building2, Landmark, Briefcase } from 'lucide-react';

const PRESETS = [
  { label: 'Family Office', intent: 'Family Office Vermögensverwaltung', icon: Landmark },
  { label: 'Immobilienunternehmen', intent: 'Immobilienunternehmen Immobiliengesellschaft', icon: Building2 },
  { label: 'Projektentwickler', intent: 'Projektentwickler Immobilienentwicklung', icon: Briefcase },
];

export default function AcquiaryKontakte() {
  return <DeskContactBook desk="acquiary" title="Acquiary Kontakte" searchPresets={PRESETS} />;
}
