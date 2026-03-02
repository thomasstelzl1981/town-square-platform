/**
 * Engines — Zentraler Re-Export
 */

// Engine 1: Akquise-Kalkulation
export * from './akquiseCalc/engine';
export * from './akquiseCalc/spec';

// Engine 2: Finanzierung
export * from './finanzierung/engine';
export * from './finanzierung/spec';

// Engine 3: Provision
export * from './provision/engine';
export * from './provision/spec';

// Engine 4: Bewirtschaftung / BWA
export * from './bewirtschaftung/engine';
export * from './bewirtschaftung/spec';
export * from './bewirtschaftung/bwaDatev';
export * from './bewirtschaftung/bwaDatevSpec';

// Engine 5: Projekt-Kalkulation
export * from './projektCalc/engine';
export * from './projektCalc/spec';

// Engine 6: NK-Abrechnung (existiert bereits)
export * from './nkAbrechnung';

// Engine 7: Demo-Daten
export * from './demoData';

// Engine 8: Finanzübersicht
export * from './finanzuebersicht/engine';
export * from './finanzuebersicht/spec';

// Engine 9: Vorsorge-Lückenrechner
export * from './vorsorgeluecke/engine';
export * from './vorsorgeluecke/spec';

// Engine 10: V+V Steuer (ENG-VVSTEUER)
export * from './vvSteuer';

// Engine 11: Konto-Matching (ENG-KONTOMATCH)
export * from './kontoMatch/engine';
export * from './kontoMatch/spec';
export * from './kontoMatch/recurring';

// Engine 12: Market Directory (ENG-MKTDIR)
export * from './marketDirectory';

// Engine 13: Trip Engine (ENG-TRIP) — Fahrtenbuch Trip Detection
export * from './tripEngine/engine';
export * from './tripEngine/spec';

// Engine 14: Tenancy Lifecycle Controller (ENG-TLC)
export * from './tenancyLifecycle/engine';
export * from './tenancyLifecycle/spec';

// Engine 15: Sales Lifecycle Controller (ENG-SLC)
export * from './slc/engine';
export * from './slc/spec';

// Engine 16: Financing Lifecycle Controller (ENG-FLC)
export * from './flc/engine';
export * from './flc/spec';

// Engine 17: Finance Data Controller (ENG-FDC)
export * from './fdc/engine';
export * from './fdc/spec';

// Engine 18: Pet Service Lifecycle Controller (ENG-PLC)
export * from './plc/engine';
export * from './plc/spec';

// Shared Controller Conventions
export * from './shared/controllerConventions';
