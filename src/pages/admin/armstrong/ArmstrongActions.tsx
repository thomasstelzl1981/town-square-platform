/**
 * Armstrong Actions Catalog — Zone 1
 * 
 * Read-only view of the Armstrong Actions Manifest (SSOT).
 * Shows all available actions with filtering and details.
 */
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Shield,
  Database,
  Eye,
  ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";
import { 
  armstrongActions, 
  ArmstrongAction, 
} from "@/manifests/armstrongManifest";

const riskColors = {
  low: "bg-status-success/10 text-status-success",
  medium: "bg-status-warning/10 text-status-warning",
  high: "bg-status-error/10 text-status-error",
};

const costColors = {
  free: "bg-muted text-muted-foreground",
  metered: "bg-primary/10 text-primary",
  premium: "bg-status-warning/10 text-status-warning",
};

const ArmstrongActions: React.FC = () => {
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [zoneFilter, setZoneFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [selectedAction, setSelectedAction] = useState<ArmstrongAction | null>(null);

  // Get unique modules for filter
  const modules = useMemo(() => {
    const moduleSet = new Set<string>();
    armstrongActions.forEach(action => {
      if (action.module) moduleSet.add(action.module);
    });
    return ['all', ...Array.from(moduleSet).sort()];
  }, []);

  // Filter actions
  const filteredActions = useMemo(() => {
    return armstrongActions.filter(action => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        if (
          !action.action_code.toLowerCase().includes(searchLower) &&
          !action.title_de.toLowerCase().includes(searchLower) &&
          !action.description_de.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      // Module filter
      if (moduleFilter !== 'all' && action.module !== moduleFilter) {
        return false;
      }

      // Zone filter
      if (zoneFilter !== 'all' && !action.zones.includes(zoneFilter as 'Z2' | 'Z3')) {
        return false;
      }

      // Risk filter
      if (riskFilter !== 'all' && action.risk_level !== riskFilter) {
        return false;
      }

      return true;
    });
  }, [search, moduleFilter, zoneFilter, riskFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/admin/armstrong">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Actions-Katalog</h1>
          <p className="text-muted-foreground">Alle verfügbaren Armstrong-Aktionen (Read-Only)</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Suchen nach Code, Titel, Beschreibung..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Modul" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Module</SelectItem>
                {modules.filter(m => m !== 'all').map(module => (
                  <SelectItem key={module} value={module}>{module}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={zoneFilter} onValueChange={setZoneFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Zone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Zonen</SelectItem>
                <SelectItem value="Z2">Zone 2</SelectItem>
                <SelectItem value="Z3">Zone 3</SelectItem>
              </SelectContent>
            </Select>

            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Risiko" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Risiken</SelectItem>
                <SelectItem value="low">Niedrig</SelectItem>
                <SelectItem value="medium">Mittel</SelectItem>
                <SelectItem value="high">Hoch</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Actions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Aktionen</CardTitle>
              <CardDescription>
                {filteredActions.length} von {armstrongActions.length} Aktionen
              </CardDescription>
            </div>
            <Badge variant="outline">
              <Database className="h-3 w-3 mr-1" />
              SSOT: armstrongManifest.ts
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Action Code</TableHead>
                  <TableHead>Titel</TableHead>
                  <TableHead className="w-[100px]">Modul</TableHead>
                  <TableHead className="w-[80px]">Zonen</TableHead>
                  <TableHead className="w-[100px]">Risiko</TableHead>
                  <TableHead className="w-[100px]">Kosten</TableHead>
                  <TableHead className="w-[80px] text-center">Confirm</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActions.map((action) => (
                  <TableRow key={action.action_code}>
                    <TableCell className="font-mono text-xs">
                      {action.action_code}
                    </TableCell>
                    <TableCell className="font-medium">
                      {action.title_de}
                    </TableCell>
                    <TableCell>
                      {action.module ? (
                        <Badge variant="outline">{action.module}</Badge>
                      ) : (
                        <span className="text-muted-foreground">Global</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {action.zones.map(zone => (
                          <Badge key={zone} variant="secondary" className="text-xs">
                            {zone}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={riskColors[action.risk_level]}>
                        {action.risk_level === 'low' ? 'Niedrig' :
                         action.risk_level === 'medium' ? 'Mittel' : 'Hoch'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={costColors[action.cost_model]}>
                        {action.cost_model === 'free' ? 'Gratis' :
                         action.cost_model === 'metered' ? 'Metered' : 'Premium'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {action.requires_confirmation ? (
                        <Shield className="h-4 w-4 text-status-warning mx-auto" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedAction(action)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Action Detail Dialog */}
      <Dialog open={!!selectedAction} onOpenChange={() => setSelectedAction(null)}>
        <DialogContent className="max-w-2xl">
          {selectedAction && (
            <>
              <DialogHeader>
                <DialogTitle className="font-mono">{selectedAction.action_code}</DialogTitle>
                <DialogDescription>{selectedAction.title_de}</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Beschreibung</h4>
                  <p className="text-sm text-muted-foreground">{selectedAction.description_de}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Modul</h4>
                    <Badge variant="outline">{selectedAction.module || 'Global'}</Badge>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Verfügbar in</h4>
                    <div className="flex gap-1">
                      {selectedAction.zones.map(zone => (
                        <Badge key={zone} variant="secondary">{zone}</Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Risikostufe</h4>
                    <Badge className={riskColors[selectedAction.risk_level]}>
                      {selectedAction.risk_level}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Kostenmodell</h4>
                    <Badge className={costColors[selectedAction.cost_model]}>
                      {selectedAction.cost_model}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Bestätigung</h4>
                    {selectedAction.requires_confirmation ? (
                      <Badge variant="outline" className="bg-status-warning/10">
                        <Shield className="h-3 w-3 mr-1" />
                        Erforderlich
                      </Badge>
                    ) : (
                      <Badge variant="outline">Nicht erforderlich</Badge>
                    )}
                  </div>
                </div>

                {selectedAction.data_scopes_read.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Lese-Zugriff</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedAction.data_scopes_read.map(scope => (
                        <Badge key={scope} variant="secondary" className="text-xs">
                          {scope}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedAction.data_scopes_write.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Schreib-Zugriff</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedAction.data_scopes_write.map(scope => (
                        <Badge key={scope} variant="outline" className="text-xs bg-status-warning/10">
                          {scope}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium mb-1">API Contract</h4>
                  <div className="rounded-md bg-muted p-3 font-mono text-xs">
                    <p>Type: {selectedAction.api_contract.type}</p>
                    <p>Endpoint: {selectedAction.api_contract.endpoint}</p>
                  </div>
                </div>

                {selectedAction.roles_allowed.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Erlaubte Rollen</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedAction.roles_allowed.map(role => (
                        <Badge key={role} variant="outline" className="text-xs">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ArmstrongActions;
