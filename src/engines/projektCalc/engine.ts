/**
 * ProjektCalc-Engine — Reine Funktionen
 */

import type {
  ProjektKalkInput,
  ProjektKalkResult,
  UnitPricingInput,
  UnitPricingResult,
  ProjektUnit,
  VertriebsStatusResult,
} from './spec';

export function calcProjektKalkulation(input: ProjektKalkInput): ProjektKalkResult {
  const totalCosts = input.costs.reduce((s, c) => s + c.amount, 0);

  const costsByCategory: Record<string, number> = {};
  for (const c of input.costs) {
    costsByCategory[c.category] = (costsByCategory[c.category] ?? 0) + c.amount;
  }

  const totalAreaSqm = input.units.reduce((s, u) => s + u.areaSqm, 0);

  const totalRevenue = input.units.reduce((s, u) => {
    const price = u.soldPrice ?? u.areaSqm * u.targetPricePerSqm;
    return s + price;
  }, 0);

  const margin = totalRevenue - totalCosts;
  const marginPercent = totalCosts > 0 ? (margin / totalCosts) * 100 : 0;

  return {
    totalCosts,
    costsByCategory,
    totalRevenue,
    margin,
    marginPercent,
    revenuePerSqm: totalAreaSqm > 0 ? totalRevenue / totalAreaSqm : 0,
    costPerSqm: totalAreaSqm > 0 ? totalCosts / totalAreaSqm : 0,
    totalAreaSqm,
  };
}

export function calcUnitPricing(input: UnitPricingInput): UnitPricingResult {
  const basePrice = input.areaSqm * input.basePricePerSqm;
  const floorPremium = basePrice * ((input.floorPremiumPercent ?? 0) / 100);
  const balconyPremium = input.balconyPremiumFlat ?? 0;
  const premiums = floorPremium + balconyPremium;
  const subtotal = basePrice + premiums;
  const discount = subtotal * ((input.discountPercent ?? 0) / 100);
  const finalPrice = subtotal - discount;

  return {
    basePrice,
    premiums,
    discount,
    finalPrice,
    finalPricePerSqm: input.areaSqm > 0 ? finalPrice / input.areaSqm : 0,
  };
}

export function calcVertriebsStatus(units: ProjektUnit[]): VertriebsStatusResult {
  const totalUnits = units.length;
  const sold = units.filter((u) => u.status === 'sold').length;
  const reserved = units.filter((u) => u.status === 'reserved').length;
  const available = units.filter((u) => u.status === 'available').length;

  const soldRevenue = units
    .filter((u) => u.status === 'sold')
    .reduce((s, u) => s + (u.soldPrice ?? u.areaSqm * u.targetPricePerSqm), 0);

  const expectedTotalRevenue = units.reduce(
    (s, u) => s + (u.soldPrice ?? u.areaSqm * u.targetPricePerSqm),
    0
  );

  return {
    totalUnits,
    sold,
    reserved,
    available,
    soldPercent: totalUnits > 0 ? (sold / totalUnits) * 100 : 0,
    reservedPercent: totalUnits > 0 ? (reserved / totalUnits) * 100 : 0,
    soldRevenue,
    expectedTotalRevenue,
  };
}
