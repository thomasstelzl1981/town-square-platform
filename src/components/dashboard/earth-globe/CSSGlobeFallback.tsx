import { MapPin } from "lucide-react";

/**
 * Pure CSS fallback globe used when Google 3D map can't be loaded.
 * Kept as a separate component to keep EarthGlobeCard maintainable.
 */
export function CSSGlobeFallback() {
  return (
    <>
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
                  hsl(200, 85%, 55%) 0%,
                  hsl(205, 75%, 50%) 10%,
                  hsl(140, 55%, 40%) 25%,
                  hsl(145, 50%, 35%) 35%,
                  hsl(35, 65%, 55%) 45%,
                  hsl(140, 45%, 38%) 55%,
                  hsl(200, 70%, 45%) 65%,
                  hsl(210, 65%, 35%) 80%,
                  hsl(220, 55%, 20%) 100%
                )
              `,
              animation: "globe-rotate 30s linear infinite",
            }}
          >
            {/* Cloud layer */}
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
              background:
                "radial-gradient(circle, transparent 55%, hsla(200, 80%, 60%, 0.3) 70%, hsla(200, 90%, 70%, 0.1) 100%)",
              filter: "blur(4px)",
            }}
          />

          {/* Center marker */}
          <div
            className="absolute z-10"
            style={{
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              animation: "marker-pulse 2s ease-in-out infinite",
            }}
          >
            <div className="relative">
              <MapPin
                className="h-6 w-6 text-red-500 drop-shadow-lg"
                fill="currentColor"
              />
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
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)",
        }}
      />

      {/* CSS Animations */}
      <style>{`
        @keyframes globe-rotate {
          from { background-position-x: 0%; }
          to { background-position-x: 200%; }
        }
        @keyframes clouds-drift {
          from { background-position-x: 0%; }
          to { background-position-x: 300%; }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes marker-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.1); }
        }
      `}</style>
    </>
  );
}
