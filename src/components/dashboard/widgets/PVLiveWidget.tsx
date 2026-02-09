/**
 * PV Live Widget — Dashboard widget showing real-time PV aggregates
 */
import { useNavigate } from 'react-router-dom';
import { usePvPlants } from '@/hooks/usePvPlants';
import { usePvMonitoring } from '@/hooks/usePvMonitoring';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sun, Zap, TrendingUp, WifiOff } from 'lucide-react';

export function PVLiveWidget() {
  const navigate = useNavigate();
  const { plants } = usePvPlants();
  const { totalPowerW, totalEnergyTodayKwh, offlineCount, liveData } = usePvMonitoring(plants);

  if (plants.length === 0) return null;

  // Top 3 plants by power
  const top3 = Array.from(liveData.values())
    .sort((a, b) => b.currentPowerW - a.currentPowerW)
    .slice(0, 3);

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-yellow-500/5 to-orange-600/5"
      onClick={() => navigate('/portal/photovoltaik/monitoring')}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Sun className="h-4 w-4 text-yellow-600" />
          PV Live
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <Zap className="h-4 w-4 mx-auto text-yellow-600 mb-1" />
            <p className="text-lg font-bold font-mono">{totalPowerW >= 1000 ? `${(totalPowerW / 1000).toFixed(1)}` : totalPowerW}</p>
            <p className="text-[10px] text-muted-foreground">{totalPowerW >= 1000 ? 'kW' : 'W'}</p>
          </div>
          <div>
            <TrendingUp className="h-4 w-4 mx-auto text-green-600 mb-1" />
            <p className="text-lg font-bold font-mono">{totalEnergyTodayKwh.toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground">kWh heute</p>
          </div>
          <div>
            <WifiOff className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-lg font-bold font-mono">{offlineCount}</p>
            <p className="text-[10px] text-muted-foreground">Offline</p>
          </div>
        </div>
        {top3.length > 0 && (
          <div className="space-y-1 pt-1 border-t">
            {top3.map((d) => {
              const plant = plants.find((p) => p.id === d.plantId);
              return (
                <div key={d.plantId} className="flex justify-between text-xs">
                  <span className="text-muted-foreground truncate max-w-[60%]">{plant?.name || '—'}</span>
                  <span className="font-mono">{d.currentPowerW.toLocaleString('de-DE')} W</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
