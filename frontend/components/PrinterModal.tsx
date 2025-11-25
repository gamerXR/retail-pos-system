import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { ChevronLeft, Wifi, Usb, Bluetooth, RefreshCw, Trash2 } from "lucide-react";
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
  const [showIPDialog, setShowIPDialog] = useState(false);
  const [ipAddress, setIpAddress] = useState("");
  const [ipPort, setIpPort] = useState("9100");
  const [ipName, setIpName] = useState("");
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

      const savedPrinters = localStorage.getItem('savedPrinters');
      if (savedPrinters) {
        const parsed = JSON.parse(savedPrinters);
        parsed.forEach((p: ConnectedPrinter) => {
          if (p.connectionType === 'ip' || p.connectionType === 'bluetooth') {
            detectedPrinters.push(p);
          }
        });
      }

      setConnectedPrinters(detectedPrinters);

      if (detectedPrinters.length === 0) {
        toast({
          title: "No Permitted Printers",
          description: "No printers found. Please connect a new one.",
        });
      } else {
        toast({
          title: "Printers Detected",
          description: `Found ${detectedPrinters.length} printer(s).`,
        });
      }
    } catch (error) {
      console.error("Error detecting printers:", error);
      toast({
        title: "Detection Error",
        description: "Failed to detect printers.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRequestUSBPermission = async () => {
    try {
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

  const handleRequestBluetoothPermission = async () => {
    try {
      if (!('bluetooth' in navigator)) {
        toast({
          title: "Not Supported",
          description: "Web Bluetooth is not supported in this browser.",
          variant: "destructive"
        });
        return;
      }

      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
      });

      if (device) {
        const newPrinter: ConnectedPrinter = {
          id: `bluetooth-${device.id}`,
          name: device.name || "Bluetooth Printer",
          connectionType: "bluetooth",
          address: device.id,
          status: "ready"
        };

        const savedPrinters = localStorage.getItem('savedPrinters');
        const printers = savedPrinters ? JSON.parse(savedPrinters) : [];
        const updated = [...printers.filter((p: ConnectedPrinter) => p.id !== newPrinter.id), newPrinter];
        localStorage.setItem('savedPrinters', JSON.stringify(updated));

        toast({
          title: "Bluetooth Printer Added",
          description: `${device.name} has been connected.`
        });
        await detectInstalledPrinters();
      }
    } catch (error) {
      console.error("Error requesting Bluetooth device:", error);
      toast({
        title: "Connection Failed",
        description: "Could not connect to Bluetooth device.",
        variant: "destructive"
      });
    }
  };

  const handleAddIPPrinter = () => {
    if (!ipAddress || !ipName) {
      toast({
        title: "Missing Information",
        description: "Please enter both printer name and IP address.",
        variant: "destructive"
      });
      return;
    }

    const newPrinter: ConnectedPrinter = {
      id: `ip-${ipAddress}-${ipPort}`,
      name: ipName,
      connectionType: "ip",
      address: `${ipAddress}:${ipPort}`,
      status: "ready"
    };

    const savedPrinters = localStorage.getItem('savedPrinters');
    const printers = savedPrinters ? JSON.parse(savedPrinters) : [];
    const updated = [...printers.filter((p: ConnectedPrinter) => p.id !== newPrinter.id), newPrinter];
    localStorage.setItem('savedPrinters', JSON.stringify(updated));

    toast({
      title: "IP Printer Added",
      description: `${ipName} has been added successfully.`
    });

    setIpAddress("");
    setIpPort("9100");
    setIpName("");
    setShowIPDialog(false);
    detectInstalledPrinters();
  };

  const handlePrinterSelect = (printer: ConnectedPrinter) => {
    setSelectedPrinterId(printer.id);
    localStorage.setItem('selectedPrinter', JSON.stringify(printer));
    toast({
      title: "Printer Selected",
      description: `${printer.name} has been set as the active printer`,
    });
  };

  const handleDeletePrinter = (printerId: string) => {
    const savedPrinters = localStorage.getItem('savedPrinters');
    if (savedPrinters) {
      const printers = JSON.parse(savedPrinters);
      const updated = printers.filter((p: ConnectedPrinter) => p.id !== printerId);
      localStorage.setItem('savedPrinters', JSON.stringify(updated));
    }

    if (selectedPrinterId === printerId) {
      setSelectedPrinterId(null);
      localStorage.removeItem('selectedPrinter');
    }

    detectInstalledPrinters();
    toast({
      title: "Printer Removed",
      description: "The printer has been removed from the list."
    });
  };

  const handleTestPrint = async () => {
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
      <div style="font-family: monospace; font-size: 12px; line-height: 1.2; width: ${printWidth}; margin: 0 auto; word-break: break-word;">
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

    try {
      const { printReceiptViaPrinter } = await import("../lib/hardware");
      await printReceiptViaPrinter(testContent, printer);
      
      toast({
        title: "Test Print Successful",
        description: `Test receipt sent to ${printer.name}`,
      });
    } catch (error: any) {
      console.error("Test print error:", error);
      toast({
        title: "Test Print Failed",
        description: error.message || "Failed to send test print",
        variant: "destructive",
      });
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
    <>
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
              Connect printers via USB, Bluetooth, or network IP address.
            </p>
            <div className="flex gap-2">
              <Button onClick={handleRequestUSBPermission} disabled={isRefreshing}>
                <Usb className="w-4 h-4 mr-2" />
                USB Printer
              </Button>
              <Button onClick={handleRequestBluetoothPermission} disabled={isRefreshing} variant="outline">
                <Bluetooth className="w-4 h-4 mr-2" />
                Bluetooth
              </Button>
              <Button onClick={() => setShowIPDialog(true)} disabled={isRefreshing} variant="outline">
                <Wifi className="w-4 h-4 mr-2" />
                IP Address
              </Button>
            </div>
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
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Printers Connected</h3>
                <p className="text-sm mb-4">Click a button above to connect a printer.</p>
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
                      <div className="flex items-center gap-3 flex-1">
                        {getConnectionIcon(printer.connectionType)}
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{printer.name}</div>
                          <div className="text-sm text-gray-500">
                            {printer.address}
                          </div>
                          {selectedPrinterId === printer.id && (
                            <div className="text-xs text-blue-600 font-medium mt-1">
                              ✓ Active printer
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(printer.status)}`}>
                          {printer.status.toUpperCase()}
                        </span>
                        
                        {(printer.connectionType === 'ip' || printer.connectionType === 'bluetooth') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePrinter(printer.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                        
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
            <h4 className="font-medium text-yellow-800 mb-2">Printer Types</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• <strong>USB:</strong> Direct connection with cash drawer support (Chrome/Edge/Opera only)</li>
              <li>• <strong>Bluetooth:</strong> Wireless connection to Bluetooth-enabled printers</li>
              <li>• <strong>IP Address:</strong> Network printer connection (supports ESC/POS over TCP)</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
      </Dialog>

      <Dialog open={showIPDialog} onOpenChange={setShowIPDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Network Printer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Printer Name</label>
              <Input
                placeholder="e.g., Receipt Printer"
                value={ipName}
                onChange={(e) => setIpName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">IP Address</label>
              <Input
                placeholder="e.g., 192.168.1.100"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Port</label>
              <Input
                placeholder="9100"
                value={ipPort}
                onChange={(e) => setIpPort(e.target.value)}
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-sm text-blue-700">
                Enter the IP address of your network printer. Most ESC/POS printers use port 9100.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowIPDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddIPPrinter}>
              Add Printer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
