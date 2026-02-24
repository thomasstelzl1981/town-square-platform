import DeskContactBook from '@/components/admin/desks/DeskContactBook';
import { Dog, Home, Scissors, ShoppingBag } from 'lucide-react';

const PRESETS = [
  { label: 'Hundepension', intent: 'Hundepension Hundebetreuung Tagesbetreuung', icon: Home },
  { label: 'Hundehotel', intent: 'Hundehotel Hundeübernachtung', icon: Dog },
  { label: 'Hundesalon', intent: 'Hundesalon Hundefriseur Hundepflege', icon: Scissors },
  { label: 'Tierbedarf', intent: 'Tierbedarf Tierhandlung Hundebedarf', icon: ShoppingBag },
];

export default function PetDeskKontakte() {
  return <DeskContactBook desk="pet" title="Pet Kontakte" searchPresets={PRESETS} />;
}
