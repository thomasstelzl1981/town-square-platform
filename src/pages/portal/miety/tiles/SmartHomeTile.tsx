import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { TileShell } from '../shared/TileShell';
import { demoCameras } from '../shared/demoCameras';
import {
  Camera, Plus, ShoppingCart, ExternalLink, Link2, CheckCircle2,
} from 'lucide-react';

// Eufy product images
import eufySolocamS340 from '@/assets/miety/eufy-solocam-s340.jpg';
import eufyFloodlightE340 from '@/assets/miety/eufy-floodlight-e340.jpg';
import eufyIndoorS350 from '@/assets/miety/eufy-indoor-s350.jpg';
import eufyHomebaseS380 from '@/assets/miety/eufy-homebase-s380.jpg';

// =============================================================================
// EufyConnectCard — functional eufy account connection
// =============================================================================
function EufyConnectCard() {
  const { activeTenantId, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.id || !activeTenantId) return;
    supabase
      .from('miety_eufy_accounts')
      .select('email')
      .eq('user_id', user.id)
      .eq('tenant_id', activeTenantId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) { setConnected(true); setEmail(data.email); }
      });
  }, [user?.id, activeTenantId]);

  const handleConnect = async () => {
    if (!email || !password || !activeTenantId) return;
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/eufy-connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ action: 'login', email, password, tenant_id: activeTenantId }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        setError(result.detail || result.error || 'Verbindung fehlgeschlagen');
      } else {
        setConnected(true);
        setDevices(result.devices || []);
        setPassword('');
      }
    } catch (e: any) {
      setError(e.message || 'Netzwerkfehler');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/eufy-connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ action: 'disconnect', tenant_id: activeTenantId }),
    });
    setConnected(false);
    setDevices([]);
    setEmail('');
  };

  return (
    <Card className="glass-card border-primary/20">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Link2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">eufy Konto verbinden</h3>
            <p className="text-xs text-muted-foreground">
              {connected ? `Verbunden als ${email}` : 'Melden Sie sich mit Ihrem eufy-Konto an, um Ihre Kameras zu verwalten.'}
            </p>
          </div>
          {connected && (
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-0 text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1" />Verbunden
            </Badge>
          )}
        </div>

        {connected ? (
          <div className="space-y-3">
            {devices.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Erkannte Geräte:</p>
                {devices.map((d, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-sm font-medium">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.model}</p>
                    </div>
                    <Badge variant={d.status === 'online' ? 'default' : 'secondary'} className="text-[10px]">
                      {d.status === 'online' ? '● Online' : '○ Offline'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            <Button size="sm" variant="outline" className="text-xs" onClick={handleDisconnect}>
              Verbindung trennen
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label className="text-xs mb-1.5 block">E-Mail-Adresse</Label>
              <Input type="email" placeholder="ihre@email.de" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Passwort</Label>
              <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button className="w-full mt-1" onClick={handleConnect} disabled={loading || !email || !password}>
              <Link2 className="h-4 w-4 mr-2" />
              {loading ? 'Verbinde...' : 'Verbindung herstellen'}
            </Button>
            <p className="text-[10px] text-muted-foreground text-center">
              Ihre Zugangsdaten werden verschlüsselt gespeichert und nur für die API-Verbindung verwendet.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// SmartHomeTile
// =============================================================================
export default function SmartHomeTile() {
  const [cameraToggles, setCameraToggles] = useState<Record<string, boolean>>({
    'cam-1': true, 'cam-2': true, 'cam-3': false,
  });

  const eufyProducts = [
    { id: 'solocam-s340', name: 'eufy SoloCam S340', price: 'ab 159,99 EUR', image: eufySolocamS340, badges: ['3K', 'Solar', 'WLAN', '360°'], url: 'https://www.eufy.com/de/products/solocam-s340' },
    { id: 'floodlight-e340', name: 'eufy Floodlight Cam E340', price: 'ab 179,99 EUR', image: eufyFloodlightE340, badges: ['3K', 'Flutlicht', 'WLAN', '360°'], url: 'https://www.eufy.com/de/products/floodlight-cam-e340' },
    { id: 'indoor-s350', name: 'eufy Indoor Cam S350', price: 'ab 59,99 EUR', image: eufyIndoorS350, badges: ['4K', 'Pan&Tilt', 'WLAN', 'Dual-Cam'], url: 'https://www.eufy.com/de/products/indoor-cam-s350' },
    { id: 'homebase-s380', name: 'eufy HomeBase S380', price: 'ab 149,99 EUR', image: eufyHomebaseS380, badges: ['WiFi', '16TB', 'Lokal-KI'], url: 'https://www.eufy.com/de/products/homebase-s380' },
  ];

  return (
    <TileShell icon={Camera} title="Smart Home" description="Kamera-Verwaltung und eufy Smart Home">
      {/* Camera Management */}
      <Card className="glass-card">
        <CardContent className="p-5">
          <h3 className="font-medium text-sm mb-3">Meine Kameras</h3>
          <p className="text-xs text-muted-foreground mb-4">Aktivierte Kameras erscheinen auf Ihrer Übersicht.</p>
          <div className="space-y-3">
            {demoCameras.map((cam) => (
              <div key={cam.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <img src={cam.image} alt={cam.name} className="h-10 w-10 rounded object-cover" />
                  <div>
                    <p className="text-sm font-medium">{cam.name}</p>
                    <p className={`text-xs ${cam.status === 'online' ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {cam.status === 'online' ? '● Online' : '○ Offline'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Dashboard</span>
                  <Switch
                    checked={cameraToggles[cam.id] ?? false}
                    onCheckedChange={(v) => setCameraToggles(p => ({ ...p, [cam.id]: v }))}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Starter Set Banner */}
      <Card className="glass-card border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <ShoppingCart className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Starter Set — eufy Security</p>
              <p className="text-xs text-muted-foreground">2 Kameras + HomeBase — alles was Sie brauchen</p>
              <p className="text-lg font-bold mt-1">Komplett ab 469,97 EUR</p>
            </div>
            <Button size="sm">Starter Set kaufen</Button>
          </div>
        </CardContent>
      </Card>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {eufyProducts.map((product) => (
          <Card key={product.id} className="glass-card overflow-hidden">
            <CardContent className="p-0">
              <div className="aspect-square bg-muted/20 flex items-center justify-center p-6">
                <img src={product.image} alt={product.name} className="max-h-full max-w-full object-contain" />
              </div>
              <div className="p-4">
                <p className="font-medium text-sm">{product.name}</p>
                <p className="text-sm font-semibold mt-1">{product.price}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {product.badges.map(b => (
                    <Badge key={b} variant="outline" className="text-[10px]">{b}</Badge>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" className="text-xs flex-1" onClick={() => window.open(product.url, '_blank')}>
                    <ExternalLink className="h-3 w-3 mr-1" />Bei eufy kaufen
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* eufy Konto verbinden */}
      <EufyConnectCard />
    </TileShell>
  );
}
