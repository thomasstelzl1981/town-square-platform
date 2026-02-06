import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DoorOpen, Grid3X3, Square, Bath, Utensils, Bed, Sofa, 
  LayoutGrid, Pencil, Bot
} from 'lucide-react';

export interface Room {
  name: string;
  area_sqm: number;
  doors: number;
  windows: number;
  fixtures?: string[];
}

export interface RoomAnalysis {
  rooms: Room[];
  total_area_sqm: number;
  total_doors: number;
  total_windows: number;
  condition_notes?: string[];
  recommendations?: string[];
}

interface RoomAnalysisDisplayProps {
  analysis: RoomAnalysis;
  onEdit?: () => void;
}

const ROOM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'Bad': Bath,
  'Badezimmer': Bath,
  'Küche': Utensils,
  'Schlafzimmer': Bed,
  'Wohnzimmer': Sofa,
  'Flur': LayoutGrid,
};

export function RoomAnalysisDisplay({ analysis, onEdit }: RoomAnalysisDisplayProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            KI-Analyse der Wohnung
          </CardTitle>
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Pencil className="h-3 w-3 mr-1" />
              Korrigieren
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Room Table */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Raum</th>
                <th className="text-right p-3 font-medium">Fläche</th>
                <th className="text-right p-3 font-medium">Türen</th>
                <th className="text-right p-3 font-medium">Fenster</th>
                <th className="text-left p-3 font-medium">Besonderheiten</th>
              </tr>
            </thead>
            <tbody>
              {analysis.rooms.map((room, index) => {
                const RoomIcon = ROOM_ICONS[room.name] || Grid3X3;
                return (
                  <tr key={index} className="border-t">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <RoomIcon className="h-4 w-4 text-muted-foreground" />
                        {room.name}
                      </div>
                    </td>
                    <td className="text-right p-3">
                      {room.area_sqm.toLocaleString('de-DE', { minimumFractionDigits: 1 })} m²
                    </td>
                    <td className="text-right p-3">{room.doors}</td>
                    <td className="text-right p-3">{room.windows}</td>
                    <td className="p-3">
                      {room.fixtures?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {room.fixtures.map((fixture, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {fixture}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {/* Total Row */}
              <tr className="border-t bg-muted/30 font-medium">
                <td className="p-3">GESAMT</td>
                <td className="text-right p-3">
                  {analysis.total_area_sqm.toLocaleString('de-DE', { minimumFractionDigits: 1 })} m²
                </td>
                <td className="text-right p-3">{analysis.total_doors}</td>
                <td className="text-right p-3">{analysis.total_windows}</td>
                <td className="p-3"></td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Condition Notes */}
        {analysis.condition_notes && analysis.condition_notes.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Zustandsanalyse (aus Fotos)</h4>
            <div className="space-y-1">
              {analysis.condition_notes.map((note, i) => {
                // Parse severity from note (🔴, 🟡, 🟢)
                const isRed = note.startsWith('🔴');
                const isYellow = note.startsWith('🟡');
                
                return (
                  <div 
                    key={i} 
                    className={`
                      text-sm p-2 rounded-md
                      ${isRed ? 'bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300' : ''}
                      ${isYellow ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300' : ''}
                      ${!isRed && !isYellow ? 'bg-muted text-muted-foreground' : ''}
                    `}
                  >
                    {note}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Recommendations */}
        {analysis.recommendations && analysis.recommendations.length > 0 && (
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
            <h4 className="text-sm font-medium mb-2">Empfehlung</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {analysis.recommendations.map((rec, i) => (
                <li key={i}>• {rec}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
