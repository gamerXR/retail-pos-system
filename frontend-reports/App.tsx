import { useState, useEffect } from "react";
import { LoginPage } from "./components/LoginPage";
import { Dashboard } from "./components/Dashboard";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [clientData, setClientData] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("client_token");
    const client = localStorage.getItem("client_data");
    if (token && client) {
      setIsAuthenticated(true);
      setClientData(JSON.parse(client));
    }
  }, []);

  const handleLogin = (token: string, client: any) => {
    localStorage.setItem("client_token", token);
    localStorage.setItem("client_data", JSON.stringify(client));
    setIsAuthenticated(true);
    setClientData(client);
  };

  const handleLogout = () => {
    localStorage.removeItem("client_token");
    localStorage.removeItem("client_data");
    setIsAuthenticated(false);
    setClientData(null);
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <Dashboard clientData={clientData} onLogout={handleLogout} />;
}
