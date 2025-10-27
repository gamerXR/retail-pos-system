import { createContext, useContext, useState, useMemo, ReactNode } from "react";
import backend from "~backend/client";

interface AuthContextType {
  isAuthenticated: boolean;
  clientName: string | null;
  clientID: number | null;
  sessionToken: string | null;
  salespersonId: number | null;
  salespersonName: string | null;
  canProcessReturns: boolean;
  canGiveDiscounts: boolean;
  isSalesperson: boolean;
  login: (phoneNumber: string, clientName: string, clientID: number) => void;
  salespersonLogin: (
    salespersonId: number,
    clientId: number,
    name: string,
    phoneNumber: string,
    canProcessReturns: boolean,
    canGiveDiscounts: boolean,
    token: string
  ) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [clientName, setClientName] = useState<string | null>(null);
  const [clientID, setClientID] = useState<number | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [salespersonId, setSalespersonId] = useState<number | null>(null);
  const [salespersonName, setSalespersonName] = useState<string | null>(null);
  const [canProcessReturns, setCanProcessReturns] = useState(false);
  const [canGiveDiscounts, setCanGiveDiscounts] = useState(false);
  const [isSalesperson, setIsSalesperson] = useState(false);

  const login = (phoneNumber: string, name: string, id: number) => {
    setIsAuthenticated(true);
    setClientName(name);
    setClientID(id);
    setSessionToken(phoneNumber);
    setIsSalesperson(false);
    setSalespersonId(null);
    setSalespersonName(null);
    setCanProcessReturns(false);
    setCanGiveDiscounts(false);
  };

  const salespersonLogin = (
    spId: number,
    clientId: number,
    name: string,
    phoneNumber: string,
    returns: boolean,
    discounts: boolean,
    token: string
  ) => {
    setIsAuthenticated(true);
    setClientID(clientId);
    setSessionToken(token);
    setSalespersonId(spId);
    setSalespersonName(name);
    setCanProcessReturns(returns);
    setCanGiveDiscounts(discounts);
    setIsSalesperson(true);
    setClientName(null);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setClientName(null);
    setClientID(null);
    setSessionToken(null);
    setSalespersonId(null);
    setSalespersonName(null);
    setCanProcessReturns(false);
    setCanGiveDiscounts(false);
    setIsSalesperson(false);
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      clientName, 
      clientID, 
      sessionToken, 
      salespersonId,
      salespersonName,
      canProcessReturns,
      canGiveDiscounts,
      isSalesperson,
      login, 
      salespersonLogin,
      logout 
    }}>
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
