import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { ChevronLeft, Search, Printer, Calendar } from "lucide-react";

interface ReprintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Receipt {
  id: number;
  orderNumber: string;
  date: string;
  time: string;
  total: number;
  paymentMethod: string;
  itemCount: number;
}

export default function ReprintModal({ isOpen, onClose }: ReprintModalProps) {
  const [searchType, setSearchType] = useState<"date" | "order">("date");
  const [searchDate, setSearchDate] = useState(new Date().toISOString().split('T')[0]);
  const [orderNumber, setOrderNumber] = useState("");
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && searchType === "date") {
      searchReceiptsByDate();
    }
  }, [isOpen, searchDate]);

  const searchReceiptsByDate = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement actual API call to search receipts by date
      // For now, we'll simulate the data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockReceipts: Receipt[] = [
        {
          id: 1,
          orderNumber: "ORD-001",
          date: searchDate,
          time: "09:15 AM",
          total: 25.50,
          paymentMethod: "Cash",
          itemCount: 3
        },
        {
          id: 2,
          orderNumber: "ORD-002",
          date: searchDate,
          time: "10:30 AM",
          total: 45.75,
          paymentMethod: "Member",
          itemCount: 5
        },
        {
          id: 3,
          orderNumber: "ORD-003",
          date: searchDate,
          time: "11:45 AM",
          total: 12.25,
          paymentMethod: "Cash",
          itemCount: 2
        },
        {
          id: 4,
          orderNumber: "ORD-004",
          date: searchDate,
          time: "02:20 PM",
          total: 67.90,
          paymentMethod: "Others",
          itemCount: 8
        }
      ];
      
      setReceipts(mockReceipts);
    } catch (error) {
      console.error("Error searching receipts:", error);
      toast({
        title: "Error",
        description: "Failed to search receipts",
        variant: "destructive",
      });
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
      // TODO: Implement actual API call to search receipt by order number
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate finding a receipt
      const mockReceipt: Receipt = {
        id: 1,
        orderNumber: orderNumber.toUpperCase(),
        date: "2024-01-15",
        time: "02:30 PM",
        total: 35.75,
        paymentMethod: "Cash",
        itemCount: 4
      };
      
      setReceipts([mockReceipt]);
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
    toast({
      title: "Reprinting Receipt",
      description: `Reprinting order ${receipt.orderNumber}...`,
    });
    
    // TODO: Implement actual reprint functionality
    setTimeout(() => {
      toast({
        title: "Receipt Reprinted",
        description: `Order ${receipt.orderNumber} has been reprinted successfully`,
      });
    }, 1500);
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
