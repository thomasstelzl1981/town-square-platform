/**
 * ServiceDeskFahrzeuge — MOD-17: Fahrzeuge, Boote, Privatjet, Angebote
 */
import ServiceDeskProductCRUD from './ServiceDeskProductCRUD';

const SUB_TABS = [
  { key: 'bmw-fokus', label: 'BMW Fokusmodelle' },
  { key: 'miete24-autos', label: 'Miete24' },
  { key: 'boote', label: 'Boote' },
  { key: 'privatjet', label: 'Privatjet' },
];

export default function ServiceDeskFahrzeuge() {
  return (
    <ServiceDeskProductCRUD
      title="MOD-17 — Fahrzeuge & Mobilität"
      subTabs={SUB_TABS}
    />
  );
}
