import { useState, useEffect } from "react";
import { AuthProvider } from "./lib/auth";
import LoginPage from "./components/LoginPage";
import SalesPage from "./components/SalesPage";

export type AppPage = "login" | "sales";

export default function App() {
  useEffect(() => {
    const link = document.querySelector("link[rel='manifest']");
    if (!link) {
      const manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      manifestLink.href = '/manifest.json';
      document.head.appendChild(manifestLink);
    }

    let appleTouchIcon = document.querySelector("link[rel='apple-touch-icon']");
    if (!appleTouchIcon) {
      appleTouchIcon = document.createElement('link');
      appleTouchIcon.setAttribute('rel', 'apple-touch-icon');
      appleTouchIcon.setAttribute('href', '/nexpos-logo.png.jpg');
      document.head.appendChild(appleTouchIcon);
    }

    let themeColor = document.querySelector("meta[name='theme-color']");
    if (!themeColor) {
      themeColor = document.createElement('meta');
      themeColor.setAttribute('name', 'theme-color');
      themeColor.setAttribute('content', '#0d5446');
      document.head.appendChild(themeColor);
    }

    let appleCapable = document.querySelector("meta[name='apple-mobile-web-app-capable']");
    if (!appleCapable) {
      appleCapable = document.createElement('meta');
      appleCapable.setAttribute('name', 'apple-mobile-web-app-capable');
      appleCapable.setAttribute('content', 'yes');
      document.head.appendChild(appleCapable);
    }

    let appleStatusBar = document.querySelector("meta[name='apple-mobile-web-app-status-bar-style']");
    if (!appleStatusBar) {
      appleStatusBar = document.createElement('meta');
      appleStatusBar.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
      appleStatusBar.setAttribute('content', 'black-translucent');
      document.head.appendChild(appleStatusBar);
    }

    let appleTitle = document.querySelector("meta[name='apple-mobile-web-app-title']");
    if (!appleTitle) {
      appleTitle = document.createElement('meta');
      appleTitle.setAttribute('name', 'apple-mobile-web-app-title');
      appleTitle.setAttribute('content', 'NexPos');
      document.head.appendChild(appleTitle);
    }

    document.title = 'NexPos - Your POS Solution';

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then((registration) => {
            console.log('ServiceWorker registered:', registration);
          })
          .catch((error) => {
            console.log('ServiceWorker registration failed:', error);
          });
      });
    }
  }, []);

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
