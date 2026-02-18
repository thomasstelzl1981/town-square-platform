/**
 * useZ3Auth — Eigenständiges Auth-System für Zone 3 (Lennox & Friends)
 * Komplett getrennt von supabase.auth / Portal-Sessions.
 * Session wird in localStorage unter 'lennox_session' gespeichert.
 */
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'lennox_session';
const FUNC_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sot-z3-auth`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export interface Z3User {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
}

interface StoredSession {
  token: string;
  customer: Z3User;
}

async function callAuth(action: string, payload: Record<string, unknown> = {}) {
  const res = await fetch(FUNC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: ANON_KEY },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Auth-Fehler');
  return data;
}

function getStored(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function setStored(session: StoredSession | null) {
  if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  else localStorage.removeItem(STORAGE_KEY);
}

export function useZ3Auth() {
  const [z3User, setZ3User] = useState<Z3User | null>(null);
  const [loading, setLoading] = useState(true);

  // Validate session on mount
  useEffect(() => {
    const stored = getStored();
    if (!stored) { setLoading(false); return; }

    callAuth('validate', { session_token: stored.token })
      .then(res => {
        if (res.valid && res.customer) {
          const session = { token: stored.token, customer: res.customer };
          setStored(session);
          setZ3User(res.customer);
        } else {
          setStored(null);
        }
      })
      .catch(() => setStored(null))
      .finally(() => setLoading(false));
  }, []);

  const z3Login = useCallback(async (email: string, password: string) => {
    const res = await callAuth('login', { email, password });
    const session: StoredSession = { token: res.session_token, customer: res.customer };
    setStored(session);
    setZ3User(res.customer);
    return res.customer;
  }, []);

  const z3Signup = useCallback(async (email: string, password: string, firstName: string, lastName: string) => {
    const res = await callAuth('signup', { email, password, firstName, lastName });
    const session: StoredSession = { token: res.session_token, customer: res.customer };
    setStored(session);
    setZ3User(res.customer);
    return res.customer;
  }, []);

  const z3Logout = useCallback(async () => {
    const stored = getStored();
    if (stored) {
      await callAuth('logout', { session_token: stored.token }).catch(() => {});
    }
    setStored(null);
    setZ3User(null);
  }, []);

  const z3SessionToken = getStored()?.token || null;

  return { z3User, z3Loading: loading, z3Login, z3Signup, z3Logout, z3SessionToken };
}
