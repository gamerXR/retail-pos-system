import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Phone, Lock, Key, Clock, AlertTriangle } from "lucide-react";
import backend from "~backend/client";
import type { LoginResponse } from "~backend/auth/login";
import VirtualKeyboard from "./VirtualKeyboard";
import OpeningBalanceModal from "./OpeningBalanceModal";

interface LoginPageProps {
  onLoginSuccess: (userType: "licensed" | "trial") => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [licenseKey, setLicenseKey] = useState("");
  const [activeField, setActiveField] = useState<"phone" | "password" | "license" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotMessage, setShowForgotMessage] = useState(false);
  const [showOpeningBalanceModal, setShowOpeningBalanceModal] = useState(false);
  const [loginResponse, setLoginResponse] = useState<LoginResponse | null>(null);
  const [trialTimeRemaining, setTrialTimeRemaining] = useState<number | null>(null);
  const [hasLoadedStoredData, setHasLoadedStoredData] = useState(false);
  const [deviceId] = useState(() => {
    // Generate or retrieve device ID
    let id = localStorage.getItem('deviceId');
    if (!id) {
      id = 'device-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
      localStorage.setItem('deviceId', id);
    }
    return id;
  });
  const { toast } = useToast();

  // Load stored license info on component mount (only once)
  useEffect(() => {
    if (!hasLoadedStoredData) {
      const storedLicenseKey = localStorage.getItem('licenseKey');
      const storedPhoneId = localStorage.getItem('phoneId');
      if (storedLicenseKey && storedPhoneId) {
        setLicenseKey(storedLicenseKey);
        setPhoneNumber(storedPhoneId);
        toast({
          title: "Welcome Back!",
          description: "Your license details have been pre-filled.",
        });
      }
      setHasLoadedStoredData(true);
    }
  }, [toast, hasLoadedStoredData]);

  // Check trial status on component mount
  useEffect(() => {
    checkTrialStatus();
  }, []);

  // Update trial timer every minute
  useEffect(() => {
    if (loginResponse?.userType === "trial" && trialTimeRemaining !== null) {
      const interval = setInterval(() => {
        checkTrialStatus();
      }, 60000); // Check every minute

      return () => clearInterval(interval);
    }
  }, [loginResponse, trialTimeRemaining]);

  const checkTrialStatus = async () => {
    try {
      const response = await backend.auth.checkTrial({ deviceId });
      if (response.isActive && response.timeRemaining) {
        setTrialTimeRemaining(response.timeRemaining);
        if (response.timeRemaining <= 5) {
          toast({
            title: "Trial Ending Soon",
            description: `Only ${response.timeRemaining} minutes remaining. Please contact administrator for a license.`,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      // Trial not found or expired
    }
  };

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
        password,
        licenseKey: licenseKey || undefined,
        deviceId
      });

      if (response.success) {
        setLoginResponse(response);
        
        if (response.userType === "trial") {
          setTrialTimeRemaining(response.trialTimeRemaining || null);
          toast({
            title: "Trial Access Granted",
            description: `You have ${response.trialTimeRemaining} minutes of trial access remaining.`,
          });
        } else if (response.userType === "licensed") {
          // Store license info on successful licensed login
          localStorage.setItem('licenseKey', licenseKey);
          localStorage.setItem('phoneId', phoneNumber);
          
          if (response.isFirstLogin) {
            toast({
              title: "Welcome New User!",
              description: `Welcome ${response.licenseInfo?.clientName}! Your system has been set up with a clean slate. You can now add your own categories and products.`,
            });
          } else {
            toast({
              title: "Licensed Access",
              description: `Welcome back ${response.licenseInfo?.clientName}! Full access granted.`,
            });
          }
        }

        // Show opening balance modal
        setShowOpeningBalanceModal(true);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials or license",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpeningBalanceSet = () => {
    setShowOpeningBalanceModal(false);
    if (loginResponse) {
      onLoginSuccess(loginResponse.userType);
    }
  };

  const handleForgotPassword = () => {
    setShowForgotMessage(true);
    toast({
      title: "Forgot Password",
      description: "Please contact posx solution supplier",
    });
  };

  const handleKeyboardInput = (value: string) => {
    if (activeField === "phone") {
      setPhoneNumber(prev => prev + value);
    } else if (activeField === "password") {
      setPassword(prev => prev + value);
    } else if (activeField === "license") {
      setLicenseKey(prev => prev + value);
    }
  };

  const handleKeyboardBackspace = () => {
    if (activeField === "phone") {
      setPhoneNumber(prev => prev.slice(0, -1));
    } else if (activeField === "password") {
      setPassword(prev => prev.slice(0, -1));
    } else if (activeField === "license") {
      setLicenseKey(prev => prev.slice(0, -1));
    }
  };

  const handleKeyboardSpace = () => {
    if (activeField === "phone") {
      setPhoneNumber(prev => prev + " ");
    } else if (activeField === "password") {
      setPassword(prev => prev + " ");
    } else if (activeField === "license") {
      setLicenseKey(prev => prev + " ");
    }
  };

  const formatTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl">😊</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-800">NexPos</h1>
        </div>
        <div className="flex items-center gap-2">
          <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRkY0NDQ0Ii8+CjxyZWN0IHg9IjAiIHk9IjgiIHdpZHRoPSIyNCIgaGVpZ2h0PSI4IiBmaWxsPSIjRkZGRkZGIi8+CjxyZWN0IHg9IjAiIHk9IjE2IiB3aWR0aD0iMjQiIGhlaWdodD0iOCIgZmlsbD0iIzAwNDRGRiIvPgo8L3N2Zz4K" alt="English" className="w-6 h-6" />
          <span className="text-gray-700">English</span>
        </div>
      </div>

      {/* Trial Status Banner */}
      {trialTimeRemaining !== null && (
        <div className={`p-3 text-center text-white ${
          trialTimeRemaining <= 5 ? 'bg-red-500' : trialTimeRemaining <= 15 ? 'bg-orange-500' : 'bg-blue-500'
        }`}>
          <div className="flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="font-medium">
              Trial Mode - {formatTime(trialTimeRemaining)} remaining
            </span>
            {trialTimeRemaining <= 5 && <AlertTriangle className="w-4 h-4" />}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          {/* License Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-800 mb-2">Registration Required</h3>
            <p className="text-sm text-yellow-700 mb-3">
              This is an unregistered copy. Enter your license key for full access, or continue with 30-minute trial.
            </p>
            <div className="space-y-2 text-xs text-yellow-600">
              <p>• Trial users: Limited to 30 minutes per session</p>
              <p>• Licensed users: Full unlimited access</p>
              <p>• Contact administrator for license key</p>
              <p>• New licensed users start with a clean system</p>
            </div>
          </div>

          {/* Login Form */}
          <div className="space-y-4">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Phone No."
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                onFocus={() => setActiveField("phone")}
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
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="License Key (Optional - for full access)"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                onFocus={() => setActiveField("license")}
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

          <div className="flex gap-3">
            <Button
              onClick={handleLogin}
              disabled={isLoading}
              className="flex-1 h-12 bg-blue-500 hover:bg-blue-600 text-white text-lg font-medium"
            >
              {isLoading ? "..." : licenseKey ? "Login (Licensed)" : "Start Trial"}
            </Button>
            {!licenseKey && (
              <Button
                variant="outline"
                className="h-12 px-6 text-lg"
                onClick={() => {
                  toast({
                    title: "License Required",
                    description: "Contact administrator for license key to get full access",
                  });
                }}
              >
                Get License
              </Button>
            )}
          </div>

          {/* Device ID Display */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Device ID: {deviceId.slice(-8)}
            </p>
          </div>
        </div>
      </div>

      {/* Virtual Keyboard */}
      <VirtualKeyboard
        onInput={handleKeyboardInput}
        onBackspace={handleKeyboardBackspace}
        onSpace={handleKeyboardSpace}
      />

      {/* Opening Balance Modal */}
      <OpeningBalanceModal
        isOpen={showOpeningBalanceModal}
        onClose={() => setShowOpeningBalanceModal(false)}
        onContinue={handleOpeningBalanceSet}
      />
    </div>
  );
}
