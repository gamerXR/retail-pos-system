import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { ChevronLeft, Printer } from "lucide-react";

interface CashierReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ReceiptSettings {
  size: "58mm" | "80mm";
  printCopies: number;
  topLogo: string;
  title: string;
  header: string;
  headerSize: "Small" | "Medium" | "Large";
  fontSize: "Small" | "Medium" | "Large";
  displayUnitPrice: boolean;
  footer: string;
}

export default function CashierReceiptModal({ isOpen, onClose }: CashierReceiptModalProps) {
  const [settings, setSettings] = useState<ReceiptSettings>({
    size: "80mm",
    printCopies: 1,
    topLogo: "None",
    title: "shop",
    header: "POSX SOLUTION",
    headerSize: "Large",
    fontSize: "Small",
    displayUnitPrice: true,
    footer: "Thank You & Come Again!"
  });
  const [showSizeDialog, setShowSizeDialog] = useState(false);
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
    const testReceiptContent = generateTestReceipt();
    
    // Print the test receipt
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
            ${testReceiptContent}
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
    const receiptNumber = "TEST-001";
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();
    
    let content = `
      <div style="font-family: monospace; font-size: ${settings.fontSize === 'Small' ? '12px' : settings.fontSize === 'Medium' ? '14px' : '16px'}; line-height: 1.2; width: ${settings.size === '58mm' ? '56mm' : '76mm'}; margin: 0 auto; word-break: break-word;">
    `;

    // Header
    if (settings.header) {
      content += `
        <div style="text-align: center; margin-bottom: 10px; font-size: ${settings.headerSize === 'Small' ? '14px' : settings.headerSize === 'Medium' ? '18px' : '22px'}; font-weight: bold;">
          ${settings.header}
        </div>
      `;
    }

    // Store info
    content += `
      <div style="text-align: center; margin-bottom: 10px; font-size: 10px;">
        Unit 4, First Floor, Jin Pg Babu Raja, Kg<br>
        Kiarong, Brunei Darussalam<br>
        Tel +673 818 4877
      </div>
    `;

    // Separator
    content += `<div style="border-top: 1px dashed #000; margin: 10px 0;"></div>`;

    // Date and time
    content += `
      <div style="text-align: center; margin-bottom: 10px;">
        Receipt #${receiptNumber}<br>
        ${currentDate} ${currentTime}
      </div>
    `;

    // Separator
    content += `<div style="border-top: 1px dashed #000; margin: 10px 0;"></div>`;

    // Items header
    if (settings.displayUnitPrice) {
      content += `
        <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 5px;">
          <span>Item</span>
          <span>Qty</span>
          <span>Price</span>
          <span>Total</span>
        </div>
      `;
    } else {
      content += `
        <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 5px;">
          <span>Item</span>
          <span>Qty</span>
          <span>Total</span>
        </div>
      `;
    }

    // Separator
    content += `<div style="border-top: 1px dashed #000; margin: 5px 0;"></div>`;

    // Sample items
    const sampleItems = [
      { name: "Sample Product 1 with a very long name to test wrapping", qty: 2, price: 15.50, total: 31.00 },
      { name: "Sample Product 2", qty: 1, price: 25.75, total: 25.75 },
      { name: "Sample Product 3", qty: 3, price: 8.25, total: 24.75 }
    ];

    sampleItems.forEach(item => {
      if (settings.displayUnitPrice) {
        content += `
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3px; font-size: 11px;">
            <span style="flex: 1; word-break: break-word;">${item.name}</span>
            <span style="width: 30px; text-align: center; flex-shrink: 0; margin-left: 5px;">${item.qty}</span>
            <span style="width: 45px; text-align: right; flex-shrink: 0; margin-left: 5px;">$${item.price.toFixed(2)}</span>
            <span style="width: 45px; text-align: right; flex-shrink: 0; margin-left: 5px;">$${item.total.toFixed(2)}</span>
          </div>
        `;
      } else {
        content += `
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3px; font-size: 11px;">
            <span style="flex: 1; word-break: break-word;">${item.name}</span>
            <span style="width: 30px; text-align: center; flex-shrink: 0; margin-left: 5px;">${item.qty}</span>
            <span style="width: 60px; text-align: right; flex-shrink: 0; margin-left: 5px;">$${item.total.toFixed(2)}</span>
          </div>
        `;
      }
    });

    // Separator
    content += `<div style="border-top: 1px dashed #000; margin: 10px 0;"></div>`;

    // Totals
    const totalQty = sampleItems.reduce((sum, item) => sum + item.qty, 0);
    const totalAmount = sampleItems.reduce((sum, item) => sum + item.total, 0);

    content += `
      <div style="margin-bottom: 5px;">
        <div style="display: flex; justify-content: space-between;">
          <span>Total QTY</span>
          <span>${totalQty}</span>
        </div>
      </div>
      <div style="border-top: 1px dashed #000; margin: 10px 0;"></div>
      <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-bottom: 10px;">
        <span>Total Amount</span>
        <span>$${totalAmount.toFixed(2)}</span>
      </div>
    `;

    // Payment info
    content += `
      <div style="margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between;">
          <span>Payment Method</span>
          <span>Cash</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Paid</span>
          <span>$${(totalAmount + 5).toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Change</span>
          <span>$5.00</span>
        </div>
      </div>
    `;

    // Separator
    content += `<div style="border-top: 1px dashed #000; margin: 10px 0;"></div>`;

    // Footer
    if (settings.footer) {
      content += `
        <div style="text-align: center; margin-top: 10px; font-size: 10px;">
          ${settings.footer}
        </div>
      `;
    }

    // Test print indicator
    content += `
      <div style="text-align: center; margin-top: 15px; font-size: 8px; color: #666;">
        *** TEST PRINT ***
      </div>
    `;

    content += `</div>`;
    
    return content;
  };

  const generateReceiptPreview = () => {
    const receiptNumber = "8";
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();
    
    return `Number ${receiptNumber}
${'-'.repeat(42)}
${settings.header}
Unit 4, First Floor, Jin Pg Babu Raja, Kg
Kiarong, Brunei Darussalam
Tel +673 818 4877
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
        <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                Cashier Receipts
              </DialogTitle>
              <Button onClick={handleSave} className="bg-red-500 hover:bg-red-600 text-white">
                Save
              </Button>
            </div>
          </DialogHeader>

          <div className="flex gap-6">
            {/* Left Side - Receipt Preview */}
            <div className="w-1/2">
              <div className="bg-white border border-gray-300 rounded-lg p-4">
                <div className="bg-gray-50 p-4 rounded border">
                  <pre className="text-xs font-mono whitespace-pre-wrap leading-tight">
                    {generateReceiptPreview()}
                  </pre>
                </div>
              </div>
            </div>

            {/* Right Side - Settings */}
            <div className="w-1/2 space-y-6">
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
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Top Logo</label>
                <Select value={settings.topLogo} onValueChange={(value) => updateSetting("topLogo", value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="None">None</SelectItem>
                    <SelectItem value="Logo1">Logo 1</SelectItem>
                    <SelectItem value="Logo2">Logo 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Title</label>
                <Input
                  value={settings.title}
                  onChange={(e) => updateSetting("title", e.target.value)}
                  className="w-32"
                />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Header</label>
                <Input
                  value={settings.header}
                  onChange={(e) => updateSetting("header", e.target.value)}
                  className="w-48"
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

              {/* Print Test Button */}
              <div className="pt-4">
                <Button
                  onClick={handlePrintTest}
                  variant="outline"
                  className="w-full"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Test
                </Button>
              </div>

              {/* Settings Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm text-blue-700">
                  <strong>Note:</strong> These settings will be automatically applied when printing receipts from the settlement screen. Changes are saved locally on this device.
                </div>
              </div>
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
