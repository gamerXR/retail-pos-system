import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { ChevronLeft, Search, Undo2 } from "lucide-react";
import { useAuth } from "../lib/auth";

interface ReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ReceiptItem {
  id: number;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  selected: boolean;
  returnQuantity: number;
}

interface Receipt {
  orderNumber: string;
  date: string;
  time: string;
  total: number;
  paymentMethod: string;
  items: ReceiptItem[];
}

export default function ReturnModal({ isOpen, onClose }: ReturnModalProps) {
  const [searchValue, setSearchValue] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const auth = useAuth();

  useEffect(() => {
    if (isOpen && auth.isSalesperson && !auth.canProcessReturns) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to process returns",
        variant: "destructive",
      });
      onClose();
    }
  }, [isOpen, auth.isSalesperson, auth.canProcessReturns]);

  const returnReasons = [
    "Defective Product",
    "Wrong Item",
    "Customer Changed Mind",
    "Damaged During Transport",
    "Expired Product",
    "Other"
  ];

  const searchReceipt = async () => {
    if (!searchValue.trim()) {
      toast({
        title: "Error",
        description: "Please enter an order number",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement actual API call to search receipt
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate finding a receipt
      const mockReceipt: Receipt = {
        orderNumber: searchValue.toUpperCase(),
        date: "2024-01-15",
        time: "02:30 PM",
        total: 67.50,
        paymentMethod: "Cash",
        items: [
          {
            id: 1,
            name: "Essential Oil - Lavender",
            quantity: 2,
            unitPrice: 15.00,
            totalPrice: 30.00,
            selected: false,
            returnQuantity: 0
          },
          {
            id: 2,
            name: "Car Detailing Kit",
            quantity: 1,
            unitPrice: 25.50,
            totalPrice: 25.50,
            selected: false,
            returnQuantity: 0
          },
          {
            id: 3,
            name: "Notebook Set",
            quantity: 3,
            unitPrice: 4.00,
            totalPrice: 12.00,
            selected: false,
            returnQuantity: 0
          }
        ]
      };
      
      setReceipt(mockReceipt);
    } catch (error) {
      console.error("Error searching receipt:", error);
      toast({
        title: "Error",
        description: "Receipt not found",
        variant: "destructive",
      });
      setReceipt(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemSelect = (itemId: number, selected: boolean) => {
    if (!receipt) return;
    
    setReceipt(prev => ({
      ...prev!,
      items: prev!.items.map(item =>
        item.id === itemId 
          ? { ...item, selected, returnQuantity: selected ? item.quantity : 0 }
          : item
      )
    }));
  };

  const handleQuantityChange = (itemId: number, quantity: number) => {
    if (!receipt) return;
    
    setReceipt(prev => ({
      ...prev!,
      items: prev!.items.map(item =>
        item.id === itemId 
          ? { ...item, returnQuantity: Math.min(Math.max(0, quantity), item.quantity) }
          : item
      )
    }));
  };

  const handleSelectAll = () => {
    if (!receipt) return;
    
    const allSelected = receipt.items.every(item => item.selected);
    setReceipt(prev => ({
      ...prev!,
      items: prev!.items.map(item => ({
        ...item,
        selected: !allSelected,
        returnQuantity: !allSelected ? item.quantity : 0
      }))
    }));
  };

  const getReturnTotal = () => {
    if (!receipt) return 0;
    return receipt.items.reduce((total, item) => 
      total + (item.returnQuantity * item.unitPrice), 0
    );
  };

  const getSelectedItemsCount = () => {
    if (!receipt) return 0;
    return receipt.items.filter(item => item.selected && item.returnQuantity > 0).length;
  };

  const handleProcessReturn = async () => {
    if (!receipt) return;
    
    const selectedItems = receipt.items.filter(item => item.selected && item.returnQuantity > 0);
    
    if (selectedItems.length === 0) {
      toast({
        title: "Error",
        description: "Please select items to return",
        variant: "destructive",
      });
      return;
    }

    if (!returnReason) {
      toast({
        title: "Error",
        description: "Please select a return reason",
        variant: "destructive",
      });
      return;
    }

    if (returnReason === "Other" && !customReason.trim()) {
      toast({
        title: "Error",
        description: "Please specify the return reason",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // TODO: Implement actual return processing API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const returnAmount = getReturnTotal();
      
      toast({
        title: "Return Processed",
        description: `Return of $${returnAmount.toFixed(2)} processed successfully`,
      });
      
      // Reset form
      setReceipt(null);
      setSearchValue("");
      setReturnReason("");
      setCustomReason("");
      onClose();
    } catch (error) {
      console.error("Error processing return:", error);
      toast({
        title: "Error",
        description: "Failed to process return",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
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
              Return Items
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Search Section */}
        <div className="space-y-4 border-b pb-4">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Enter order number (e.g., ORD-001)"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="flex-1"
              onKeyPress={(e) => e.key === "Enter" && searchReceipt()}
            />
            <Button onClick={searchReceipt} disabled={isLoading}>
              <Search className="w-4 h-4 mr-2" />
              {isLoading ? "Searching..." : "Search"}
            </Button>
          </div>
        </div>

        {/* Receipt Details */}
        {receipt && (
          <div className="space-y-4">
            {/* Receipt Header */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Order Number</span>
                  <div className="font-medium">{receipt.orderNumber}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Date</span>
                  <div className="font-medium">{new Date(receipt.date).toLocaleDateString()}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Time</span>
                  <div className="font-medium">{receipt.time}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Original Total</span>
                  <div className="font-medium">${receipt.total.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Items Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Select Items to Return</h3>
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {receipt.items.every(item => item.selected) ? "Deselect All" : "Select All"}
              </Button>
            </div>

            {/* Items List */}
            <div className="border rounded-lg">
              <div className="grid grid-cols-6 gap-4 py-3 px-4 bg-gray-50 border-b font-medium text-gray-700">
                <div>Select</div>
                <div className="col-span-2">Item Name</div>
                <div>Original Qty</div>
                <div>Return Qty</div>
                <div>Refund Amount</div>
              </div>
              
              <div className="max-h-64 overflow-y-auto">
                {receipt.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-6 gap-4 py-3 px-4 border-b border-gray-100">
                    <div className="flex items-center">
                      <Checkbox
                        checked={item.selected}
                        onCheckedChange={(checked) => handleItemSelect(item.id, checked as boolean)}
                      />
                    </div>
                    <div className="col-span-2">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-500">${item.unitPrice.toFixed(2)} each</div>
                    </div>
                    <div className="flex items-center">{item.quantity}</div>
                    <div className="flex items-center">
                      <Input
                        type="number"
                        min="0"
                        max={item.quantity}
                        value={item.returnQuantity}
                        onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                        disabled={!item.selected}
                        className="w-20"
                      />
                    </div>
                    <div className="flex items-center font-medium">
                      ${(item.returnQuantity * item.unitPrice).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Return Reason */}
            <div className="space-y-3">
              <label className="font-medium">Return Reason *</label>
              <Select value={returnReason} onValueChange={setReturnReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select return reason" />
                </SelectTrigger>
                <SelectContent>
                  {returnReasons.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {returnReason === "Other" && (
                <Textarea
                  placeholder="Please specify the return reason..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="mt-2"
                />
              )}
            </div>

            {/* Return Summary */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium">Return Summary:</span>
                  <span className="ml-2">{getSelectedItemsCount()} item(s) selected</span>
                </div>
                <div className="text-xl font-bold text-blue-700">
                  Refund: ${getReturnTotal().toFixed(2)}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleProcessReturn}
                disabled={isProcessing || getSelectedItemsCount() === 0}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                <Undo2 className="w-4 h-4 mr-2" />
                {isProcessing ? "Processing..." : `Process Return ($${getReturnTotal().toFixed(2)})`}
              </Button>
            </div>
          </div>
        )}

        {/* No Receipt Found */}
        {!receipt && !isLoading && searchValue && (
          <div className="flex items-center justify-center py-8 text-gray-400">
            <div className="text-center">
              <p>No receipt found</p>
              <p className="text-sm mt-2">Please check the order number and try again</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
