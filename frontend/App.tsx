import { useState } from "react";
import { AuthProvider } from "./lib/auth";
import LoginPage from "./components/LoginPage";
import SalesPage from "./components/SalesPage";

export type AppPage = "login" | "sales";

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

function AppInner() {
  const [currentPage, setCurrentPage] = useState<AppPage>("login");

  const handleLoginSuccess = () => {
    setCurrentPage("sales");
  };

  const handleLogout = () => {
    setCurrentPage("login");
  };

  const renderPage = () => {
    switch (currentPage) {
      case "login":
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
      case "sales":
        return <SalesPage onLogout={handleLogout} userType={null} />;
      default:
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {renderPage()}
    </div>
  );
}
