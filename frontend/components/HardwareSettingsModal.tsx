import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { 
  ChevronLeft, 
  ChevronRight,
  Printer, 
  Receipt, 
  Tag, 
  QrCode, 
  Scale, 
  CreditCard, 
  Monitor, 
  Settings
} from "lucide-react";
import CashierReceiptModal from "./CashierReceiptModal";
import LabelPrintingModal from "./LabelPrintingModal";

interface HardwareSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HardwareSettingsModal({ isOpen, onClose }: HardwareSettingsModalProps) {
  const [showCashierReceipt, setShowCashierReceipt] = useState(false);
  const [showLabelPrinting, setShowLabelPrinting] = useState(false);
  const { toast } = useToast();

  const handleMenuAction = (action: string) => {
    if (action === "Cashier Receipts") {
      setShowCashierReceipt(true);
      return;
    }
    
    if (action === "Printers") {
      setShowLabelPrinting(true);
      return;
    }
    
    toast({
      title: "Feature",
      description: `${action} functionality will be implemented soon`,
    });
  };

  const hardwareItems = [
    {
      icon: Printer,
      label: "Printers",
      action: "Printers",
      color: "bg-blue-500"
    },
    {
      icon: Receipt,
      label: "Cashier Receipts",
      action: "Cashier Receipts",
      color: "bg-green-500"
    },
    {
      icon: Tag,
      label: "Tag Receipts",
      action: "Tag Receipts",
      color: "bg-purple-500"
    },
    {
      icon: QrCode,
      label: "Barcode Receipt",
      action: "Barcode Receipt",
      color: "bg-orange-500"
    },
    {
      icon: Scale,
      label: "Weighing Scale",
      action: "Weighing Scale",
      color: "bg-yellow-500"
    },
    {
      icon: CreditCard,
      label: "Card Reader",
      action: "Card Reader",
      color: "bg-red-500"
    },
    {
      icon: Monitor,
      label: "Dual Screen",
      action: "Dual Screen",
      color: "bg-indigo-500"
    },
    {
      icon: Settings,
      label: "Customer Display Settings",
      action: "Customer Display Settings",
      color: "bg-gray-500"
    }
  ];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                Hardware Settings
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              {hardwareItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Button
                    key={item.action}
                    variant="ghost"
                    className="h-20 flex items-center justify-between p-4 border border-gray-200 hover:bg-gray-50"
                    onClick={() => handleMenuAction(item.action)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 ${item.color} rounded-lg flex items-center justify-center`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-gray-800 font-medium text-lg">{item.label}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </Button>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CashierReceiptModal
        isOpen={showCashierReceipt}
        onClose={() => setShowCashierReceipt(false)}
      />

      <LabelPrintingModal
        isOpen={showLabelPrinting}
        onClose={() => setShowLabelPrinting(false)}
      />
    </>
  );
}
