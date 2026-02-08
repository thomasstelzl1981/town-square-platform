/**
 * Armstrong Knowledge Base — Zone 1 Admin
 * 
 * Kuratierte Wissensdatenbank für deutsche Immobilienthemen.
 * Kategorien: Steuern, Mietrecht, Finanzierung, ESG
 */
import { BookOpen, Plus, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const KNOWLEDGE_CATEGORIES = [
  { id: 'steuern', label: 'Steuern', count: 0, color: 'bg-blue-500' },
  { id: 'mietrecht', label: 'Mietrecht', count: 0, color: 'bg-green-500' },
  { id: 'finanzierung', label: 'Finanzierung', count: 0, color: 'bg-purple-500' },
  { id: 'esg', label: 'ESG', count: 0, color: 'bg-amber-500' },
];

export default function ArmstrongKnowledge() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Knowledge Base
          </h1>
          <p className="text-muted-foreground mt-1">
            Kuratierte Wissensdatenbank für deutsche Immobilienthemen
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Eintrag hinzufügen
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Wissensdatenbank durchsuchen..." className="pl-10" />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Categories Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {KNOWLEDGE_CATEGORIES.map((category) => (
          <Card key={category.id} className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className={`h-3 w-3 rounded-full ${category.color}`} />
                <Badge variant="secondary">{category.count} Einträge</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg">{category.label}</CardTitle>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Placeholder Content */}
      <Card>
        <CardHeader>
          <CardTitle>Wissensbeiträge</CardTitle>
          <CardDescription>
            Hier werden kuratierte Einträge zu Immobilienthemen verwaltet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">Noch keine Einträge vorhanden</h3>
            <p className="text-muted-foreground mt-1 max-w-md">
              Erstellen Sie den ersten Wissenseintrag, um Armstrong mit 
              domänenspezifischem Wissen zu erweitern.
            </p>
            <Button className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Ersten Eintrag erstellen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
