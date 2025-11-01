import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { ChevronLeft, Search, Printer, Calendar, Mail } from "lucide-react";
import { useBackend } from "../lib/auth";
import type { Receipt } from "~backend/pos/receipts";

interface ReceiptSettings {
  size: "58mm" | "80mm";
  printCopies: number;
  topLogo: string;
  topLogoFile?: string;
  companyName: string;
  address: string;
  telephone: string;
  headerSize: "Small" | "Medium" | "Large";
  fontSize: "Small" | "Medium" | "Large";
  displayUnitPrice: boolean;
  footer: string;
}

interface ReprintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReprintModal({ isOpen, onClose }: ReprintModalProps) {
  const [searchType, setSearchType] = useState<"date" | "order">("date");
  const [searchDate, setSearchDate] = useState(new Date().toISOString().split('T')[0]);
  const [orderNumber, setOrderNumber] = useState("");
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [emailAddress, setEmailAddress] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const { toast } = useToast();
  const backend = useBackend();

  const getReceiptSettings = (): ReceiptSettings => {
    const savedSettings = localStorage.getItem('receiptSettings');
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
    
    return {
      size: "80mm",
      printCopies: 1,
      topLogo: "None",
      companyName: "POSX SOLUTION",
      address: "Unit 4, First Floor, Jin Pg Babu Raja, Kg Kiarong, Brunei Darussalam",
      telephone: "+673 818 4877",
      headerSize: "Large",
      fontSize: "Small",
      displayUnitPrice: true,
      footer: "Thank You & Come Again!"
    };
  };

  useEffect(() => {
    if (isOpen && searchType === "date") {
      searchReceiptsByDate();
    }
  }, [isOpen, searchDate]);

