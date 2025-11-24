import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { X, Printer, Eye, Save, FileText } from "lucide-react";
import { ReceiptSettings, DEFAULT_RECEIPT_SETTINGS, generateReceiptHTML } from "@/lib/receipt";

interface CashierReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CashierReceiptModal({ isOpen, onClose }: CashierReceiptModalProps) {
  const [settings, setSettings] = useState<ReceiptSettings>(DEFAULT_RECEIPT_SETTINGS);
  const [showSizeDialog, setShowSizeDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'preview'>('settings');
  const { toast } = useToast();

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('receiptSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
      } catch (error) {
        console.error("Error loading receipt settings:", error);
      }
    }
  }, []);

  const handleSave = () => {
    try {
      // Save settings to localStorage
      localStorage.setItem('receiptSettings', JSON.stringify(settings));
      
      toast({
        title: "Settings Saved",
        description: "Cashier receipt settings have been saved successfully",
      });
      onClose();
    } catch (error) {
      console.error("Error saving receipt settings:", error);
      toast({
        title: "Error",
        description: "Failed to save receipt settings",
        variant: "destructive",
      });
    }
  };

  const handlePrintTest = () => {
    const testData = {
      receiptNumber: "TEST-001",
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      items: [
        { name: "Sample Product 1", quantity: 2, price: 15.50, total: 31.00 },
        { name: "Sample Product 2", quantity: 1, price: 25.75, total: 25.75 },
        { name: "Sample Product 3", quantity: 3, price: 8.25, total: 24.75 }
      ],
      totalQuantity: 6,
      totalAmount: 81.50,
      paymentMethod: "Cash",
      amountPaid: 100.00,
      change: 18.50,
      salesperson: "Test User"
    };

    const receiptHTML = generateReceiptHTML(testData, settings);
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Test Receipt</title>
            <style>
              body { 
                margin: 0; 
                padding: 0; 
                font-family: monospace;
              }
              @media print {
                @page {
                  size: ${settings.size === '58mm' ? '58mm auto' : '80mm auto'};
                  margin: 3mm;
                }
              }
            </style>
          </head>
          <body>
            ${receiptHTML}
            <div style="text-align: center; margin-top: 15px; font-size: 8px; color: #666;">
              *** TEST PRINT ***
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
        toast({
          title: "Test Print Sent",
          description: "Test receipt has been sent to printer",
        });
      }, 500);
    }
  };

  const updateSetting = (key: keyof ReceiptSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const generateTestReceipt = () => {
    const testData = {
      receiptNumber: "TEST-001",
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      items: [
        { name: "Sample Product 1", quantity: 2, price: 15.50, total: 31.00 },
        { name: "Sample Product 2", quantity: 1, price: 25.75, total: 25.75 },
        { name: "Sample Product 3", quantity: 3, price: 8.25, total: 24.75 }
      ],
      totalQuantity: 6,
      totalAmount: 81.50,
      paymentMethod: "Cash",
      amountPaid: 100.00,
      change: 18.50,
      salesperson: "Test User"
    };

    return generateReceiptHTML(testData, settings);
  };

  const generateReceiptPreview = () => {
    const receiptNumber = "8";
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();
    
    return `Number ${receiptNumber}
${'-'.repeat(42)}
${settings.companyName}
${settings.address}
Tel ${settings.telephone}
${'-'.repeat(42)}
${currentDate} ${currentTime}
${'-'.repeat(42)}
Product                Qty      Price    Total
${'-'.repeat(42)}
Sample Product1      13.263    150.00   $265.26
Sample Product2      15.656     20.00   $313.12
${'-'.repeat(42)}
Total QTY                              31.919
${'-'.repeat(42)}

Total Amount         $578.38

${'-'.repeat(42)}
Member name                    139****8888
Balance                              $0.00
${'-'.repeat(42)}
${settings.footer}`;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-5xl max-h-[95vh] overflow-hidden flex flex-col p-0">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-red-500" />
              Cashier Receipt Settings
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b px-6">
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'settings'
                  ? 'border-red-500 text-red-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Settings
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'preview'
                  ? 'border-red-500 text-red-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Preview
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {activeTab === 'settings' ? (
              <div className="max-w-2xl mx-auto space-y-6">
              {/* Size */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Size</label>
                <Button variant="outline" className="w-32" onClick={() => setShowSizeDialog(true)}>
                  {settings.size}
                </Button>
              </div>

              {/* Print Copies */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Print Copies</label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.printCopies}
                  onChange={(e) => updateSetting("printCopies", parseInt(e.target.value) || 1)}
                  className="w-20 text-center"
                />
              </div>

              {/* Top Logo */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Top Logo</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          updateSetting("topLogoFile", reader.result as string);
                          updateSetting("topLogo", "Custom");
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="flex-1"
                  />
                  {settings.topLogoFile && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateSetting("topLogoFile", undefined);
                        updateSetting("topLogo", "None");
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
                {settings.topLogoFile && (
                  <div className="flex justify-center">
                    <img src={settings.topLogoFile} alt="Logo preview" className="max-h-20 object-contain" />
                  </div>
                )}
              </div>

              {/* Company Name (Header) */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Company Name</label>
                <Input
                  value={settings.companyName}
                  onChange={(e) => updateSetting("companyName", e.target.value)}
                  className="w-full"
                  placeholder="Enter company name"
                />
              </div>

              {/* Address */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Address</label>
                <Textarea
                  value={settings.address}
                  onChange={(e) => updateSetting("address", e.target.value)}
                  className="w-full h-20"
                  placeholder="Enter company address"
                />
              </div>

              {/* Telephone */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Telephone Number</label>
                <Input
                  value={settings.telephone}
                  onChange={(e) => updateSetting("telephone", e.target.value)}
                  className="w-full"
                  placeholder="Enter telephone number"
                />
              </div>

              {/* Header Size */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Header Size</label>
                <Select value={settings.headerSize} onValueChange={(value: "Small" | "Medium" | "Large") => updateSetting("headerSize", value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Small">Small</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Font Size */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Font Size</label>
                <Select value={settings.fontSize} onValueChange={(value: "Small" | "Medium" | "Large") => updateSetting("fontSize", value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Small">Small</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Display Unit Price */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Display unit price</label>
                <Switch
                  checked={settings.displayUnitPrice}
                  onCheckedChange={(checked) => updateSetting("displayUnitPrice", checked)}
                  className="data-[state=checked]:bg-red-500"
                />
              </div>

              {/* Footer */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Footer</label>
                <Textarea
                  value={settings.footer}
                  onChange={(e) => updateSetting("footer", e.target.value)}
                  placeholder="Enter footer text..."
                  className="w-full h-20"
                />
              </div>

              </div>
            ) : (
              <div className="max-w-2xl mx-auto">
                <div className="bg-white border-2 border-gray-200 rounded-lg p-8 shadow-sm">
                  <div 
                    className="bg-white p-6 rounded border mx-auto"
                    style={{ 
                      width: settings.size === '58mm' ? '58mm' : '80mm',
                      fontFamily: 'monospace'
                    }}
                  >
                    <div dangerouslySetInnerHTML={{ __html: generateTestReceipt() }} />
                  </div>
                </div>
                <div className="mt-6 text-center text-sm text-gray-500">
                  This is how your receipt will look when printed
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="text-xs text-gray-600">
                <strong>Auto-applied:</strong> Settings are automatically used when printing from settlement
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handlePrintTest}
                variant="outline"
                className="px-6"
              >
                <Printer className="w-4 h-4 mr-2" />
                Test Print
              </Button>
              <Button
                onClick={() => setActiveTab('preview')}
                variant="outline"
                className="px-6"
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button
                onClick={handleSave}
                className="bg-red-500 hover:bg-red-600 text-white px-8"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSizeDialog} onOpenChange={setShowSizeDialog}>
        <DialogContent className="sm:max-w-xs p-0">
          <div className="p-4">
            <DialogTitle className="text-center mb-4">Select Size</DialogTitle>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="w-full h-12 text-lg"
                onClick={() => {
                  updateSetting("size", "58mm");
                  setShowSizeDialog(false);
                }}
              >
                58mm
              </Button>
              <Button
                variant="outline"
                className="w-full h-12 text-lg"
                onClick={() => {
                  updateSetting("size", "80mm");
                  setShowSizeDialog(false);
                }}
              >
                80mm
              </Button>
            </div>
          </div>
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full h-12 text-lg"
              onClick={() => setShowSizeDialog(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
