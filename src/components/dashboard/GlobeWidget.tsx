import { Card, CardContent } from "@/components/ui/card";
import { Globe, MapPin } from "lucide-react";

interface GlobeWidgetProps {
  latitude: number | null;
  longitude: number | null;
  city?: string;
}

const formatCoord = (value: number | null, type: "lat" | "lng") => {
  if (value === null) return "--";
  const abs = Math.abs(value);
  const dir = type === "lat" ? (value >= 0 ? "N" : "S") : value >= 0 ? "O" : "W";
  return `${abs.toFixed(4)}° ${dir}`;
};

export function GlobeWidget({ latitude, longitude, city }: GlobeWidgetProps) {
  return (
    <Card className="relative h-[260px] md:h-auto md:aspect-square overflow-hidden border-primary/20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Deep Space Background */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 30% 20%, hsla(220, 60%, 15%, 0.9) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, hsla(270, 50%, 12%, 0.7) 0%, transparent 40%),
            radial-gradient(circle at 50% 50%, hsla(210, 80%, 8%, 1) 0%, hsla(220, 70%, 3%, 1) 100%)
          `,
        }}
      />

      {/* Animated Stars */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0.3 + Math.random() * 0.7,
              animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Animated Globe */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-32 h-32">
          <div
            className="absolute inset-0 rounded-full overflow-hidden shadow-[0_0_80px_-10px_rgba(59,130,246,0.5),inset_-20px_-20px_40px_rgba(0,0,0,0.4)]"
            style={{
              background: `
                radial-gradient(circle at 25% 25%, 
                  hsl(200, 85%, 55%) 0%, hsl(205, 75%, 50%) 10%,
                  hsl(140, 55%, 40%) 25%, hsl(145, 50%, 35%) 35%,
                  hsl(35, 65%, 55%) 45%, hsl(140, 45%, 38%) 55%,
                  hsl(200, 70%, 45%) 65%, hsl(210, 65%, 35%) 80%,
                  hsl(220, 55%, 20%) 100%)
              `,
              animation: "globe-rotate 30s linear infinite",
            }}
          >
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `
                  radial-gradient(ellipse 15% 8% at 25% 30%, white 0%, transparent 100%),
                  radial-gradient(ellipse 20% 10% at 55% 25%, white 0%, transparent 100%),
                  radial-gradient(ellipse 18% 12% at 70% 55%, white 0%, transparent 100%)
                `,
                animation: "clouds-drift 45s linear infinite",
              }}
            />
          </div>

          {/* Atmosphere glow */}
          <div
            className="absolute -inset-4 rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle, transparent 55%, hsla(200, 80%, 60%, 0.3) 70%, hsla(200, 90%, 70%, 0.1) 100%)",
              filter: "blur(4px)",
            }}
          />

          {/* Center marker */}
          <div
            className="absolute z-10"
            style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)", animation: "marker-pulse 2s ease-in-out infinite" }}
          >
            <div className="relative">
              <MapPin className="h-6 w-6 text-red-500 drop-shadow-lg" fill="currentColor" />
              <div className="absolute inset-0 animate-ping">
                <MapPin className="h-6 w-6 text-red-400 opacity-75" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)" }}
      />

      {/* Overlay content */}
      <CardContent className="relative z-20 p-4 h-full flex flex-col justify-between pointer-events-none">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="h-4 w-4 text-primary drop-shadow-lg" />
          <span className="text-sm font-medium text-white drop-shadow-md">Globus</span>
        </div>
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-0.5 text-xs font-mono text-white/70 drop-shadow-md">
            <span>LAT: {formatCoord(latitude, "lat")}</span>
            <span>LNG: {formatCoord(longitude, "lng")}</span>
            {city && <span className="text-white/50 mt-1">{city}</span>}
          </div>
        </div>
      </CardContent>

      <style>{`
        @keyframes globe-rotate { from { background-position-x: 0%; } to { background-position-x: 200%; } }
        @keyframes clouds-drift { from { background-position-x: 0%; } to { background-position-x: 300%; } }
        @keyframes twinkle { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 1; transform: scale(1.2); } }
        @keyframes marker-pulse { 0%, 100% { transform: translate(-50%, -50%) scale(1); } 50% { transform: translate(-50%, -50%) scale(1.1); } }
      `}</style>
    </Card>
  );
}
