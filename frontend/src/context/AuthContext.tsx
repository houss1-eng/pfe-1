import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface JwtPayload {
  id: string;
  role: 'chef' | 'client' | 'designer' | 'developer';
  exp: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'chef' | 'client' | 'designer' | 'developer';
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => false,
  logout: () => {},
  refreshUser: async () => {},
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const setAuthHeader = useCallback((tok: string | null) => {
    if (tok) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${tok}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('proflow_token');
    if (stored) {
      try {
        const decoded = jwtDecode<JwtPayload>(stored);
        if (decoded.exp * 1000 > Date.now()) {
          setToken(stored);
          setAuthHeader(stored);
          axios.get(`${API_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${stored}` },
          })
            .then((res: { data: User }) => setUser(res.data))
            .catch(() => {
              localStorage.removeItem('proflow_token');
              setToken(null);
              setAuthHeader(null);
            })
            .finally(() => setLoading(false));
          return;
        }
      } catch {
        localStorage.removeItem('proflow_token');
      }
    }
    setLoading(false);
  }, [setAuthHeader]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      const { token: tok, user: userData } = res.data;
      localStorage.setItem('proflow_token', tok);
      setToken(tok);
      setUser(userData);
      setAuthHeader(tok);
      return true;
    } catch {
      return false;
    }
  }, [setAuthHeader]);

  const logout = useCallback(() => {
    localStorage.removeItem('proflow_token');
    setToken(null);
    setUser(null);
    setAuthHeader(null);
  }, [setAuthHeader]);

  const refreshUser = useCallback(async () => {
    const tok = localStorage.getItem('proflow_token');
    if (!tok) return;
    try {
      const res = await axios.get<User>(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      setUser(res.data);
    } catch {}
  }, []);

  const value = useMemo(() => ({
    user,
    token,
    loading,
    login,
    logout,
    refreshUser,
    isAuthenticated: !!token && !!user,
  }), [user, token, loading, login, logout, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
