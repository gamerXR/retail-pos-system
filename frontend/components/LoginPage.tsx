import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Phone, Lock, Shield } from "lucide-react";
import backend from "~backend/client";
import VirtualKeyboard from "./VirtualKeyboard";
import OpeningBalanceModal from "./OpeningBalanceModal";
import AdminLoginModal from "./AdminLoginModal";
import AdminDashboard from "./AdminDashboard";

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [activeField, setActiveField] = useState<"phoneNumber" | "password" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotMessage, setShowForgotMessage] = useState(false);
  const [showOpeningBalanceModal, setShowOpeningBalanceModal] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!phoneNumber || !password) {
      toast({
        title: "Error",
        description: "Please enter both phone number and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await backend.auth.login({
        phoneNumber,
        password
      });

      if (response.success) {
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        });
        
        setShowOpeningBalanceModal(true);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid phone number or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpeningBalanceSet = () => {
    setShowOpeningBalanceModal(false);
    onLoginSuccess();
  };

  const handleForgotPassword = () => {
    setShowForgotMessage(true);
    toast({
      title: "Forgot Password",
      description: "Please contact posx solution supplier",
    });
  };

  const handleKeyboardInput = (value: string) => {
    if (activeField === "phoneNumber") {
      setPhoneNumber(prev => prev + value);
    } else if (activeField === "password") {
      setPassword(prev => prev + value);
    }
  };

  const handleKeyboardBackspace = () => {
    if (activeField === "phoneNumber") {
      setPhoneNumber(prev => prev.slice(0, -1));
    } else if (activeField === "password") {
      setPassword(prev => prev.slice(0, -1));
    }
  };

  const handleKeyboardSpace = () => {
    if (activeField === "phoneNumber") {
      setPhoneNumber(prev => prev + " ");
    } else if (activeField === "password") {
      setPassword(prev => prev + " ");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl">😊</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-800">NexPos</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdminLoginModal(true)}
            className="bg-blue-500 text-white hover:bg-blue-600"
          >
            <Shield className="w-4 h-4 mr-2" />
            Admin
          </Button>
          <div className="flex items-center gap-2">
            <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRkY0NDQ0Ii8+CjxyZWN0IHg9IjAiIHk9IjgiIHdpZHRoPSIyNCIgaGVpZ2h0PSI4IiBmaWxsPSIjRkZGRkZGIi8+CjxyZWN0IHg9IjAiIHk9IjE2IiB3aWR0aD0iMjQiIGhlaWdodD0iOCIgZmlsbD0iIzAwNDRGRiIvPgo8L3N2Zz4K" alt="English" className="w-6 h-6" />
            <span className="text-gray-700">English</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Phone Number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                onFocus={() => setActiveField("phoneNumber")}
                className="pl-12 h-14 text-lg border-gray-300"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setActiveField("password")}
                className="pl-12 h-14 text-lg border-gray-300"
              />
            </div>
          </div>

          <div className="text-center space-y-2">
            <button 
              className="text-blue-500 hover:text-blue-600"
              onClick={handleForgotPassword}
            >
              Forgot password
            </button>
            {showForgotMessage && (
              <p className="text-xs text-gray-500">
                please contact posx solution supplier
              </p>
            )}
          </div>

          <Button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white text-lg font-medium"
          >
            {isLoading ? "..." : "Login"}
          </Button>
        </div>
      </div>

      <VirtualKeyboard
        onInput={handleKeyboardInput}
        onBackspace={handleKeyboardBackspace}
        onSpace={handleKeyboardSpace}
      />

      <OpeningBalanceModal
        isOpen={showOpeningBalanceModal}
        onClose={() => setShowOpeningBalanceModal(false)}
        onContinue={handleOpeningBalanceSet}
      />

      <AdminLoginModal
        isOpen={showAdminLoginModal}
        onClose={() => setShowAdminLoginModal(false)}
        onSuccess={() => {
          setShowAdminLoginModal(false);
          setShowAdminDashboard(true);
        }}
      />

      <AdminDashboard
        isOpen={showAdminDashboard}
        onClose={() => setShowAdminDashboard(false)}
      />
    </div>
  );
}
