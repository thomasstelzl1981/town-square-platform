import { Link, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  User, Building, CreditCard, Shield,
  Mail, FileText, Users, Calendar,
  HardDrive, Inbox, SortAsc, Settings,
  Layers, Briefcase, Wrench, TrendingUp,
  LayoutDashboard, List, Banknote, Home,
  Tag, Activity, MessageSquare, ClipboardList,
  Landmark, FileDown, CheckCircle,
  Search, Heart, FileSignature, Calculator,
  BookOpen, CheckSquare, UserPlus, Network,
  Target, Megaphone, LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubTile {
  title: string;
  route: string;
}

interface ModuleDashboardProps {
  title: string;
  description: string;
  subTiles: SubTile[];
  moduleCode: string;
  children?: React.ReactNode;
}

// Icon mapping based on sub-tile title or route
const subTileIconMap: Record<string, LucideIcon> = {
  // MOD-01 Stammdaten
  'profil': User,
  'firma': Building,
  'abrechnung': CreditCard,
  'sicherheit': Shield,
  
  // MOD-02 Office
  'e-mail': Mail,
  'email': Mail,
  'brief': FileText,
  'kontakte': Users,
  'kalender': Calendar,
  
  // MOD-03 DMS
  'storage': HardDrive,
  'posteingang': Inbox,
  'sortieren': SortAsc,
  'einstellungen': Settings,
  
  // MOD-04 Immobilien
  'kontexte': Layers,
  'portfolio': Briefcase,
  'sanierung': Wrench,
  'bewertung': TrendingUp,
  
  // MOD-05 MSV
  'dashboard': LayoutDashboard,
  'listen': List,
  'mieteingang': Banknote,
  'vermietung': Home,
  
  // MOD-06 Verkauf
  'objekte': Tag,
  'aktivitäten': Activity,
  'aktivitaeten': Activity,
  'anfragen': MessageSquare,
  'vorgänge': ClipboardList,
  'vorgaenge': ClipboardList,
  
  // MOD-07 Finanzierung
  'fälle': Landmark,
  'faelle': Landmark,
  'dokumente': FileText,
  'export': FileDown,
  'status': CheckCircle,
  
  // MOD-08 Investments
  'suche': Search,
  'favoriten': Heart,
  'mandat': FileSignature,
  'simulation': Calculator,
  
  // MOD-09 Vertriebspartner
  'objektkatalog': BookOpen,
  'katalog': BookOpen,
  'auswahl': CheckSquare,
  'beratung': UserPlus,
  'netzwerk': Network,
  
  // MOD-10 Leads
  'inbox': Inbox,
  'meine leads': Target,
  'meine': Target,
  'pipeline': TrendingUp,
  'werbung': Megaphone,
};

function getSubTileIcon(title: string): LucideIcon {
  const key = title.toLowerCase();
  return subTileIconMap[key] || FileText;
}

export function ModuleDashboard({ title, description, subTiles, moduleCode, children }: ModuleDashboardProps) {
  const location = useLocation();
  
  // Check if we're on a sub-route
  const isOnSubRoute = subTiles.some(st => location.pathname === st.route);
  
  // If on sub-route, just render children
  if (isOnSubRoute && children) {
    return <>{children}</>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {subTiles.map(subTile => {
          const Icon = getSubTileIcon(subTile.title);
          const isActive = location.pathname === subTile.route;
          
          return (
            <Link key={subTile.route} to={subTile.route}>
              <Card className={cn(
                'hover:shadow-md transition-shadow cursor-pointer h-full',
                isActive && 'ring-2 ring-primary'
              )}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{subTile.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {moduleCode} → {subTile.title}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}
