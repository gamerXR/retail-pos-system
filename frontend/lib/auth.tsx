import { createContext, useContext, useState, useMemo, ReactNode } from "react";
import backend from "~backend/client";

interface AuthContextType {
  isAuthenticated: boolean;
  clientName: string | null;
  clientID: number | null;
  sessionToken: string | null;
  login: (phoneNumber: string, clientName: string, clientID: number) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [clientName, setClientName] = useState<string | null>(null);
  const [clientID, setClientID] = useState<number | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  const login = (phoneNumber: string, name: string, id: number) => {
    setIsAuthenticated(true);
    setClientName(name);
    setClientID(id);
    setSessionToken(phoneNumber);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setClientName(null);
    setClientID(null);
    setSessionToken(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, clientName, clientID, sessionToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useBackend() {
  const { sessionToken, isAuthenticated } = useAuth();
  return useMemo(() => {
    if (!isAuthenticated || !sessionToken) return backend;
    return backend.with({auth: {authorization: `Bearer ${sessionToken}`}});
  }, [isAuthenticated, sessionToken]);
}
