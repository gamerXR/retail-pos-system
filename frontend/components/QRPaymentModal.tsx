import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, CheckCircle2 } from "lucide-react";

interface QRPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  totalAmount: number;
}

export default function QRPaymentModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  totalAmount 
}: QRPaymentModalProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirmPayment = () => {
    setIsConfirming(true);
    setTimeout(() => {
      onConfirm();
      setIsConfirming(false);
    }, 500);
  };

  const handleCancel = () => {
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
              QR Code Payment
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              ${totalAmount.toFixed(2)}
            </h3>
            <p className="text-sm text-gray-500">Scan QR code to pay</p>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-lg p-6 flex flex-col items-center">
            <div className="bg-gray-100 w-64 h-64 rounded-lg flex items-center justify-center mb-4">
              <img 
                src="/qr-payment.png" 
                alt="Payment QR Code"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div class="text-center p-4">
                        <div class="text-6xl mb-4">📱</div>
                        <p class="text-sm text-gray-500">Upload QR code to<br/>/frontend/public/qr-payment.png</p>
                      </div>
                    `;
                  }
                }}
              />
            </div>
            
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">DING!</p>
              <p className="text-xs text-gray-500 mt-1">Scan with your banking app</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 text-center">
              <strong>Instructions:</strong>
              <br />
              1. Open your banking app (BIBD QuickPay, Baiduri, etc.)
              <br />
              2. Scan the QR code above
              <br />
              3. Confirm payment of <strong>${totalAmount.toFixed(2)}</strong>
              <br />
              4. Click "Confirm Payment" below after paying
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={handleConfirmPayment}
              disabled={isConfirming}
            >
              {isConfirming ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2 animate-pulse" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirm Payment
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-gray-500">
            Only click "Confirm Payment" after you have successfully completed the payment
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
