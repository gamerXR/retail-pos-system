import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft } from "lucide-react";
import type { Product } from "~backend/pos/products";

interface StockQuantityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (quantity: number, amount: number) => void;
  product: Product | null;
}

export default function StockQuantityModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  product 
}: StockQuantityModalProps) {
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");

  const handleQuantityChange = (value: string) => {
    setQuantity(value);
  };

  const handlePriceChange = (value: string) => {
    setPrice(value);
  };

  const getAmount = () => {
    const qty = parseFloat(quantity) || 0;
    const unitPrice = parseFloat(price) || (product?.price || 0);
    return qty * unitPrice;
  };

  const handleKeypadInput = (value: string) => {
    if (value === "⌫") {
      setQuantity(prev => prev.slice(0, -1));
    } else if (value === ".") {
      if (!quantity.includes(".")) {
        setQuantity(prev => prev + value);
      }
    } else {
      setQuantity(prev => prev + value);
    }
  };

  const handleConfirm = () => {
    const qty = parseFloat(quantity) || 0;
    const amount = getAmount();
    if (qty > 0) {
      onConfirm(qty, amount);
      setQuantity("");
      setPrice("");
    }
  };

  const handleCancel = () => {
    setQuantity("");
    setPrice("");
    onClose();
  };

  const keypadNumbers = [
    ["7", "8", "9"],
    ["4", "5", "6"],
    ["1", "2", "3"],
    [".", "0", "⌫"]
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
              Stock Quantity
            </DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button 
                onClick={handleConfirm}
                className="bg-red-500 hover:bg-red-600 text-white"
                disabled={!quantity || parseFloat(quantity) <= 0}
              >
                OK
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Info */}
          <div className="text-center bg-gray-50 p-4 rounded-lg">
            <div className="text-lg font-medium text-gray-800">Product</div>
            <div className="text-gray-600 font-semibold">{product?.name || "Unknown Product"}</div>
            <div className="text-sm text-gray-500 mt-1">
              Current Stock: {product?.quantity || 0} units
            </div>
          </div>

          {/* Quantity, Price, Amount Row */}
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <label className="text-xs text-gray-500 block mb-1">Quantity</label>
              <Input
                type="text"
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                placeholder="0"
                className="w-20 text-center font-semibold"
              />
            </div>
            
            <span className="text-2xl font-bold text-gray-400 mt-4">×</span>
            
            <div className="text-center">
              <label className="text-xs text-gray-500 block mb-1">Unit Price</label>
              <Input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => handlePriceChange(e.target.value)}
                placeholder={product?.price?.toString() || "0.00"}
                className="w-24 text-center text-orange-500 font-semibold"
              />
            </div>
            
            <span className="text-2xl font-bold text-gray-400 mt-4">=</span>
            
            <div className="text-center">
              <label className="text-xs text-gray-500 block mb-1">Total Amount</label>
              <Input
                type="text"
                value={getAmount().toFixed(2)}
                readOnly
                className="w-24 text-center bg-gray-50 font-semibold"
              />
            </div>
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-3">
            {keypadNumbers.flat().map((key, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-12 text-xl font-semibold hover:bg-gray-100"
                onClick={() => handleKeypadInput(key)}
              >
                {key}
              </Button>
            ))}
          </div>

          {/* Quick Quantity Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {[1, 5, 10, 50].map((qty) => (
              <Button
                key={qty}
                variant="outline"
                size="sm"
                onClick={() => setQuantity(qty.toString())}
                className="text-sm"
              >
                {qty}
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
