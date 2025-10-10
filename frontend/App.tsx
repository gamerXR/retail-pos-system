import { useState } from "react";
import LoginPage from "./components/LoginPage";
import SalesPage from "./components/SalesPage";

export type AppPage = "login" | "sales";

export default function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>("login");

  const handleLoginSuccess = () => {
    setCurrentPage("sales");
  };

  const handleLogout = () => {
    localStorage.removeItem('userSession');
    localStorage.removeItem('currentUser');
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
