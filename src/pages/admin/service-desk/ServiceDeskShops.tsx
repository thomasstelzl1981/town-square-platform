/**
 * ServiceDeskShops — MOD-16: Amazon Business, Büroshop24, Miete24, Smart Home
 */
import ServiceDeskProductCRUD from './ServiceDeskProductCRUD';

const SUB_TABS = [
  { key: 'amazon', label: 'Amazon Business' },
  { key: 'bueroshop24', label: 'Büroshop24' },
  { key: 'miete24', label: 'Miete24' },
  { key: 'smart-home', label: 'Smart Home' },
];

export default function ServiceDeskShops() {
  return (
    <ServiceDeskProductCRUD
      title="MOD-16 — Shops & Bürobedarf"
      subTabs={SUB_TABS}
    />
  );
}
