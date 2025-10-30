import { useState, lazy, Suspense } from "react";
import { AuthProvider } from "./lib/auth";
import LoginPage from "./components/LoginPage";

const SalesPage = lazy(() => import("./components/SalesPage"));

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
        return (
          <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading POS...</p>
              </div>
            </div>
          }>
            <SalesPage onLogout={handleLogout} userType={null} />
          </Suspense>
        );
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
