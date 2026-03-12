import React, { createContext, useContext, useState, useEffect } from 'react';

// SupabaseUser-compatible shape for existing component compatibility
export interface User {
  id: string;
  email: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

// Use proxy or direct URL for API calls
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAdmin: false,
    loading: true,
  });

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('satyakavach_token');
      if (!token) {
        setState((s) => ({ ...s, loading: false }));
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const { user } = await res.json();
          setState({
            user,
            isAdmin: user.role === 'admin' || user.email === import.meta.env.VITE_ADMIN_EMAIL,
            loading: false
          });
        } else {
          localStorage.removeItem('satyakavach_token');
          setState({ user: null, isAdmin: false, loading: false });
        }
      } catch (err) {
        localStorage.removeItem('satyakavach_token');
        setState({ user: null, isAdmin: false, loading: false });
      }
    };

    initAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to sign in');
    }

    localStorage.setItem('satyakavach_token', data.token);
    setState({
      user: data.user,
      isAdmin: data.user.role === 'admin' || data.user.email === import.meta.env.VITE_ADMIN_EMAIL,
      loading: false
    });
  };

  const signUp = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to sign up');
    }
    
    // Auto login
    localStorage.setItem('satyakavach_token', data.token);
    setState({
      user: data.user,
      isAdmin: data.user.role === 'admin' || data.user.email === import.meta.env.VITE_ADMIN_EMAIL,
      loading: false
    });
  };

  const signOut = async () => {
    localStorage.removeItem('satyakavach_token');
    setState({ user: null, isAdmin: false, loading: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

