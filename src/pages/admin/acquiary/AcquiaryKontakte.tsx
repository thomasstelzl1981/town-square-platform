/**
 * AcquiaryKontakte — Now delegates to shared DeskContactBook
 */
import DeskContactBook from '@/components/admin/desks/DeskContactBook';
import { Building2, Landmark, Briefcase } from 'lucide-react';

const PRESETS = [
  { label: 'Family Office', intent: 'Family Office Vermögensverwaltung', icon: Landmark, category_code: 'family_office' },
  { label: 'Immobilienunternehmen', intent: 'Immobilienunternehmen Immobiliengesellschaft', icon: Building2, category_code: 'real_estate_company' },
  { label: 'Projektentwickler', intent: 'Projektentwickler Immobilienentwicklung', icon: Briefcase, category_code: 'real_estate_company' },
];

export default function AcquiaryKontakte() {
  return <DeskContactBook desk="acquiary" title="Acquiary Kontakte" searchPresets={PRESETS} />;
}
