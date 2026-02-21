import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { VideocallBrandingPanel } from './components/VideocallBrandingPanel';
import { VideocallRoom } from './VideocallRoom';

type JoinState = 'loading' | 'ready' | 'joining' | 'joined' | 'error';

const VideocallJoinPage = () => {
  const { inviteId } = useParams<{ inviteId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('t') || '';

  const [state, setState] = useState<JoinState>('loading');
  const [error, setError] = useState('');
  const [callData, setCallData] = useState<{
    callId: string;
    roomName: string;
    guestToken: string;
    hostName: string;
    callTitle: string;
    livekitUrl: string;
  } | null>(null);

  useEffect(() => {
    if (!inviteId || !token) {
      setState('error');
      setError('Ungültiger Einladungslink');
      return;
    }
    setState('ready');
  }, [inviteId, token]);

  const handleJoin = async () => {
    setState('joining');
    try {
      const res = await supabase.functions.invoke('sot-videocall-invite-validate', {
        body: { inviteId, token },
      });
      if (res.error) throw new Error(res.error.message || 'Validierung fehlgeschlagen');
      if (res.data?.error) throw new Error(res.data.error);
      setCallData(res.data);
      setState('joined');
    } catch (err: unknown) {
      setState('error');
      const msg = (err instanceof Error ? err.message : String(err)) || 'Fehler';
      if (msg.includes('expired')) setError('Diese Einladung ist abgelaufen.');
      else if (msg.includes('Invalid token')) setError('Ungültiger Token.');
      else if (msg.includes('revoked')) setError('Diese Einladung wurde widerrufen.');
      else setError(msg);
    }
  };

  if (state === 'joined' && callData) {
    return (
      <div className="h-screen">
        <VideocallRoom
          guestToken={callData.guestToken}
          guestRoomName={callData.roomName}
          guestLivekitUrl={callData.livekitUrl}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo & Branding */}
        <div className="text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Video className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white">Videocall beitreten</h1>
          <p className="text-zinc-400 text-sm">
            System of a Town — Videokonferenz
          </p>
        </div>

        {/* State Card */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 space-y-4">
          {state === 'loading' && (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          )}

          {state === 'ready' && (
            <>
              <div className="flex items-center gap-3 text-zinc-300">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm">Einladung gültig — bereit zum Beitritt</span>
              </div>
              <Button
                onClick={handleJoin}
                className="w-full h-12 text-base gap-2"
                size="lg"
              >
                <Video className="h-5 w-5" />
                Beitreten
              </Button>
              <p className="text-xs text-zinc-500 text-center">
                Kamera und Mikrofon werden angefragt
              </p>
            </>
          )}

          {state === 'joining' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <span className="text-sm text-zinc-400">Validiere Einladung...</span>
            </div>
          )}

          {state === 'error' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-red-400">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">{error}</span>
              </div>
              <p className="text-xs text-zinc-500">
                Bitte kontaktieren Sie den Einladenden für einen neuen Link.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-zinc-600">
          Powered by System of a Town
        </p>
      </div>
    </div>
  );
};

export default VideocallJoinPage;
