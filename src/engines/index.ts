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

// Engine 17: Konto-Matching (ENG-KONTOMATCH)
export * from './kontoMatch/engine';
export * from './kontoMatch/spec';
export * from './kontoMatch/recurring';
