import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { ChevronLeft, Search, Printer, Calendar } from "lucide-react";
import { useBackend } from "../lib/auth";
import type { Receipt } from "~backend/pos/receipts";

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
  const { toast } = useToast();
  const backend = useBackend();

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
    const printContent = generateReceiptContent(receipt);
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt - ${receipt.orderNumber}</title>
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
          title: "Receipt Reprinted",
          description: `Order ${receipt.orderNumber} has been reprinted`,
        });
      }, 500);
    }
  };

  const generateReceiptContent = (receipt: Receipt) => {
    return `
      <div class="header">
        <h2>SALES RECEIPT</h2>
        <div>Order: ${receipt.orderNumber}</div>
      </div>
      
      <div class="section">
        <div class="row">
          <span>Date:</span>
          <span>${new Date(receipt.date).toLocaleDateString()}</span>
        </div>
        <div class="row">
          <span>Time:</span>
          <span>${receipt.time}</span>
        </div>
        <div class="row">
          <span>Payment:</span>
          <span>${receipt.paymentMethod}</span>
        </div>
      </div>
      
      <div class="separator"></div>
      
      <div class="section">
        ${receipt.items.map(item => `
          <div class="row">
            <span>${item.productName}</span>
          </div>
          <div class="row" style="padding-left: 10px; font-size: 11px;">
            <span>${item.quantity} x $${item.unitPrice.toFixed(2)}</span>
            <span>$${item.totalPrice.toFixed(2)}</span>
          </div>
        `).join('')}
      </div>
      
      <div class="separator"></div>
      
      <div class="section">
        <div class="row total">
          <span>Total:</span>
          <span>$${receipt.total.toFixed(2)}</span>
        </div>
        <div class="row">
          <span>Items:</span>
          <span>${receipt.itemCount}</span>
        </div>
      </div>
      
      <div class="separator"></div>
      
      <div style="text-align: center; margin-top: 20px;">
        <div>*** Thank You ***</div>
        <div style="font-size: 10px; margin-top: 10px;">
          Reprinted: ${new Date().toLocaleString()}
        </div>
      </div>
    `;
  };

  const handleSearch = () => {
    if (searchType === "date") {
      searchReceiptsByDate();
    } else {
      searchReceiptByOrder();
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
                  <div>
                    <Button
                      size="sm"
                      onClick={() => handleReprint(receipt)}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      <Printer className="w-4 h-4 mr-1" />
                      Reprint
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
    </Dialog>
  );
}
