/**
 * ServiceDeskPV — MOD-19: Anbieter, Produkte, Partner-Config, Monitoring
 */
import ServiceDeskProductCRUD from './ServiceDeskProductCRUD';

const SUB_TABS = [
  { key: 'anbieter', label: 'Anbieter' },
  { key: 'produkte', label: 'Produkte' },
  { key: 'partner', label: 'Partner-Config' },
  { key: 'monitoring', label: 'Monitoring' },
];

export default function ServiceDeskPV() {
  return (
    <ServiceDeskProductCRUD
      title="MOD-19 — Photovoltaik"
      subTabs={SUB_TABS}
      shopKeyPrefix="pv"
    />
  );
}
