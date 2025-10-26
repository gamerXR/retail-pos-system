import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import backend from "~backend/client";

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
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { clientID } = useAuth();

  useEffect(() => {
    const fetchQRCode = async () => {
      if (!isOpen || !clientID) return;
      
      setIsLoading(true);
      try {
        const response = await backend.auth.getQRCode({ id: clientID });
        setQrCodeImage(response.qrCodeImage);
      } catch (error) {
        console.error("Error fetching QR code:", error);
        setQrCodeImage(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQRCode();
  }, [isOpen, clientID]);

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
              {isLoading ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                  <p className="text-sm text-gray-500">Loading QR code...</p>
                </div>
              ) : qrCodeImage ? (
                <img 
                  src={qrCodeImage} 
                  alt="Payment QR Code"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center p-4">
                  <div className="text-6xl mb-4">📱</div>
                  <p className="text-sm text-gray-500">
                    No QR code uploaded yet
                    <br />
                    Contact admin to upload QR code
                  </p>
                </div>
              )}
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
