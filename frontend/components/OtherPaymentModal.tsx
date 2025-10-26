import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, Check } from "lucide-react";

interface PaymentOption {
  id: string;
  name: string;
  enabled: boolean;
}

interface OtherPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (paymentMethod: string) => void;
  paymentOptions: PaymentOption[];
}

export default function OtherPaymentModal({ 
  isOpen, 
  onClose, 
  onSelect, 
  paymentOptions 
}: OtherPaymentModalProps) {
  const [selectedPayment, setSelectedPayment] = useState<string>("");

  const enabledOptions = paymentOptions.filter(option => option.enabled);

  const handleSelect = (paymentId: string, paymentName: string) => {
    setSelectedPayment(paymentId);
    onSelect(paymentName);
    onClose();
  };

  const handleCancel = () => {
    setSelectedPayment("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              Select Payment Method
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800">Other Payment Options</h3>
            <p className="text-sm text-gray-500 mt-1">Choose a payment method</p>
          </div>

          {/* Payment Options */}
          <div className="space-y-2">
            {enabledOptions.length > 0 ? (
              enabledOptions.map((option) => (
                <button
                  key={option.id}
                  className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => handleSelect(option.id, option.name)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <span className="text-orange-600 text-lg">
                        {option.id === "qr-code" ? "📱" : "💳"}
                      </span>
                    </div>
                    <span className="font-medium text-gray-800">{option.name}</span>
                  </div>
                  {selectedPayment === option.id && (
                    <Check className="w-5 h-5 text-green-600" />
                  )}
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No payment methods available</p>
                <p className="text-sm mt-2">Configure payment options in settings</p>
              </div>
            )}
          </div>

          {/* Cancel Button */}
          <div className="border-t pt-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
