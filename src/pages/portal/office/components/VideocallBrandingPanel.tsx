import { Video, Shield, Globe, Sparkles } from 'lucide-react';

const features = [
  { icon: Shield, title: 'Verschlüsselt', desc: 'Ende-zu-Ende gesichert' },
  { icon: Globe, title: 'Keine Installation', desc: 'Direkt im Browser' },
  { icon: Sparkles, title: 'KI-Assistent', desc: 'Armstrong integriert' },
];

export const VideocallBrandingPanel = () => {
  return (
    <div className="h-full bg-zinc-900/50 p-5 flex flex-col justify-between">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Video className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-white">System of a Town</span>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Willkommen beim gebrandeten Videocall-System. 
          Professionelle Kommunikation, direkt aus Ihrem Portal.
        </p>
      </div>

      {/* Features */}
      <div className="space-y-3 my-6">
        {features.map((f) => (
          <div key={f.title} className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50">
            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
              <f.icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{f.title}</p>
              <p className="text-xs text-zinc-500">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <p className="text-[10px] text-zinc-600 text-center">
        © {new Date().getFullYear()} System of a Town GmbH
      </p>
    </div>
  );
};
