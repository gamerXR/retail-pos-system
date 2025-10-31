import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "../lib/auth";
import NumericKeypad from "./NumericKeypad";
import { openCashDrawer } from "../lib/hardware";

interface OpeningBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}

export default function OpeningBalanceModal({ isOpen, onClose, onContinue }: OpeningBalanceModalProps) {
  const [amount, setAmount] = useState("0");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const backend = useBackend();

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
      // Set opening balance first
      await backend.pos.setOpeningBalance({ amount: numericAmount });
      
      toast({
        title: "Success",
        description: "Opening balance set successfully",
      });

      // Try to open cash drawer, but don't block login if it fails
      try {
        await openCashDrawer();
        toast({
          title: "Cash Drawer",
          description: "Cash drawer opened successfully",
        });
      } catch (drawerError) {
        console.error("Cash drawer error:", drawerError);
        // Show a warning but don't prevent login
        toast({
          title: "Cash Drawer Warning",
          description: "Opening balance set, but cash drawer could not be opened. Please check printer connection.",
          variant: "destructive",
        });
      }
      
      // Continue with login regardless of cash drawer status
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

  const handleCancel = () => {
    setAmount("0");
    onClose();
  };

  const handleSkip = () => {
    // Allow skipping opening balance and continue to main app
    toast({
      title: "Opening Balance Skipped",
      description: "You can set the opening balance later from the settings",
    });
    onContinue();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-semibold text-gray-800">
            Opening Balance
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-3 text-center">
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

          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1 h-12 text-lg"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-12 text-lg"
              onClick={handleSkip}
              disabled={isLoading}
            >
              Skip
            </Button>
            <Button
              onClick={handleSetBalance}
              disabled={isLoading}
              className="flex-1 h-12 text-lg text-white hover:opacity-90"
              style={{ backgroundColor: 'hsl(163.1, 88.1%, 19.8%)' }}
            >
              {isLoading ? "..." : "Enter"}
            </Button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700 text-center">
              <strong>Note:</strong> The system will attempt to open the cash drawer automatically. If no printer is connected, you can still continue.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
