/**
 * Demo Live Generator — Synthetic PV data for demo/presentation
 * Produces realistic bell-curve power output based on time of day
 */

export interface DemoDataPoint {
  hour: number;
  power_w: number;
  energy_kwh: number;
}

/**
 * Generate current power for a given kWp and hour (0-24 decimal)
 */
export function generateDemoPower(kwp: number, hour: number): number {
  if (hour < 5.5 || hour > 21) return 0;
  const peakHour = 12.5;
  const sigma = 3.5;
  const gaussian = Math.exp(-0.5 * ((hour - peakHour) / sigma) ** 2);
  const maxPower = kwp * 1000;
  const basePower = maxPower * gaussian;
  const noise = 1 + (Math.random() - 0.5) * 0.1;
  return Math.max(0, Math.round(basePower * noise));
}

/**
 * Generate cumulative energy for the day up to a given hour
 */
export function generateDemoEnergyToday(kwp: number, currentHour: number): number {
  let totalWh = 0;
  const steps = Math.min(currentHour, 21) * 4; // 15-min intervals
  for (let i = 0; i < steps; i++) {
    const h = i / 4;
    if (h > currentHour) break;
    const power = generateDemoPowerDeterministic(kwp, h);
    totalWh += power * 0.25; // 15 min = 0.25h
  }
  return Math.round(totalWh / 1000 * 100) / 100; // kWh, 2 decimals
}

/**
 * Deterministic version (no noise) for cumulative calculations
 */
function generateDemoPowerDeterministic(kwp: number, hour: number): number {
  if (hour < 5.5 || hour > 21) return 0;
  const peakHour = 12.5;
  const sigma = 3.5;
  const gaussian = Math.exp(-0.5 * ((hour - peakHour) / sigma) ** 2);
  return kwp * 1000 * gaussian;
}

/**
 * Generate a full 24h curve (for static preview charts)
 */
export function generate24hCurve(kwp: number): DemoDataPoint[] {
  const points: DemoDataPoint[] = [];
  let cumulativeWh = 0;
  for (let h = 0; h <= 24; h += 0.5) {
    const power = generateDemoPowerDeterministic(kwp, h);
    cumulativeWh += power * 0.5;
    points.push({
      hour: h,
      power_w: Math.round(power),
      energy_kwh: Math.round(cumulativeWh / 1000 * 100) / 100,
    });
  }
  return points;
}

/**
 * Generate monthly energy estimate (simplified: ~30 days × daily peak hours)
 */
export function generateDemoEnergyMonth(kwp: number, dayOfMonth: number): number {
  const avgDailyKwh = kwp * 3.2; // ~3.2 peak sun hours avg in Germany
  return Math.round(avgDailyKwh * dayOfMonth * 100) / 100;
}

/**
 * Get current hour as decimal (e.g. 14:30 = 14.5)
 */
export function getCurrentHourDecimal(): number {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60;
}
