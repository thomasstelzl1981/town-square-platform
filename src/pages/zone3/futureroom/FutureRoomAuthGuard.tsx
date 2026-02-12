/**
 * FutureRoomAuthGuard — Protects /akte routes for FutureRoom customers
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface Props {
  children: React.ReactNode;
}

export default function FutureRoomAuthGuard({ children }: Props) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session?.user) {
        navigate('/website/futureroom/login');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session?.user) {
        navigate('/website/futureroom/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: 'hsl(165 70% 36%)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
