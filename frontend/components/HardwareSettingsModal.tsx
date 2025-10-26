import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Printer } from "lucide-react";
import LabelPrintingModal from "./LabelPrintingModal";

interface HardwareSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HardwareSettingsModal({ isOpen, onClose }: HardwareSettingsModalProps) {
  const [showLabelPrinting, setShowLabelPrinting] = useState(false);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl">
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
            <Button
              variant="ghost"
              className="w-full h-20 flex items-center justify-between p-4 border border-gray-200 hover:bg-gray-50"
              onClick={() => setShowLabelPrinting(true)}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Printer className="w-6 h-6 text-white" />
                </div>
                <span className="text-gray-800 font-medium text-lg">Printers</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <LabelPrintingModal
        isOpen={showLabelPrinting}
        onClose={() => setShowLabelPrinting(false)}
      />
    </>
  );
}
