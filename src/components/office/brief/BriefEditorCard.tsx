/**
 * R-9: Subject + Prompt + Generated body editor (Steps 2-4)
 */
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2 } from 'lucide-react';
import { DictationButton } from '@/components/shared/DictationButton';

interface BriefEditorCardProps {
  subject: string;
  setSubject: (v: string) => void;
  prompt: string;
  setPrompt: (v: string) => void;
  generatedBody: string;
  setGeneratedBody: (v: string) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  canGenerate: boolean;
}

export function BriefEditorCard({
  subject, setSubject,
  prompt, setPrompt,
  generatedBody, setGeneratedBody,
  isGenerating, onGenerate, canGenerate,
}: BriefEditorCardProps) {
  return (
    <>
      {/* Step 2: Subject */}
      <Card className="glass-card">
        <CardContent className="p-5 space-y-3">
          <Label className="flex items-center gap-2">
            <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">2</Badge>
            Betreff
          </Label>
          <Input placeholder="z.B. Mieterhöhung zum 01.04.2026" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </CardContent>
      </Card>

      {/* Step 3: Prompt + Generate */}
      <Card className="glass-card">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-1">
            <Label className="flex items-center gap-2">
              <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">3</Badge>
              Anliegen beschreiben
            </Label>
            <DictationButton onTranscript={(text) => setPrompt(prompt + ' ' + text)} />
          </div>
          <Textarea
            placeholder="Schreiben Sie einen formellen Brief zur Ankündigung einer Mieterhöhung von 5% gemäß Mietspiegel..."
            value={prompt} onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[120px]"
          />
          <Button onClick={onGenerate} disabled={isGenerating || !canGenerate} className="w-full gap-2">
            {isGenerating ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Brief wird generiert...</>
            ) : (
              <><Sparkles className="h-4 w-4" />Brief generieren</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Step 4: Edit generated letter */}
      <Card className="glass-card">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-1">
            <Label className="flex items-center gap-2">
              <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">4</Badge>
              Brief bearbeiten
            </Label>
            <DictationButton onTranscript={(text) => setGeneratedBody(generatedBody + ' ' + text)} />
          </div>
          <Textarea
            placeholder="Der generierte Brief erscheint hier..."
            value={generatedBody} onChange={(e) => setGeneratedBody(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
          />
        </CardContent>
      </Card>
    </>
  );
}
