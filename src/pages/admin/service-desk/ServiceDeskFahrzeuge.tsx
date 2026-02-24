/**
 * ServiceDeskFahrzeuge — MOD-17: Fahrzeuge, Boote, Privatjet, Angebote
 */
import ServiceDeskProductCRUD from './ServiceDeskProductCRUD';

const SUB_TABS = [
  { key: 'fahrzeuge', label: 'Fahrzeuge' },
  { key: 'boote', label: 'Boote' },
  { key: 'privatjet', label: 'Privatjet' },
  { key: 'angebote', label: 'Angebote' },
];

export default function ServiceDeskFahrzeuge() {
  return (
    <ServiceDeskProductCRUD
      title="MOD-17 — Fahrzeuge & Mobilität"
      subTabs={SUB_TABS}
    />
  );
}
