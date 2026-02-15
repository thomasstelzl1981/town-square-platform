/**
 * Demo Live Generator — Seasonal PV data for demo/presentation
 * Produces realistic bell-curve power output based on time of day, month, and kWp
 */

export interface DemoDataPoint {
  hour: number;
  power_w: number;
  energy_kwh: number;
}

export interface SeasonalParams {
  sunrise: number;      // decimal hour
  sunset: number;       // decimal hour
  peakFactor: number;   // 0-1 multiplier for max power
  sunHoursPerDay: number; // avg daily sun hours for energy calc
}

/**
 * Get seasonal parameters for a given month (1-12)
 */
export function getSeasonalParams(month: number): SeasonalParams {
  const table: Record<number, SeasonalParams> = {
    1:  { sunrise: 8.0,  sunset: 16.0,  peakFactor: 0.25, sunHoursPerDay: 1.0 },
    2:  { sunrise: 7.5,  sunset: 17.0,  peakFactor: 0.35, sunHoursPerDay: 1.5 },
    3:  { sunrise: 6.5,  sunset: 18.5,  peakFactor: 0.55, sunHoursPerDay: 2.5 },
    4:  { sunrise: 6.0,  sunset: 20.0,  peakFactor: 0.75, sunHoursPerDay: 3.5 },
    5:  { sunrise: 5.5,  sunset: 20.5,  peakFactor: 0.85, sunHoursPerDay: 4.0 },
    6:  { sunrise: 5.25, sunset: 21.5,  peakFactor: 1.0,  sunHoursPerDay: 4.8 },
    7:  { sunrise: 5.25, sunset: 21.5,  peakFactor: 1.0,  sunHoursPerDay: 4.8 },
    8:  { sunrise: 5.75, sunset: 20.75, peakFactor: 0.90, sunHoursPerDay: 4.2 },
    9:  { sunrise: 6.5,  sunset: 19.5,  peakFactor: 0.65, sunHoursPerDay: 3.0 },
    10: { sunrise: 7.0,  sunset: 18.0,  peakFactor: 0.45, sunHoursPerDay: 2.0 },
    11: { sunrise: 7.5,  sunset: 16.5,  peakFactor: 0.30, sunHoursPerDay: 1.2 },
    12: { sunrise: 8.0,  sunset: 16.0,  peakFactor: 0.25, sunHoursPerDay: 1.0 },
  };
  return table[month] || table[6];
}

function getCurrentMonth(): number {
  return new Date().getMonth() + 1;
}

/**
 * Generate current power for a given kWp, hour, and optional month
 */
export function generateDemoPower(kwp: number, hour: number, month?: number): number {
  const s = getSeasonalParams(month ?? getCurrentMonth());
  if (hour < s.sunrise || hour > s.sunset) return 0;
  const peakHour = (s.sunrise + s.sunset) / 2;
  const sigma = (s.sunset - s.sunrise) / 4.5;
  const gaussian = Math.exp(-0.5 * ((hour - peakHour) / sigma) ** 2);
  const maxPower = kwp * 1000 * s.peakFactor;
  const noise = 1 + (Math.random() - 0.5) * 0.1;
  return Math.max(0, Math.round(maxPower * gaussian * noise));
}

/**
 * Deterministic version (no noise) for cumulative calculations
 */
function generateDemoPowerDeterministic(kwp: number, hour: number, month?: number): number {
  const s = getSeasonalParams(month ?? getCurrentMonth());
  if (hour < s.sunrise || hour > s.sunset) return 0;
  const peakHour = (s.sunrise + s.sunset) / 2;
  const sigma = (s.sunset - s.sunrise) / 4.5;
  const gaussian = Math.exp(-0.5 * ((hour - peakHour) / sigma) ** 2);
  return kwp * 1000 * s.peakFactor * gaussian;
}

/**
 * Generate cumulative energy for the day up to a given hour
 */
export function generateDemoEnergyToday(kwp: number, currentHour: number, month?: number): number {
  const m = month ?? getCurrentMonth();
  const s = getSeasonalParams(m);
  let totalWh = 0;
  const steps = Math.min(currentHour, s.sunset) * 4;
  for (let i = 0; i < steps; i++) {
    const h = i / 4;
    if (h > currentHour) break;
    const power = generateDemoPowerDeterministic(kwp, h, m);
    totalWh += power * 0.25;
  }
  return Math.round(totalWh / 1000 * 100) / 100;
}

/**
 * Generate a full 24h curve (for static preview charts)
 */
export function generate24hCurve(kwp: number, month?: number): DemoDataPoint[] {
  const m = month ?? getCurrentMonth();
  const points: DemoDataPoint[] = [];
  let cumulativeWh = 0;
  for (let h = 0; h <= 24; h += 0.5) {
    const power = generateDemoPowerDeterministic(kwp, h, m);
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
 * Generate monthly energy estimate using seasonal sun hours
 */
export function generateDemoEnergyMonth(kwp: number, dayOfMonth: number, month?: number): number {
  const s = getSeasonalParams(month ?? getCurrentMonth());
  const avgDailyKwh = kwp * s.sunHoursPerDay;
  return Math.round(avgDailyKwh * dayOfMonth * 100) / 100;
}

/**
 * Get current hour as decimal (e.g. 14:30 = 14.5)
 */
export function getCurrentHourDecimal(): number {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60;
}
