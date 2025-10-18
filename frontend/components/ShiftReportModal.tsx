import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { ChevronLeft, Printer } from "lucide-react";
import { useBackend, useAuth } from "../lib/auth";

interface ShiftReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

interface ShiftData {
  totalQuantity: number;
  operationIncome: number;
  cashIncome: number;
  baiduri: number;
  dayStart: string;
  shiftStart: string;
  currentTime: string;
  tills: number;
  user: string;
}

export default function ShiftReportModal({ isOpen, onClose, onLogout }: ShiftReportModalProps) {
  const [shiftData, setShiftData] = useState<ShiftData | null>(null);
  const [printReceipt, setPrintReceipt] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isClosingShift, setIsClosingShift] = useState(false);
  const { toast } = useToast();
  const backend = useBackend();
  const { logout } = useAuth();

  useEffect(() => {
    if (isOpen) {
      loadShiftData();
    }
  }, [isOpen]);

  const loadShiftData = async () => {
    setIsLoading(true);
    try {
      // Get today's sales summary
      const today = new Date().toISOString().split('T')[0];
      const response = await backend.pos.getSalesSummary({
        dateFrom: today,
        dateTo: today
      });

      if (response.success) {
        const data = response.data;
        
        // Calculate payment method totals
        const cashIncome = data.paymentMethods.find(pm => pm.method === 'cash')?.amount || 0;
        const baiduri = data.paymentMethods.find(pm => pm.method === 'others')?.amount || 0;
        
        // Get shift start time (assume 8:17 AM for demo)
        const shiftStartTime = "08:17";
        const dayStartDate = new Date();
        dayStartDate.setHours(8, 17, 0, 0);
        
        const mockShiftData: ShiftData = {
          totalQuantity: data.totalQuantity,
          operationIncome: data.totalSales,
          cashIncome: cashIncome,
          baiduri: baiduri,
          dayStart: `${today.split('-').reverse().join('-')} ${shiftStartTime}`,
          shiftStart: `${today.split('-').reverse().join('-')} ${shiftStartTime}`,
          currentTime: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-GB', { hour12: false }),
          tills: 0.00,
          user: "Admin"
        };
        
        setShiftData(mockShiftData);
      }
    } catch (error) {
      console.error("Error loading shift data:", error);
      toast({
        title: "Error",
        description: "Failed to load shift data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    if (!shiftData) return;
    
    const printContent = generateShiftReportContent();
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Shift Report</title>
            <style>
              body { 
                margin: 0; 
                padding: 20px; 
                font-family: monospace;
                font-size: 12px;
                line-height: 1.4;
              }
              @media print {
                @page {
                  size: 80mm auto;
                  margin: 3mm;
                }
                body { padding: 0; }
              }
              .header { text-align: center; margin-bottom: 20px; }
              .section { margin-bottom: 15px; }
              .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
              .separator { border-top: 1px dashed #000; margin: 10px 0; }
              .total { font-weight: bold; font-size: 14px; }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
        toast({
          title: "Shift Report Printed",
          description: "Shift report has been sent to printer",
        });
      }, 500);
    }
  };

  const generateShiftReportContent = () => {
    if (!shiftData) return "";
    
    return `
      <div class="header">
        <h2>SHIFT REPORT</h2>
        <div>Day Closing Report</div>
      </div>
      
      <div class="section">
        <div class="row">
          <span>Day Start:</span>
          <span>${shiftData.dayStart}</span>
        </div>
        <div class="row">
          <span>Shift Start:</span>
          <span>${shiftData.shiftStart}</span>
        </div>
        <div class="row">
          <span>Time:</span>
          <span>${shiftData.currentTime}</span>
        </div>
        <div class="row">
          <span>User:</span>
          <span>${shiftData.user}</span>
        </div>
        <div class="row">
          <span>Tills:</span>
          <span>$${shiftData.tills.toFixed(2)}</span>
        </div>
      </div>
      
      <div class="separator"></div>
      
      <div class="section">
        <div class="row total">
          <span>Total Quantity:</span>
          <span>${shiftData.totalQuantity}</span>
        </div>
        <div class="row total">
          <span>Operation Income:</span>
          <span>$${shiftData.operationIncome.toFixed(2)}</span>
        </div>
      </div>
      
      <div class="separator"></div>
      
      <div class="section">
        <div class="row">
          <span>💵 Cash Income:</span>
          <span>$${shiftData.cashIncome.toFixed(2)}</span>
        </div>
        <div class="row">
          <span>••• Baiduri Online:</span>
          <span>$${shiftData.baiduri.toFixed(2)}</span>
        </div>
      </div>
      
      <div class="separator"></div>
      
      <div style="text-align: center; margin-top: 20px;">
        <div>*** END OF SHIFT ***</div>
        <div style="font-size: 10px; margin-top: 10px;">
          Generated: ${new Date().toLocaleString()}
        </div>
      </div>
    `;
  };

  const handleDayClosing = async () => {
    if (!shiftData) return;
    
    setIsClosingShift(true);
    try {
      // Print receipt if enabled
      if (printReceipt) {
        handlePrint();
        // Wait for print to complete
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      toast({
        title: "Day Closing Complete",
        description: "Logging out...",
      });
      
      // Wait a moment before logout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Close modal
      onClose();
      
      // Logout and return to login page
      logout();
      onLogout();
    } catch (error) {
      console.error("Error closing shift:", error);
      toast({
        title: "Error",
        description: "Failed to close shift",
        variant: "destructive",
      });
      setIsClosingShift(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              Shift
            </DialogTitle>
            <div className="text-lg font-medium text-gray-700">
              Shift Record
            </div>
          </div>
        </DialogHeader>

        <div className="flex h-[600px]">
          {/* Left Side - Main Metrics */}
          <div className="flex-1 p-8">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                <span className="ml-3">Loading shift data...</span>
              </div>
            ) : shiftData ? (
              <div className="space-y-12">
                {/* Top Metrics */}
                <div className="flex justify-between items-center">
                  <div className="text-center">
                    <div className="text-8xl font-bold text-red-500 mb-4">
                      {shiftData.totalQuantity}
                    </div>
                    <div className="text-xl text-gray-600">Total Quantity</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-8xl font-bold text-red-500 mb-4">
                      {shiftData.operationIncome.toFixed(2)}
                    </div>
                    <div className="text-xl text-gray-600">Operation Income</div>
                  </div>
                </div>

                {/* Payment Method Breakdown */}
                <div className="grid grid-cols-2 gap-8">
                  {/* Cash Income */}
                  <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-8">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-gray-800 mb-4">
                        ${shiftData.cashIncome.toFixed(2)}
                      </div>
                      <div className="flex items-center justify-center gap-2 text-gray-600">
                        <span className="text-2xl">💵</span>
                        <span className="text-lg font-medium">Cash Income</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Baiduri Online */}
                  <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-8">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-gray-800 mb-4">
                        ${shiftData.baiduri.toFixed(2)}
                      </div>
                      <div className="flex items-center justify-center gap-2 text-gray-600">
                        <span className="text-2xl">•••</span>
                        <span className="text-lg font-medium">Baiduri Online</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-lg font-medium">No shift data available</div>
                  <p className="text-sm mt-2">Unable to load shift information</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Shift Details */}
          <div className="w-80 bg-gray-50 border-l border-gray-200 p-6">
            {shiftData && (
              <div className="space-y-6">
                {/* Shift Information */}
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Day Start:</span>
                    <span className="font-medium">{shiftData.dayStart}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shift Start:</span>
                    <span className="font-medium">{shiftData.shiftStart}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium">{shiftData.currentTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tills:</span>
                    <span className="font-medium">${shiftData.tills.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">User:</span>
                    <span className="font-medium">{shiftData.user}</span>
                  </div>
                </div>

                {/* Print Receipt Toggle */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-lg font-medium">Print Receipt</span>
                    <Switch
                      checked={printReceipt}
                      onCheckedChange={setPrintReceipt}
                      className="data-[state=checked]:bg-red-500"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-4">
                  <Button
                    variant="outline"
                    className="w-full h-12 text-lg"
                    onClick={handlePrint}
                    disabled={!shiftData}
                  >
                    <Printer className="w-5 h-5 mr-2" />
                    Print Report
                  </Button>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 h-12 text-lg"
                      disabled={isClosingShift}
                    >
                      Day Closing
                    </Button>
                    <Button
                      onClick={handleDayClosing}
                      disabled={isClosingShift || !shiftData}
                      className="flex-1 h-12 text-lg bg-red-500 hover:bg-red-600 text-white"
                    >
                      {isClosingShift ? "Closing..." : "Shift"}
                    </Button>
                  </div>
                </div>

                {/* Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm text-blue-700">
                    <strong>Note:</strong> Closing the shift will finalize all transactions for the day and generate a summary report.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
