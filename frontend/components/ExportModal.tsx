import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Usb, Mail } from "lucide-react";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (method: "usb" | "email") => void;
}

export default function ExportModal({ isOpen, onClose, onConfirm }: ExportModalProps) {
  const handleUSBExport = () => {
    onConfirm("usb");
  };

  const handleEmailExport = () => {
    onConfirm("email");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold text-gray-800">
            Select
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-6">
          <Button
            variant="outline"
            className="w-full h-16 flex items-center justify-center gap-4 text-lg hover:bg-gray-50 border-2"
            onClick={handleUSBExport}
          >
            <Usb className="w-6 h-6 text-blue-600" />
            <span>Please Insert USB Flash...</span>
          </Button>

          <Button
            variant="outline"
            className="w-full h-16 flex items-center justify-center gap-4 text-lg hover:bg-gray-50 border-2"
            onClick={handleEmailExport}
          >
            <Mail className="w-6 h-6 text-green-600" />
            <span>Email</span>
          </Button>

          <Button
            variant="outline"
            className="w-full h-12 text-gray-600 hover:bg-gray-50"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
