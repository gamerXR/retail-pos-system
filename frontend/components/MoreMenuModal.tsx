import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { 
  Briefcase, 
  RotateCcw, 
  FileText, 
  Undo2, 
  DollarSign, 
  RefreshCw, 
  Power, 
  MessageSquare, 
  Users, 
  Send 
} from "lucide-react";
import { openCashDrawer } from "../lib/hardware";

interface MoreMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
  onShiftReport?: () => void;
  onReprint?: () => void;
  onReturn?: () => void;
  onSalesperson?: () => void;
}

export default function MoreMenuModal({ 
  isOpen, 
  onClose, 
  onLogout, 
  onShiftReport, 
  onReprint, 
  onReturn,
  onSalesperson 
}: MoreMenuModalProps) {
  const { toast } = useToast();

  const handleCashBox = async () => {
    try {
      await openCashDrawer();
      toast({
        title: "Cash Drawer",
        description: "Cash drawer opened successfully",
      });
    } catch (error) {
      console.error("Error opening cash drawer:", error);
      toast({
        title: "Error",
        description: "Failed to open cash drawer. Please check printer connection.",
        variant: "destructive",
      });
    }
    onClose();
  };

  const handleShift = () => {
    if (onShiftReport) {
      onShiftReport();
    } else {
      toast({
        title: "Shift Management",
        description: "Opening day closing report...",
      });
    }
    onClose();
  };

  const handleReprint = () => {
    if (onReprint) {
      onReprint();
    } else {
      toast({
        title: "Reprint Receipt",
        description: "Opening receipt reprint with date filter...",
      });
    }
    onClose();
  };

  const handleReturn = () => {
    if (onReturn) {
      onReturn();
    } else {
      toast({
        title: "Return Items",
        description: "Opening return management...",
      });
    }
    onClose();
  };

  const handleSalesperson = () => {
    if (onSalesperson) {
      onSalesperson();
    } else {
      toast({
        title: "Salesperson",
        description: "Opening salesperson management...",
      });
    }
    onClose();
  };

  const handleQuit = () => {
    if (onLogout) {
      toast({
        title: "Logging Out",
        description: "Returning to login page...",
      });
      
      onClose();
      onLogout();
    } else {
      toast({
        title: "Quit",
        description: "Quit functionality will be implemented soon",
      });
      onClose();
    }
  };

  const handleMenuAction = (action: string) => {
    toast({
      title: "Feature",
      description: `${action} functionality will be implemented soon`,
    });
    onClose();
  };

  const menuItems = [
    {
      icon: Briefcase,
      label: "CashBox",
      action: "cashbox",
      description: "Open cash drawer",
      handler: handleCashBox
    },
    {
      icon: RotateCcw,
      label: "Shift",
      action: "shift",
      description: "Day closing report",
      handler: handleShift
    },
    {
      icon: FileText,
      label: "Reprint",
      action: "reprint",
      description: "Reprint receipt with date filter",
      handler: handleReprint
    },
    {
      icon: Undo2,
      label: "Return",
      action: "return",
      description: "Return items from receipt",
      handler: handleReturn
    },
    {
      icon: DollarSign,
      label: "Cashflow",
      action: "Cashflow",
      description: "View cash flow reports",
      handler: () => handleMenuAction("Cashflow")
    },
    {
      icon: RefreshCw,
      label: "Sync",
      action: "Sync",
      description: "Synchronize data with server",
      handler: () => handleMenuAction("Sync")
    },
    {
      icon: Power,
      label: "Quit",
      action: "Quit",
      description: "Logout and return to login page",
      handler: handleQuit
    },
    {
      icon: MessageSquare,
      label: "Feedback",
      action: "Feedback",
      description: "Send feedback to support",
      handler: () => handleMenuAction("Feedback")
    },
    {
      icon: Users,
      label: "Salesperson",
      action: "Salesperson",
      description: "Manage salespersons",
      handler: handleSalesperson
    },
    {
      icon: Send,
      label: "Send logs",
      action: "Send logs",
      description: "Send diagnostic logs",
      handler: () => handleMenuAction("Send logs")
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800">
            More Options
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-4">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Button
                key={item.action}
                variant="outline"
                className="h-16 flex items-center justify-start gap-4 p-4 hover:bg-gray-50 border border-gray-200"
                onClick={item.handler}
              >
                <IconComponent className="w-6 h-6 text-gray-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-800">{item.label}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
              </Button>
            );
          })}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
