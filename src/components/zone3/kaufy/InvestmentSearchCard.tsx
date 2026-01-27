import { useState } from 'react';
import { ChevronDown, ChevronUp, Search, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const BUNDESLAENDER = [
  { code: 'BW', name: 'Baden-Württemberg' },
  { code: 'BY', name: 'Bayern' },
  { code: 'BE', name: 'Berlin' },
  { code: 'BB', name: 'Brandenburg' },
  { code: 'HB', name: 'Bremen' },
  { code: 'HH', name: 'Hamburg' },
  { code: 'HE', name: 'Hessen' },
  { code: 'MV', name: 'Mecklenburg-Vorpommern' },
  { code: 'NI', name: 'Niedersachsen' },
  { code: 'NW', name: 'Nordrhein-Westfalen' },
  { code: 'RP', name: 'Rheinland-Pfalz' },
  { code: 'SL', name: 'Saarland' },
  { code: 'SN', name: 'Sachsen' },
  { code: 'ST', name: 'Sachsen-Anhalt' },
  { code: 'SH', name: 'Schleswig-Holstein' },
  { code: 'TH', name: 'Thüringen' },
];

interface SearchParams {
  zvE: number;
  equity: number;
  maritalStatus: 'single' | 'married';
  hasChurchTax: boolean;
  state: string;
}

interface InvestmentSearchCardProps {
  onSearch: (params: SearchParams) => void;
  isLoading?: boolean;
}

export function InvestmentSearchCard({ onSearch, isLoading }: InvestmentSearchCardProps) {
  const [activeTab, setActiveTab] = useState<'investment' | 'classic'>('investment');
  const [expanded, setExpanded] = useState(false);
  
  // Investment search state
  const [zvE, setZvE] = useState('60000');
  const [equity, setEquity] = useState('50000');
  const [maritalStatus, setMaritalStatus] = useState<'single' | 'married'>('single');
  const [hasChurchTax, setHasChurchTax] = useState(false);
  const [state, setState] = useState('BY');

  // Classic search state
  const [city, setCity] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minArea, setMinArea] = useState('');

  const handleSearch = () => {
    if (activeTab === 'investment') {
      onSearch({
        zvE: parseInt(zvE) || 60000,
        equity: parseInt(equity) || 50000,
        maritalStatus,
        hasChurchTax,
        state,
      });
    } else {
      // Classic search - for now just trigger with defaults
      onSearch({
        zvE: 60000,
        equity: 50000,
        maritalStatus: 'single',
        hasChurchTax: false,
        state: 'BY',
      });
    }
  };

  return (
    <div 
      className="rounded-2xl p-6 backdrop-blur-sm border"
      style={{ 
        backgroundColor: 'hsl(var(--z3-card) / 0.95)',
        borderColor: 'hsl(var(--z3-border))',
      }}
    >
      {/* Tab Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('investment')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'investment'
              ? 'text-white'
              : ''
          }`}
          style={{
            backgroundColor: activeTab === 'investment' 
              ? 'hsl(var(--z3-primary))' 
              : 'hsl(var(--z3-secondary))',
            color: activeTab === 'investment' 
              ? 'hsl(var(--z3-primary-foreground))' 
              : 'hsl(var(--z3-foreground))',
          }}
        >
          <Calculator className="w-4 h-4" />
          Investment-Suche
        </button>
        <button
          onClick={() => setActiveTab('classic')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2`}
          style={{
            backgroundColor: activeTab === 'classic' 
              ? 'hsl(var(--z3-primary))' 
              : 'hsl(var(--z3-secondary))',
            color: activeTab === 'classic' 
              ? 'hsl(var(--z3-primary-foreground))' 
              : 'hsl(var(--z3-foreground))',
          }}
        >
          <Search className="w-4 h-4" />
          Klassische Suche
        </button>
      </div>

      {/* Investment Search Form */}
      {activeTab === 'investment' && (
        <div className="space-y-4">
          {/* Main Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                Zu versteuerndes Einkommen (zvE)
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  value={zvE}
                  onChange={(e) => setZvE(e.target.value)}
                  className="pr-8"
                  style={{ 
                    backgroundColor: 'hsl(var(--z3-background))',
                    borderColor: 'hsl(var(--z3-border))',
                  }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                Eigenkapital
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  value={equity}
                  onChange={(e) => setEquity(e.target.value)}
                  className="pr-8"
                  style={{ 
                    backgroundColor: 'hsl(var(--z3-background))',
                    borderColor: 'hsl(var(--z3-border))',
                  }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
              </div>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleSearch}
                disabled={isLoading}
                className="w-full"
                style={{
                  backgroundColor: 'hsl(var(--z3-primary))',
                  color: 'hsl(var(--z3-primary-foreground))',
                }}
              >
                {isLoading ? 'Berechne...' : 'Ergebnisse anzeigen →'}
              </Button>
            </div>
          </div>

          {/* Expanded Options */}
          {expanded && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t" style={{ borderColor: 'hsl(var(--z3-border))' }}>
              <div className="space-y-1.5">
                <Label className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                  Familienstand
                </Label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMaritalStatus('single')}
                    className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: maritalStatus === 'single' 
                        ? 'hsl(var(--z3-primary))' 
                        : 'hsl(var(--z3-secondary))',
                      color: maritalStatus === 'single' 
                        ? 'hsl(var(--z3-primary-foreground))' 
                        : 'hsl(var(--z3-foreground))',
                    }}
                  >
                    Ledig
                  </button>
                  <button
                    onClick={() => setMaritalStatus('married')}
                    className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: maritalStatus === 'married' 
                        ? 'hsl(var(--z3-primary))' 
                        : 'hsl(var(--z3-secondary))',
                      color: maritalStatus === 'married' 
                        ? 'hsl(var(--z3-primary-foreground))' 
                        : 'hsl(var(--z3-foreground))',
                    }}
                  >
                    Verheiratet
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                  Kirchensteuer
                </Label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setHasChurchTax(false)}
                    className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: !hasChurchTax 
                        ? 'hsl(var(--z3-primary))' 
                        : 'hsl(var(--z3-secondary))',
                      color: !hasChurchTax 
                        ? 'hsl(var(--z3-primary-foreground))' 
                        : 'hsl(var(--z3-foreground))',
                    }}
                  >
                    Nein
                  </button>
                  <button
                    onClick={() => setHasChurchTax(true)}
                    className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: hasChurchTax 
                        ? 'hsl(var(--z3-primary))' 
                        : 'hsl(var(--z3-secondary))',
                      color: hasChurchTax 
                        ? 'hsl(var(--z3-primary-foreground))' 
                        : 'hsl(var(--z3-foreground))',
                    }}
                  >
                    Ja
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                  Bundesland
                </Label>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger 
                    style={{ 
                      backgroundColor: 'hsl(var(--z3-background))',
                      borderColor: 'hsl(var(--z3-border))',
                    }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUNDESLAENDER.map((bl) => (
                      <SelectItem key={bl.code} value={bl.code}>
                        {bl.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Expand Toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-sm mx-auto"
            style={{ color: 'hsl(var(--z3-muted-foreground))' }}
          >
            {expanded ? (
              <>Weniger Optionen <ChevronUp className="w-4 h-4" /></>
            ) : (
              <>Mehr Optionen <ChevronDown className="w-4 h-4" /></>
            )}
          </button>
        </div>
      )}

      {/* Classic Search Form */}
      {activeTab === 'classic' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                Stadt oder PLZ
              </Label>
              <Input
                placeholder="z.B. München, 80331"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={{ 
                  backgroundColor: 'hsl(var(--z3-background))',
                  borderColor: 'hsl(var(--z3-border))',
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                Preis bis
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="500000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="pr-8"
                  style={{ 
                    backgroundColor: 'hsl(var(--z3-background))',
                    borderColor: 'hsl(var(--z3-border))',
                  }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                Fläche ab
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="50"
                  value={minArea}
                  onChange={(e) => setMinArea(e.target.value)}
                  className="pr-10"
                  style={{ 
                    backgroundColor: 'hsl(var(--z3-background))',
                    borderColor: 'hsl(var(--z3-border))',
                  }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">m²</span>
              </div>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleSearch}
                disabled={isLoading}
                className="w-full"
                style={{
                  backgroundColor: 'hsl(var(--z3-primary))',
                  color: 'hsl(var(--z3-primary-foreground))',
                }}
              >
                {isLoading ? 'Suche...' : 'Suchen →'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
