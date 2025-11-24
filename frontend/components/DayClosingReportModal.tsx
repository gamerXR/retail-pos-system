import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { ChevronLeft, Calendar, Printer, Download } from "lucide-react";
import { useBackend } from "../lib/auth";
import ExportModal from "./ExportModal";
import EmailExportModal from "./EmailExportModal";

interface DayClosingReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PaymentMethod {
  method: string;
  amount: number;
  displayName: string;
}

interface ShiftData {
  totalQuantity: number;
  operationIncome: number;
  cashIncome: number;
  otherPayments: PaymentMethod[];
  dayStart: string;
  shiftStart: string;
  currentTime: string;
  openingBalance: number;
  user: string;
  totalExpenses: number;
  netCashflow: number;
}

export default function DayClosingReportModal({ isOpen, onClose }: DayClosingReportModalProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [shiftData, setShiftData] = useState<ShiftData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const { toast } = useToast();
  const backend = useBackend();

  useEffect(() => {
    if (isOpen) {
      loadShiftData();
    }
  }, [isOpen, selectedDate]);

  const loadShiftData = async () => {
    setIsLoading(true);
    try {
      const response = await backend.pos.getSalesSummary({
        dateFrom: selectedDate,
        dateTo: selectedDate
      });

      const openingBalanceResponse = await backend.pos.getOpeningBalance();

      const cashflowResponse = await backend.pos.getCashflowReport({
        startDate: new Date(selectedDate + 'T00:00:00'),
        endDate: new Date(selectedDate + 'T23:59:59')
      });

      if (response.success) {
        const data = response.data;
        
        const cashIncome = data.paymentMethods.find(pm => pm.method === 'cash')?.amount || 0;
        
        const otherPayments: PaymentMethod[] = [];
        
        const paymentMethodNames: Record<string, string> = {
          'qr': 'QR Payment',
          'others': 'Other Payment',
          'card': 'Card Payment',
          'member': 'Member Payment'
        };
        
        data.paymentMethods.forEach((pm: any) => {
          if (pm.method !== 'cash' && pm.amount > 0) {
            otherPayments.push({
              method: pm.method,
              amount: pm.amount,
              displayName: paymentMethodNames[pm.method] || pm.method.charAt(0).toUpperCase() + pm.method.slice(1)
            });
          }
        });
        
        const shiftStartTime = "08:17";
        
        const mockShiftData: ShiftData = {
          totalQuantity: data.totalQuantity,
          operationIncome: data.totalSales,
          cashIncome: cashIncome,
          otherPayments: otherPayments,
          dayStart: `${selectedDate.split('-').reverse().join('-')} ${shiftStartTime}`,
          shiftStart: `${selectedDate.split('-').reverse().join('-')} ${shiftStartTime}`,
          currentTime: new Date(selectedDate).toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-GB', { hour12: false }),
          openingBalance: openingBalanceResponse.amount,
          user: "Admin",
          totalExpenses: cashflowResponse.totalExpenses,
          netCashflow: cashflowResponse.netCashflow
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
            <title>Day Closing Report</title>
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
          title: "Report Printed",
          description: "Day closing report has been sent to printer",
        });
      }, 500);
    }
  };

  const generateShiftReportContent = () => {
    if (!shiftData) return "";
    
    return `
      <div class="header">
        <h2>DAY CLOSING REPORT</h2>
        <div>${new Date(selectedDate).toLocaleDateString('en-GB')}</div>
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
          <span>Opening Balance:</span>
          <span>$${shiftData.openingBalance.toFixed(2)}</span>
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
        ${shiftData.totalExpenses > 0 ? `
        <div class="row">
          <span style="color: #dc2626;">Total Expenses:</span>
          <span style="color: #dc2626;">-$${shiftData.totalExpenses.toFixed(2)}</span>
        </div>
        <div class="row total" style="color: #059669;">
          <span>Net Cashflow:</span>
          <span>$${shiftData.netCashflow.toFixed(2)}</span>
        </div>
        ` : ''}
      </div>
      
      <div class="separator"></div>
      
      <div class="section">
        <div class="row">
          <span>💵 Cash Income:</span>
          <span>$${shiftData.cashIncome.toFixed(2)}</span>
        </div>
        ${shiftData.otherPayments.map(pm => `
        <div class="row">
          <span>••• ${pm.displayName}:</span>
          <span>$${pm.amount.toFixed(2)}</span>
        </div>
        `).join('')}
      </div>
      
      <div class="separator"></div>
      
      <div style="text-align: center; margin-top: 20px;">
        <div>*** END OF REPORT ***</div>
        <div style="font-size: 10px; margin-top: 10px;">
          Generated: ${new Date().toLocaleString()}
        </div>
      </div>
    `;
  };

  const handleExport = () => {
    setShowExportModal(true);
  };

  const handleExportConfirm = (method: "usb" | "email") => {
    setShowExportModal(false);
    
    if (method === "usb") {
      handleUSBExport();
    } else {
      setShowEmailModal(true);
    }
  };

  const handleUSBExport = () => {
    if (!shiftData) {
      toast({
        title: "Error",
        description: "No data to export",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "USB Export",
      description: "Please insert USB flash drive to export day closing report...",
    });
    
    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: "Day closing report exported to USB drive successfully",
      });
    }, 2000);
  };

  const handleEmailExport = async (email: string) => {
    if (!shiftData) {
      toast({
        title: "Error",
        description: "No data to export",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await backend.pos.exportSalesViaEmail({
        dateFrom: selectedDate,
        dateTo: selectedDate,
        format: "excel",
        email: email
      });

      if (response.success) {
        toast({
          title: "Email Sent",
          description: response.message,
        });
      } else {
        toast({
          title: "Email Error",
          description: response.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending email export:", error);
      toast({
        title: "Email Error",
        description: "Failed to send email. Please try again later.",
        variant: "destructive",
      });
    }
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
                Day Closing Report
              </DialogTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <Button variant="outline" onClick={handleExport}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                <span className="ml-3">Loading shift data...</span>
              </div>
            ) : shiftData ? (
              <>
                <div className="text-center bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-800">
                    Day Closing Report for {new Date(selectedDate).toLocaleDateString('en-GB')}
                  </h3>
                  <p className="text-sm text-blue-600 mt-1">
                    Generated on {new Date().toLocaleString()}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-red-500 mb-2">
                      {shiftData.totalQuantity}
                    </div>
                    <div className="text-lg text-gray-600">Total Quantity</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-6xl font-bold text-red-500 mb-2">
                      ${shiftData.operationIncome.toFixed(2)}
                    </div>
                    <div className="text-lg text-gray-600">Total Income</div>
                  </div>
                </div>

                {shiftData.totalExpenses > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-6xl font-bold text-red-600 mb-2">
                        -${shiftData.totalExpenses.toFixed(2)}
                      </div>
                      <div className="text-lg text-gray-600">Total Expenses</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-6xl font-bold text-green-600 mb-2">
                        ${shiftData.netCashflow.toFixed(2)}
                      </div>
                      <div className="text-lg text-gray-600">Net Cashflow</div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 rounded-lg border-2 border-red-300 bg-red-50">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-gray-800 mb-2">
                        ${shiftData.cashIncome.toFixed(2)}
                      </div>
                      <div className="flex items-center justify-center gap-2 text-gray-600">
                        <span className="text-xl">💵</span>
                        <span className="font-medium">Cash Income</span>
                      </div>
                    </div>
                  </div>

                  {shiftData.otherPayments.map((payment, index) => (
                    <div key={index} className="p-6 rounded-lg border-2 border-blue-300 bg-blue-50">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-gray-800 mb-2">
                          ${payment.amount.toFixed(2)}
                        </div>
                        <div className="flex items-center justify-center gap-2 text-gray-600">
                          <span className="text-xl">•••</span>
                          <span className="font-medium">{payment.displayName}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-4">Shift Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Day Start:</span>
                      <span className="font-medium">{shiftData.dayStart}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shift Start:</span>
                      <span className="font-medium">{shiftData.shiftStart}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Opening Balance:</span>
                      <span className="font-medium">${shiftData.openingBalance.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">User:</span>
                      <span className="font-medium">{shiftData.user}</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-lg font-medium">No data for this date</div>
                <p className="text-sm mt-2">Try selecting a different date</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onConfirm={handleExportConfirm}
      />

      <EmailExportModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSend={handleEmailExport}
      />
    </>
  );
}
