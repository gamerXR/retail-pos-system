import { useState } from "react";
import backend from "../client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Camera, X } from "lucide-react";

interface LoginPageProps {
  onLogin: (token: string, client: any) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await backend.auth.clientLogin({
        phoneNumber,
        password
      });

      onLogin(response.token, response.client);
      toast({
        title: "Login successful",
        description: `Welcome back, ${response.client.clientName}!`
      });
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.message || "Invalid phone number or password";
      setError(errorMessage);
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-400 via-cyan-300 to-teal-300 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-600">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-600/50 rounded-full border-2 border-slate-500">
                <Camera className="w-10 h-10 text-cyan-300" strokeWidth={1.5} />
              </div>
            </div>
            <h1 className="text-white text-lg font-light tracking-widest uppercase mb-1">User Login</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">📧</span>
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Phone Number"
                  required
                  className="w-full h-11 pl-10 pr-4 bg-transparent border-b-2 border-slate-500 rounded-none focus:border-cyan-400 focus:ring-0 text-white placeholder:text-slate-400 text-sm"
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔒</span>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full h-11 pl-10 pr-4 bg-transparent border-b-2 border-slate-500 rounded-none focus:border-cyan-400 focus:ring-0 text-white placeholder:text-slate-400 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-2">
              <label className="flex items-center text-slate-300 cursor-pointer">
                <input type="checkbox" className="mr-2 rounded border-slate-500" />
                Remember me
              </label>
              <button type="button" className="text-cyan-300 hover:text-cyan-200 transition-colors">
                Forgot Password?
              </button>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-slate-900 hover:bg-slate-950 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 mt-6 uppercase tracking-wider text-sm"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : "Login"}
            </Button>
          </form>

          {error && (
            <div className="mt-4 bg-red-500/20 border border-red-500/50 rounded-lg p-3 flex items-start gap-2">
              <span className="text-red-300 text-sm flex-1">{error}</span>
              <button onClick={() => setError("")} className="text-red-300 hover:text-red-200">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-slate-400 text-xs">
              Need help? <span className="text-cyan-300 font-medium cursor-pointer hover:underline">Contact your administrator</span>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-slate-700 text-xs font-medium">© 2025 NexPOS. All rights reserved.</p>
        </div>

        <div className="mt-4 text-center">
          <div className="inline-flex gap-2 text-slate-700">
            <div className="text-2xl font-bold">NexPOS Reports</div>
          </div>
          <p className="text-slate-600 text-sm mt-1">Client Analytics Portal</p>
        </div>
      </div>
    </div>
  );
}
