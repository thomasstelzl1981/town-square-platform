/**
 * PV Live Widget — Dashboard widget showing real-time PV aggregates with sparkline
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePvPlants } from '@/hooks/usePvPlants';
import { usePvMonitoring } from '@/hooks/usePvMonitoring';
import { usePreviewSafeMode } from '@/hooks/usePreviewSafeMode';
import { Card, CardContent } from '@/components/ui/card';
import { Sun, Zap, TrendingUp, WifiOff } from 'lucide-react';
import {
  AreaChart, Area, ReferenceDot, ResponsiveContainer, YAxis, XAxis,
} from 'recharts';
import {
  generate24hCurve,
  getCurrentHourDecimal,
} from '@/components/photovoltaik/DemoLiveGenerator';

export function PVLiveWidget() {
  const navigate = useNavigate();
  const { plants } = usePvPlants();
  const { safeRefreshInterval } = usePreviewSafeMode();
  const { totalPowerW, totalEnergyTodayKwh, offlineCount, liveData } = usePvMonitoring(plants, safeRefreshInterval);

  // Biggest plant by kWp for sparkline
  const biggestPlant = useMemo(
    () => plants.filter(p => p.status === 'active').sort((a, b) => (b.kwp ?? 0) - (a.kwp ?? 0))[0],
    [plants],
  );

  const curveData = useMemo(
    () => (biggestPlant ? generate24hCurve(biggestPlant.kwp ?? 10) : []),
    [biggestPlant],
  );

  const currentHour = getCurrentHourDecimal();

  // Find the data point closest to current hour for the reference dot
  const currentPoint = useMemo(() => {
    if (curveData.length === 0) return null;
    return curveData.reduce((prev, curr) =>
      Math.abs(curr.hour - currentHour) < Math.abs(prev.hour - currentHour) ? curr : prev,
    );
  }, [curveData, currentHour]);

  const anyOnline = Array.from(liveData.values()).some(d => d.isOnline);

  if (plants.length === 0) {
    return (
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-yellow-500/5 to-orange-600/5 h-[260px] md:h-auto md:aspect-square"
        onClick={() => navigate('/portal/photovoltaik/neu')}
      >
        <CardContent className="h-full flex flex-col p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">PV Live</span>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <Sun className="h-10 w-10 text-yellow-500/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-2">Keine PV-Anlage vorhanden</p>
            <span className="text-xs text-primary underline">Anlage anlegen →</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-yellow-500/5 to-orange-600/5 h-[260px] md:h-auto md:aspect-square"
        onClick={() => navigate('/portal/photovoltaik/anlagen')}
      >
        <CardContent className="h-full flex flex-col p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">PV Live</span>
            </div>
            {anyOnline && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </span>
            )}
          </div>

          {/* Sparkline */}
          {curveData.length > 0 && (
            <div className="w-full h-[60px] -mx-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={curveData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                  <defs>
                    <linearGradient id="pvSparkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(45, 93%, 47%)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="hsl(45, 93%, 47%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="hour" hide />
                  <YAxis hide domain={[0, 'dataMax']} />
                  <Area
                    type="monotone"
                    dataKey="power_w"
                    stroke="hsl(45, 93%, 47%)"
                    strokeWidth={1.5}
                    fill="url(#pvSparkGrad)"
                    isAnimationActive={false}
                  />
                  {currentPoint && currentPoint.power_w > 0 && (
                    <ReferenceDot
                      x={currentPoint.hour}
                      y={currentPoint.power_w}
                      r={4}
                      fill="hsl(25, 95%, 53%)"
                      stroke="white"
                      strokeWidth={2}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* KPI row */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <Zap className="h-3.5 w-3.5 mx-auto text-yellow-600 mb-0.5" />
              <p className="text-sm font-bold font-mono leading-tight">
                {totalPowerW >= 1000 ? `${(totalPowerW / 1000).toFixed(1)}` : totalPowerW}
              </p>
              <p className="text-[10px] text-muted-foreground">{totalPowerW >= 1000 ? 'kW' : 'W'}</p>
            </div>
            <div>
              <TrendingUp className="h-3.5 w-3.5 mx-auto text-green-600 mb-0.5" />
              <p className="text-sm font-bold font-mono leading-tight">{totalEnergyTodayKwh.toFixed(1)}</p>
              <p className="text-[10px] text-muted-foreground">kWh heute</p>
            </div>
            <div>
              <WifiOff className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-0.5" />
              <p className="text-sm font-bold font-mono leading-tight">{offlineCount}</p>
              <p className="text-[10px] text-muted-foreground">Offline</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
