import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, Phone, Mail, MapPin } from "lucide-react";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              About
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex justify-center">
            <img 
              src="/nexpos-logo.png.jpg" 
              alt="NexPos Logo" 
              className="h-32 object-contain"
            />
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">NexPos</h2>
            <p className="text-sm text-gray-600 mb-4">Your Professional POS Solution</p>
            <div className="inline-block bg-gray-100 px-4 py-2 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Version 1.0.0.0</span>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">System Information</h3>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 font-medium mb-2">Developed by</p>
                <p className="text-blue-900 font-semibold">Mhk.</p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800 font-medium mb-2">Main Supplier</p>
                <p className="text-green-900 font-semibold">Posx Solution Co</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Phone Support</p>
                  <a 
                    href="tel:+6738184877" 
                    className="text-sm font-semibold text-gray-800 hover:text-green-600"
                  >
                    +673 818 4877
                  </a>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-orange-800 mb-1">Office Location</p>
                    <p className="text-sm text-orange-700">
                      Unit 4, First Floor, Jin Pg Babu Raja<br />
                      Kg Kiarong, Brunei Darussalam
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center pt-4 pb-2">
            <p className="text-xs text-gray-500">
              For any further queries, please contact us
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