  const searchReceiptsByDate = async () => {
    setIsLoading(true);
    try {
      const response = await backend.pos.searchReceipts({ date: searchDate });
      
      if (response.success) {
        setReceipts(response.receipts);
      } else {
        toast({
          title: "Error",
          description: "Failed to search receipts",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error searching receipts:", error);
      toast({
        title: "Error",
        description: "Failed to search receipts",
        variant: "destructive",
      });
      setReceipts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const searchReceiptByOrder = async () => {
    if (!orderNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter an order number",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const orderNum = orderNumber.replace(/\D/g, '');
      const response = await backend.pos.searchReceipts({ orderNumber: orderNum });
      
      if (response.success && response.receipts.length > 0) {
        setReceipts(response.receipts);
      } else {
        toast({
          title: "Not Found",
          description: "Receipt not found",
          variant: "destructive",
        });
        setReceipts([]);
      }
    } catch (error) {
      console.error("Error searching receipt:", error);
      toast({
        title: "Error",
        description: "Receipt not found",
        variant: "destructive",
      });
      setReceipts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReprint = (receipt: Receipt) => {
    const settings = getReceiptSettings();
    const printContent = generateReceiptContent(receipt, settings);
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt - ${receipt.orderNumber}</title>
            <style>
              body { 
                margin: 0; 
                padding: 0; 
                font-family: monospace;
              }
              @media print {
                @page {
                  size: ${settings.size} auto;
                  margin: 3mm;
                }
              }
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
          title: "Receipt Reprinted",
          description: `Order ${receipt.orderNumber} has been reprinted`,
        });
      }, 500);
    }
  };

  const generateReceiptContent = (receipt: Receipt, settings: ReceiptSettings) => {
    let receiptContent = `
      <div style="font-family: monospace; font-size: ${settings.fontSize === 'Small' ? '12px' : settings.fontSize === 'Medium' ? '14px' : '16px'}; line-height: 1.2; width: ${settings.size === '58mm' ? '56mm' : '76mm'}; margin: 0 auto; word-break: break-word;">
    `;

    if (settings.topLogoFile) {
      receiptContent += `
        <div style="text-align: center; margin-bottom: 10px;">
          <img src="${settings.topLogoFile}" alt="Logo" style="max-width: 80%; max-height: 60px; margin: 0 auto; display: block;" />
        </div>
      `;
    }

    if (settings.companyName) {
      receiptContent += `
        <div style="text-align: center; margin-bottom: 10px; font-size: ${settings.headerSize === 'Small' ? '14px' : settings.headerSize === 'Medium' ? '18px' : '22px'}; font-weight: bold;">
          ${settings.companyName}
        </div>
      `;
    }

    if (settings.address || settings.telephone) {
      receiptContent += `
        <div style="text-align: center; margin-bottom: 10px; font-size: 10px;">
          ${settings.address ? settings.address.replace(/\n/g, '<br>') : ''}
          ${settings.address && settings.telephone ? '<br>' : ''}
          ${settings.telephone ? 'Tel ' + settings.telephone : ''}
        </div>
      `;
    }

    receiptContent += `<div style="border-top: 1px dashed #000; margin: 10px 0;"></div>`;

    receiptContent += `
      <div style="text-align: center; margin-bottom: 10px;">
        Receipt #${receipt.orderNumber}<br>
        ${new Date(receipt.date).toLocaleDateString()} ${receipt.time}
      </div>
    `;

    receiptContent += `<div style="border-top: 1px dashed #000; margin: 10px 0;"></div>`;

    if (settings.displayUnitPrice) {
      receiptContent += `
        <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 5px;">
          <span>Item</span>
          <span>Qty</span>
          <span>Price</span>
          <span>Total</span>
        </div>
      `;
    } else {
      receiptContent += `
        <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 5px;">
          <span>Item</span>
          <span>Qty</span>
          <span>Total</span>
        </div>
      `;
    }

    receiptContent += `<div style="border-top: 1px dashed #000; margin: 5px 0;"></div>`;

    receipt.items.forEach(item => {
      if (settings.displayUnitPrice) {
        receiptContent += `
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3px; font-size: 11px;">
            <span style="flex: 1; word-break: break-word;">${item.productName}</span>
            <span style="width: 30px; text-align: center; flex-shrink: 0; margin-left: 5px;">${item.quantity}</span>
            <span style="width: 45px; text-align: right; flex-shrink: 0; margin-left: 5px;">$${item.unitPrice.toFixed(2)}</span>
            <span style="width: 45px; text-align: right; flex-shrink: 0; margin-left: 5px;">$${item.totalPrice.toFixed(2)}</span>
          </div>
        `;
      } else {
        receiptContent += `
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3px; font-size: 11px;">
            <span style="flex: 1; word-break: break-word;">${item.productName}</span>
            <span style="width: 30px; text-align: center; flex-shrink: 0; margin-left: 5px;">${item.quantity}</span>
            <span style="width: 60px; text-align: right; flex-shrink: 0; margin-left: 5px;">$${item.totalPrice.toFixed(2)}</span>
          </div>
        `;
      }
    });

    receiptContent += `<div style="border-top: 1px dashed #000; margin: 10px 0;"></div>`;

    const totalQty = receipt.items.reduce((sum, item) => sum + item.quantity, 0);

    receiptContent += `
      <div style="margin-bottom: 5px;">
        <div style="display: flex; justify-content: space-between;">
          <span>Total QTY</span>
          <span>${totalQty}</span>
        </div>
      </div>
      <div style="border-top: 1px dashed #000; margin: 10px 0;"></div>
      <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-bottom: 10px;">
        <span>Total Amount</span>
        <span>$${receipt.total.toFixed(2)}</span>
      </div>
    `;

    receiptContent += `
      <div style="margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between;">
          <span>Payment Method</span>
          <span>${receipt.paymentMethod}</span>
        </div>
      </div>
    `;

    receiptContent += `<div style="border-top: 1px dashed #000; margin: 10px 0;"></div>`;

    if (settings.footer) {
      receiptContent += `
        <div style="text-align: center; margin-top: 10px; font-size: 10px;">
          ${settings.footer}
        </div>
      `;
    }

    receiptContent += `
      <div style="text-align: center; margin-top: 15px; font-size: 8px; color: #666;">
        Reprinted: ${new Date().toLocaleString()}
      </div>
    `;

    receiptContent += `</div>`;
    
    return receiptContent;
  };

  const handleSearch = () => {
    if (searchType === "date") {
      searchReceiptsByDate();
    } else {
      searchReceiptByOrder();
    }
  };

  const handleEmailExport = async () => {
    if (!emailAddress.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    if (!selectedReceipt) {
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddress)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsSendingEmail(true);
    try {
      const settings = getReceiptSettings();
      const receiptHTML = generateReceiptContent(selectedReceipt, settings);

      const emailSubject = `Receipt ${selectedReceipt.orderNumber}`;
      const emailBody = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; }
            </style>
          </head>
          <body>
            <p>Dear Customer,</p>
            <p>Please find your receipt attached below:</p>
            ${receiptHTML}
            <p style="margin-top: 20px;">Thank you for your business!</p>
          </body>
        </html>
      `;

      const mailtoLink = `mailto:${emailAddress}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      window.location.href = mailtoLink;

      toast({
        title: "Email Client Opened",
        description: "Your default email client has been opened with the receipt",
      });

      setShowEmailDialog(false);
      setEmailAddress("");
      setSelectedReceipt(null);
    } catch (error) {
      console.error("Error exporting receipt:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export receipt via email",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              Reprint Receipt
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Search Controls */}
        <div className="space-y-4 border-b pb-4">
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <Button
                variant={searchType === "date" ? "default" : "outline"}
                className={searchType === "date" ? "bg-red-500 hover:bg-red-600 text-white" : ""}
                onClick={() => setSearchType("date")}
              >
                <Calendar className="w-4 h-4 mr-2" />
                By Date
              </Button>
              <Button
                variant={searchType === "order" ? "default" : "outline"}
                className={searchType === "order" ? "bg-red-500 hover:bg-red-600 text-white" : ""}
                onClick={() => setSearchType("order")}
              >
                <Search className="w-4 h-4 mr-2" />
                By Order
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {searchType === "date" ? (
              <Input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="w-48"
              />
            ) : (
              <Input
                placeholder="Enter order number (e.g., ORD-001)"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="w-64"
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            )}
            <Button onClick={handleSearch} disabled={isLoading}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </div>

        {/* Results Header */}
        <div className="grid grid-cols-6 gap-4 py-3 px-4 bg-gray-50 border-b font-medium text-gray-700">
          <div>Order #</div>
          <div>Date</div>
          <div>Time</div>
          <div>Items</div>
          <div>Total</div>
          <div>Action</div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
              <span className="ml-3">Searching receipts...</span>
            </div>
          ) : receipts.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <div className="text-center">
                <p>No receipts found</p>
                <p className="text-sm mt-2">
                  {searchType === "date" 
                    ? "No receipts found for the selected date" 
                    : "No receipt found with the entered order number"
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {receipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="grid grid-cols-6 gap-4 py-3 px-4 hover:bg-gray-50 border-b border-gray-100 transition-colors"
                >
                  <div className="font-medium text-blue-600">{receipt.orderNumber}</div>
                  <div className="text-sm">{new Date(receipt.date).toLocaleDateString()}</div>
                  <div className="text-sm">{receipt.time}</div>
                  <div className="text-sm">{receipt.itemCount} items</div>
                  <div className="text-sm font-semibold text-green-600">${receipt.total.toFixed(2)}</div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleReprint(receipt)}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      <Printer className="w-4 h-4 mr-1" />
                      Reprint
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedReceipt(receipt);
                        setShowEmailDialog(true);
                      }}
                    >
                      <Mail className="w-4 h-4 mr-1" />
                      Export
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with result count */}
        {receipts.length > 0 && (
          <div className="border-t px-4 py-2 text-sm text-gray-500">
            {receipts.length} receipt{receipts.length !== 1 ? 's' : ''} found
          </div>
        )}
      </DialogContent>

      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Receipt via Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Email Address</label>
              <Input
                type="email"
                placeholder="customer@example.com"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleEmailExport()}
              />
            </div>
            {selectedReceipt && (
              <div className="bg-gray-50 border border-gray-200 rounded p-3">
                <p className="text-sm text-gray-700">
                  <strong>Order:</strong> {selectedReceipt.orderNumber}<br />
                  <strong>Total:</strong> ${selectedReceipt.total.toFixed(2)}<br />
                  <strong>Date:</strong> {new Date(selectedReceipt.date).toLocaleDateString()}
                </p>
              </div>
            )}
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-sm text-blue-700">
                This will open your default email client with the receipt content ready to send.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowEmailDialog(false);
                setEmailAddress("");
                setSelectedReceipt(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEmailExport}
              disabled={isSendingEmail}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isSendingEmail ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
