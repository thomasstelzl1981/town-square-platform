/**
 * Hook for PV Monitoring — Demo live data generation
 */
import { useState, useEffect, useCallback } from 'react';
import { PvPlant } from './usePvPlants';
import {
  generateDemoPower,
  generateDemoEnergyToday,
  generateDemoEnergyMonth,
  getCurrentHourDecimal,
} from '@/components/photovoltaik/DemoLiveGenerator';

export interface PlantLiveData {
  plantId: string;
  currentPowerW: number;
  energyTodayKwh: number;
  energyMonthKwh: number;
  lastUpdate: Date;
  isOnline: boolean;
}

/**
 * @param refreshInterval Default 7s in production, auto-throttled to 60s in preview via usePreviewSafeMode
 */
export function usePvMonitoring(plants: PvPlant[], refreshInterval = 7000) {
  const [liveData, setLiveData] = useState<Map<string, PlantLiveData>>(new Map());

  const generateData = useCallback(() => {
    const now = new Date();
    const hour = getCurrentHourDecimal();
    const dayOfMonth = now.getDate();
    const newData = new Map<string, PlantLiveData>();

    plants.forEach((plant) => {
      if (plant.provider !== 'demo' || plant.status !== 'active') {
        newData.set(plant.id, {
          plantId: plant.id,
          currentPowerW: 0,
          energyTodayKwh: 0,
          energyMonthKwh: 0,
          lastUpdate: now,
          isOnline: plant.provider === 'demo',
        });
        return;
      }

      const kwp = plant.kwp ?? 10;
      newData.set(plant.id, {
        plantId: plant.id,
        currentPowerW: generateDemoPower(kwp, hour),
        energyTodayKwh: generateDemoEnergyToday(kwp, hour),
        energyMonthKwh: generateDemoEnergyMonth(kwp, dayOfMonth),
        lastUpdate: now,
        isOnline: true,
      });
    });

    setLiveData(newData);
  }, [plants]);

  useEffect(() => {
    if (plants.length === 0) return;
    generateData();
    const interval = setInterval(generateData, refreshInterval);
    return () => clearInterval(interval);
  }, [plants, refreshInterval, generateData]);

  // Aggregates
  const totalPowerW = Array.from(liveData.values()).reduce((s, d) => s + d.currentPowerW, 0);
  const totalEnergyTodayKwh = Array.from(liveData.values()).reduce((s, d) => s + d.energyTodayKwh, 0);
  const totalEnergyMonthKwh = Array.from(liveData.values()).reduce((s, d) => s + d.energyMonthKwh, 0);
  const offlineCount = Array.from(liveData.values()).filter((d) => !d.isOnline).length;

  return {
    liveData,
    totalPowerW,
    totalEnergyTodayKwh: Math.round(totalEnergyTodayKwh * 100) / 100,
    totalEnergyMonthKwh: Math.round(totalEnergyMonthKwh * 100) / 100,
    offlineCount,
  };
}
