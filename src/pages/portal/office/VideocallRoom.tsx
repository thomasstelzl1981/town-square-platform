import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Mic, MicOff, Camera, CameraOff, MonitorUp, PhoneOff, UserPlus, Video } from 'lucide-react';
import { toast } from 'sonner';
import { VideocallBrandingPanel } from './components/VideocallBrandingPanel';

import '@livekit/components-styles';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  useTracks,
} from '@livekit/components-react';

interface VideocallRoomProps {
  guestToken?: string;
  guestRoomName?: string;
  guestLivekitUrl?: string;
}

export const VideocallRoom = ({ guestToken, guestRoomName, guestLivekitUrl }: VideocallRoomProps) => {
  const { callId } = useParams<{ callId: string }>();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [token, setToken] = useState(guestToken || '');
  const [roomName, setRoomName] = useState(guestRoomName || '');
  const [callTitle, setCallTitle] = useState('Videocall');
  const [callStatus, setCallStatus] = useState('active');
  const [livekitUrl, setLivekitUrl] = useState(guestLivekitUrl || '');
  const [loading, setLoading] = useState(!guestToken);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const isHost = !!session && !guestToken;

  useEffect(() => {
    if (guestToken) return;
    if (!callId || !session) return;

    const loadCall = async () => {
      // Load call details
      const { data: call } = await supabase
        .from('video_calls' as any)
        .select('*')
        .eq('id', callId)
        .single();

      if (!call) {
        toast.error('Call nicht gefunden');
        navigate('/portal/office/videocalls');
        return;
      }

      setCallTitle((call as any).title || 'Videocall');
      setCallStatus((call as any).status);
      setRoomName((call as any).livekit_room_name);

      // Generate fresh token (also returns livekitUrl)
      const res = await supabase.functions.invoke('sot-videocall-create', {
        body: { title: (call as any).title || 'Videocall' },
      });

      if (res.error) {
        toast.error('Token-Fehler');
        return;
      }

      setToken(res.data.hostToken);
      if (res.data.livekitUrl) setLivekitUrl(res.data.livekitUrl);
      setLoading(false);
    };

    loadCall();
  }, [callId, session, guestToken]);

  const handleInvite = async () => {
    if (!inviteEmail || !callId) return;
    setSending(true);
    try {
      const res = await supabase.functions.invoke('sot-videocall-invite-send', {
        body: { callId, inviteeEmail: inviteEmail },
      });
      if (res.error) throw res.error;
      toast.success(`Einladung an ${inviteEmail} gesendet`);
      setInviteEmail('');
      setInviteOpen(false);
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || 'Fehler beim Senden');
    } finally {
      setSending(false);
    }
  };

  const handleEndCall = async () => {
    if (!callId) return;
    try {
      await supabase.functions.invoke('sot-videocall-end', {
        body: { callId },
      });
      toast.info('Call beendet');
      navigate('/portal/office/videocalls');
    } catch {
      toast.error('Fehler beim Beenden');
    }
  };

  const handleLeave = () => {
    navigate('/portal/office/videocalls');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">Verbinde mit Videocall...</p>
        </div>
      </div>
    );
  }

  if (!token || !livekitUrl) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-3">
          <Video className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Videocall konnte nicht geladen werden</p>
          <Button variant="outline" onClick={() => navigate('/portal/office/videocalls')}>
            Zurück
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-120px)] bg-zinc-950 rounded-lg overflow-hidden">
      {/* Main Video Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/80 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <Video className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-white">{callTitle}</span>
            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 text-xs">
              Live
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {isHost && (
              <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1.5 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
                    <UserPlus className="h-3.5 w-3.5" />
                    Einladen
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Teilnehmer einladen</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <Input
                      placeholder="E-Mail-Adresse"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                    />
                    <Button onClick={handleInvite} disabled={sending || !inviteEmail} className="w-full">
                      {sending ? 'Sende...' : 'Einladung senden'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* LiveKit Room */}
        <div className="flex-1 relative">
          <LiveKitRoom
            token={token}
            serverUrl={livekitUrl}
            connect={true}
            data-lk-theme="default"
            style={{ height: '100%' }}
            onDisconnected={() => {
              toast.info('Verbindung getrennt');
            }}
          >
            <VideoConference />
            <RoomAudioRenderer />
          </LiveKitRoom>
        </div>

        {/* Bottom Controls */}
        <div className="flex items-center justify-center gap-3 py-3 bg-zinc-900/80 border-t border-zinc-800">
          <Button
            size="icon"
            variant="destructive"
            className="h-12 w-12 rounded-full"
            onClick={isHost ? handleEndCall : handleLeave}
            title={isHost ? 'Call beenden' : 'Verlassen'}
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Branding Panel - Hidden on mobile */}
      <div className="hidden lg:block w-[280px] border-l border-zinc-800">
        <VideocallBrandingPanel />
      </div>
    </div>
  );
};

export default VideocallRoom;
