import { useState } from "react";
import LoginPage from "./components/LoginPage";
import SalesPage from "./components/SalesPage";

export type AppPage = "login" | "sales";

export default function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>("login");
  const [userType, setUserType] = useState<"licensed" | "trial" | null>(null);

  const handleLoginSuccess = (type: "licensed" | "trial") => {
    setUserType(type);
    setCurrentPage("sales");
  };

  const handleLogout = () => {
    setUserType(null);
    // Clear ALL stored data on logout
    localStorage.removeItem('licenseKey');
    localStorage.removeItem('phoneId');
    localStorage.removeItem('userSession');
    localStorage.removeItem('currentUser');
    setCurrentPage("login");
  };

  const renderPage = () => {
    switch (currentPage) {
      case "login":
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
      case "sales":
        return <SalesPage onLogout={handleLogout} userType={userType} />;
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
