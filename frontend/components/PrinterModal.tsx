import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { ChevronLeft, Wifi, Usb, Bluetooth, RefreshCw } from "lucide-react";
import type { ConnectedPrinter } from "../lib/hardware";

interface PrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getPaperSize = (): "58mm" | "80mm" => {
  const savedSettings = localStorage.getItem('receiptSettings');
  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings);
      return parsed.size === "58mm" ? "58mm" : "80mm";
    } catch {
      return "80mm";
    }
  }
  return "80mm";
};

export default function PrinterModal({ isOpen, onClose }: PrinterModalProps) {
  const [connectedPrinters, setConnectedPrinters] = useState<ConnectedPrinter[]>([]);
  const [selectedPrinterId, setSelectedPrinterId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      const savedPrinter = localStorage.getItem('selectedPrinter');
      if (savedPrinter) {
        setSelectedPrinterId(JSON.parse(savedPrinter).id);
      }
      detectInstalledPrinters();
    }
  }, [isOpen]);

  const detectInstalledPrinters = async () => {
    setIsRefreshing(true);
    try {
      const detectedPrinters: ConnectedPrinter[] = [];
      
      if ('usb' in navigator) {
        const devices = await (navigator as any).usb.getDevices();
        devices.forEach((device: any, index: number) => {
          detectedPrinters.push({
            id: `usb-${device.vendorId}-${device.productId}`,
            name: device.productName || `USB Printer ${index + 1}`,
            connectionType: "usb",
            address: `USB:${device.vendorId.toString(16).padStart(4, '0')}:${device.productId.toString(16).padStart(4, '0')}`,
            status: "ready"
          });
        });
      }

      setConnectedPrinters(detectedPrinters);

      if (detectedPrinters.length === 0) {
        toast({
          title: "No Permitted Printers",
          description: "No previously permitted USB printers found. Please connect a new one.",
        });
      } else {
        toast({
          title: "Printers Detected",
          description: `Found ${detectedPrinters.length} permitted printer(s).`,
        });
      }
    } catch (error) {
      console.error("Error detecting printers:", error);
      toast({
        title: "Detection Error",
        description: "Failed to detect printers. Ensure your browser supports WebUSB.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRequestUSBPermission = async () => {
    try {
      // Class 7 is for printers
      const device = await (navigator as any).usb.requestDevice({ filters: [{ classCode: 7 }] });
      if (device) {
        toast({ 
          title: "Permission Granted", 
          description: `Connected to ${device.productName}. This printer will auto-connect on future logins.` 
        });
        await detectInstalledPrinters();
      }
    } catch (error) {
      console.error("Error requesting USB device:", error);
      toast({ 
        title: "Permission Denied", 
        description: "Could not get permission for USB device.", 
        variant: "destructive" 
      });
    }
  };

  const handlePrinterSelect = (printer: ConnectedPrinter) => {
    setSelectedPrinterId(printer.id);
    localStorage.setItem('selectedPrinter', JSON.stringify(printer));
    toast({
      title: "Printer Selected",
      description: `${printer.name} has been set as the active printer and will auto-connect on future logins`,
    });
  };

  const handleTestPrint = () => {
    const printer = connectedPrinters.find(p => p.id === selectedPrinterId);
    if (!printer) {
      toast({
        title: "Error",
        description: "Please select a printer first",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Test Print",
      description: `Sending test print to ${printer.name}...`,
    });
    
    const paperSize = getPaperSize();
    const printWidth = paperSize === '58mm' ? '56mm' : '76mm';

    const testContent = `
      <div style="font-family: monospace; font-size: 12px; line-height: 1.2; width: ${printWidth}; word-break: break-word;">
        <div style="text-align: center; margin-bottom: 10px;">
          <strong>PRINTER TEST</strong><br>
          ${new Date().toLocaleString()}
        </div>
        <div style="border-top: 1px dashed #000; margin: 10px 0;"></div>
        <div>Printer: ${printer.name}</div>
        <div>Connection: ${printer.connectionType.toUpperCase()}</div>
        <div>Address: ${printer.address}</div>
        <div style="border-top: 1px dashed #000; margin: 10px 0;"></div>
        <div style="text-align: center;">
          Test print successful!<br>
          Auto-connect enabled
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Printer Test</title>
            <style>
              body { margin: 0; padding: 0; }
              @media print {
                @page {
                  size: ${paperSize} auto;
                  margin: 3mm;
                }
              }
            </style>
          </head>
          <body>
            ${testContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
        toast({
          title: "Test Print Sent",
          description: `Test receipt sent to ${printer.name} successfully`,
        });
      }, 500);
    }
  };

  const getConnectionIcon = (type: "usb" | "ip" | "bluetooth") => {
    switch (type) {
      case "usb":
        return <Usb className="w-5 h-5 text-blue-600" />;
      case "ip":
        return <Wifi className="w-5 h-5 text-green-600" />;
      case "bluetooth":
        return <Bluetooth className="w-5 h-5 text-purple-600" />;
      default:
        return <Usb className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: "ready" | "busy" | "error") => {
    switch (status) {
      case "ready":
        return "text-green-600 bg-green-100";
      case "busy":
        return "text-orange-600 bg-orange-100";
      case "error":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              Printers
            </DialogTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={handleTestPrint}
                disabled={!selectedPrinterId}
              >
                Test Print
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="font-medium text-blue-800 mb-2">Connect a New Printer</h4>
            <p className="text-sm text-blue-700 mb-3">
              To use a USB printer for silent printing and cash drawer control, you need to connect it here first to grant permission. 
              Once connected, it will automatically reconnect on future logins.
            </p>
            <Button onClick={handleRequestUSBPermission} disabled={isRefreshing}>
              <Usb className="w-4 h-4 mr-2" />
              Connect New USB Printer
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-800">Permitted Printers ({connectedPrinters.length})</h3>
              <Button 
                variant="ghost"
                size="sm"
                onClick={detectInstalledPrinters}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh List
              </Button>
            </div>
            
            {isRefreshing && (
              <div className="text-center py-8">
                <div className="inline-flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <span className="text-gray-600">Detecting printers...</span>
                </div>
              </div>
            )}

            {!isRefreshing && connectedPrinters.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🖨️</span>
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Permitted Printers</h3>
                <p className="text-sm mb-4">Click "Connect New USB Printer" to get started.</p>
              </div>
            )}

            {!isRefreshing && connectedPrinters.length > 0 && (
              <div className="space-y-3">
                {connectedPrinters.map((printer) => (
                  <div
                    key={printer.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedPrinterId === printer.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() => handlePrinterSelect(printer)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getConnectionIcon(printer.connectionType)}
                        <div>
                          <div className="font-medium text-gray-800">{printer.name}</div>
                          <div className="text-sm text-gray-500">
                            {printer.address}
                          </div>
                          {selectedPrinterId === printer.id && (
                            <div className="text-xs text-blue-600 font-medium mt-1">
                              ✓ Auto-connect enabled
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(printer.status)}`}>
                          {printer.status.toUpperCase()}
                        </span>
                        
                        {selectedPrinterId === printer.id && (
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <h4 className="font-medium text-yellow-800 mb-2">Auto-Connect Feature</h4>
            <p className="text-sm text-yellow-700">
              Once you select a printer, it will automatically connect when you log in to the system. 
              This feature uses WebUSB, which is supported in Chrome, Edge, and Opera browsers.
            </p>
          </div>
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
