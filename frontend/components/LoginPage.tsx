import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Phone, Lock, Shield } from "lucide-react";
import { useAuth } from "../lib/auth";
import backend from "~backend/client";
import OpeningBalanceModal from "./OpeningBalanceModal";
import AdminLoginModal from "./AdminLoginModal";
import AdminDashboard from "./AdminDashboard";

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotMessage, setShowForgotMessage] = useState(false);
  const [showLoginError, setShowLoginError] = useState(false);
  const [showOpeningBalanceModal, setShowOpeningBalanceModal] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const { toast } = useToast();
  const { login, salespersonLogin } = useAuth();

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
      try {
        const response = await backend.auth.login({
          phoneNumber,
          password
        });

        if (response.success) {
          login(phoneNumber, response.clientName, response.clientID);
          
          toast({
            title: "Login Successful",
            description: `Welcome back, ${response.clientName}!`,
          });
          
          setShowOpeningBalanceModal(true);
          return;
        }
      } catch (clientError) {
        try {
          const salespersonResponse = await backend.auth.salespersonLogin({
            phoneNumber,
            password
          });

          salespersonLogin(
            salespersonResponse.salespersonId,
            salespersonResponse.clientId,
            salespersonResponse.name,
            salespersonResponse.phoneNumber,
            salespersonResponse.canProcessReturns,
            salespersonResponse.canGiveDiscounts,
            salespersonResponse.token
          );
          
          toast({
            title: "Login Successful",
            description: `Welcome, ${salespersonResponse.name}!`,
          });
          
          setShowOpeningBalanceModal(true);
          return;
        } catch (salespersonError) {
          throw clientError;
        }
      }
    } catch (error: any) {
      console.error("Login error:", error);
      setShowLoginError(true);
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white shadow-sm p-4 flex items-center justify-end">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdminLoginModal(true)}
            className="text-white hover:opacity-90"
            style={{ backgroundColor: 'hsl(163.1, 88.1%, 19.8%)' }}
          >
            <Shield className="w-4 h-4 mr-2" />
            Admin
          </Button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="flex justify-center mb-8">
            <img src="/nexpos-logo.png.jpg" alt="NX Your NexPos Logo" className="h-40 w-auto" />
          </div>
          <div className="space-y-4">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Phone Number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
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
            {showLoginError && (
              <p className="text-xs text-red-500">
                Either wrong password or invalid phone number
              </p>
            )}
          </div>

          <Button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full h-12 text-white text-lg font-medium hover:opacity-90"
            style={{ backgroundColor: 'hsl(163.1, 88.1%, 19.8%)' }}
          >
            {isLoading ? "..." : "Login"}
          </Button>
        </div>
      </div>

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
