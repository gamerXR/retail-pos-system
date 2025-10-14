import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "../lib/auth";
import NumericKeypad from "./NumericKeypad";

interface OpeningBalancePageProps {
  onContinue: () => void;
}

export default function OpeningBalancePage({ onContinue }: OpeningBalancePageProps) {
  const [amount, setAmount] = useState("0");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const backend = useBackend();

  const openCashDrawer = async () => {
    try {
      // Simulate cash drawer opening command
      // In a real implementation, this would send a command to the cash drawer hardware
      toast({
        title: "Cash Drawer",
        description: "Opening cash drawer...",
      });
      
      // Simulate the hardware response delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Cash Drawer Opened",
        description: "Cash drawer has been opened successfully",
      });
    } catch (error) {
      console.error("Error opening cash drawer:", error);
      toast({
        title: "Warning",
        description: "Could not open cash drawer automatically",
        variant: "destructive",
      });
    }
  };

  const handleSetBalance = async () => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await backend.pos.setOpeningBalance({ amount: numericAmount });
      
      // Automatically open cash drawer after setting opening balance
      await openCashDrawer();
      
      toast({
        title: "Success",
        description: "Opening balance set successfully",
      });
      onContinue();
    } catch (error) {
      console.error("Error setting opening balance:", error);
      toast({
        title: "Error",
        description: "Failed to set opening balance",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeypadInput = (value: string) => {
    if (value === "Back") {
      setAmount(prev => prev.length > 1 ? prev.slice(0, -1) : "0");
    } else if (value === ".") {
      if (!amount.includes(".")) {
        setAmount(prev => prev + value);
      }
    } else {
      setAmount(prev => prev === "0" ? value : prev + value);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl">😊</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-800">Halo</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Opening Balance
          </h2>
          
          <div className="mb-6">
            <label className="block text-lg font-medium text-gray-700 mb-3">
              Amount
            </label>
            <Input
              type="text"
              value={amount}
              readOnly
              className="h-14 text-2xl text-center font-semibold border-2 border-gray-300"
            />
          </div>

          <NumericKeypad onInput={handleKeypadInput} />

          <div className="flex gap-4 mt-6">
            <Button
              variant="outline"
              className="flex-1 h-12 text-lg"
              onClick={() => setAmount("0")}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSetBalance}
              disabled={isLoading}
              className="flex-1 h-12 text-lg bg-red-500 hover:bg-red-600 text-white"
            >
              {isLoading ? "..." : "Enter"}
            </Button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-6">
            <p className="text-sm text-blue-700 text-center">
              <strong>Note:</strong> Cash drawer will automatically open after setting the opening balance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
