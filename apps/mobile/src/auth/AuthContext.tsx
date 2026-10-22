import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ApiError, setAuthToken, setUnauthorizedHandler } from '../api/client';
import * as authApi from '../api/auth';
import type { SessionPayload } from '../api/auth';
import type { SessionUser } from '../types/session';
import { clearSession, loadSession, saveSession, saveUser } from './storage';
import { clearQueries } from '../api/queryStore';

export type AuthStatus = 'restoring' | 'signedOut' | 'signedIn';

interface AuthValue {
  status: AuthStatus;
  user: SessionUser | null;
  /** true si la sesión se cerró sola (token vencido o cerrado desde otro dispositivo) */
  sessionExpired: boolean;
  signIn: (session: SessionPayload) => Promise<void>;
  signOut: () => Promise<void>;
  /** Vuelve a pedir el perfil a la API */
  refreshUser: () => Promise<void>;
  updateUser: (patch: Partial<SessionUser>) => void;
}

const AuthContext = createContext<AuthValue | null>(null);

function userOf(session: SessionPayload): SessionUser {
  const user: SessionUser & { token?: string; isNew?: boolean } = { ...session };
  delete user.token;
  delete user.isNew;
  return user;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('restoring');
  const [user, setUser] = useState<SessionUser | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const dropSession = useCallback(async (expired: boolean) => {
    setAuthToken(null);
    clearQueries();
    await clearSession();
    setUser(null);
    setSessionExpired(expired);
    setStatus('signedOut');
  }, []);

  // Restaura la sesión guardada al abrir la app
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await loadSession();
      if (cancelled) return;
      if (!stored) {
        setStatus('signedOut');
        return;
      }
      setAuthToken(stored.token);
      try {
        const fresh = await authApi.fetchMe();
        if (cancelled) return;
        setUser(fresh);
        void saveUser(fresh);
        setStatus('signedIn');
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && (error.status === 401 || error.status === 403 || error.status === 404)) {
          await dropSession(error.status === 401);
        } else if (stored.user) {
          // Sin conexión: se entra con los datos guardados y se actualizan cuando vuelva la red
          setUser(stored.user);
          setStatus('signedIn');
        } else {
          await dropSession(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dropSession]);

  // Cualquier 401 en una petición autenticada cierra la sesión
  useEffect(() => {
    setUnauthorizedHandler(() => void dropSession(true));
    return () => setUnauthorizedHandler(null);
  }, [dropSession]);

  const signIn = useCallback(async (session: SessionPayload) => {
    const nextUser = userOf(session);
    clearQueries();
    setAuthToken(session.token);
    await saveSession(session.token, nextUser);
    setUser(nextUser);
    setSessionExpired(false);
    setStatus('signedIn');
  }, []);

  const signOut = useCallback(async () => {
    // Avisa a la API para invalidar el token; si no hay red, igual se cierra en el teléfono
    await authApi.logout().catch(() => undefined);
    await dropSession(false);
  }, [dropSession]);

  const refreshUser = useCallback(async () => {
    const fresh = await authApi.fetchMe();
    setUser(fresh);
    void saveUser(fresh);
  }, []);

  const updateUser = useCallback((patch: Partial<SessionUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      void saveUser(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ status, user, sessionExpired, signIn, signOut, refreshUser, updateUser }),
    [status, user, sessionExpired, signIn, signOut, refreshUser, updateUser]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

/** Nombre para mostrar: apodo o nombre */
export const displayName = (user: SessionUser | null | undefined) => user?.nickname || user?.name || 'Pana';
export const fullName = (user: SessionUser | null | undefined) =>
  [user?.name, user?.lastName].filter(Boolean).join(' ') || 'Pana';
