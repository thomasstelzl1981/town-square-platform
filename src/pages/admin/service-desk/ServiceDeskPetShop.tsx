/**
 * ServiceDeskPetShop — MOD-05: Lennox Tracker, Lennox Style, Ernährung, Zooplus
 * Uses service_shop_products via ServiceDeskProductCRUD
 */
import ServiceDeskProductCRUD from './ServiceDeskProductCRUD';

const SUB_TABS = [
  { key: 'tracker', label: 'Lennox Tracker' },
  { key: 'style', label: 'Lennox Style' },
  { key: 'ernaehrung', label: 'Ernährung' },
  { key: 'zooplus', label: 'Zooplus' },
];

export default function ServiceDeskPetShop() {
  return (
    <ServiceDeskProductCRUD
      title="MOD-05 — Pet-Shop"
      subTabs={SUB_TABS}
      shopKeyPrefix="pet"
    />
  );
}
