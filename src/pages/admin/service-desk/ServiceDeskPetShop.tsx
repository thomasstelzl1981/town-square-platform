/**
 * ServiceDeskPetShop — MOD-05: Ernährung, Lennox Tracker, Lennox Style, Fressnapf
 * Migrated from PetDeskShop, now uses service_shop_products
 */
import ServiceDeskProductCRUD from './ServiceDeskProductCRUD';

const SUB_TABS = [
  { key: 'ernaehrung', label: 'Ernährung' },
  { key: 'tracker', label: 'Lennox Tracker' },
  { key: 'style', label: 'Lennox Style' },
  { key: 'fressnapf', label: 'Fressnapf' },
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
