import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { ChevronLeft, Keyboard } from "lucide-react";
import type { Product } from "~backend/pos/products";

interface CustomItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemCreated: (product: Product) => void;
}

export default function CustomItemModal({ isOpen, onClose, onItemCreated }: CustomItemModalProps) {
  const [name, setName] = useState("Custom Item");
  const [price, setPrice] = useState("0.00");
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleKeypadInput = (value: string) => {
    if (value === "⌫") {
      setPrice(prev => prev.length > 1 ? prev.slice(0, -1) : "0");
    } else if (value === ".") {
      if (!price.includes(".")) {
        setPrice(prev => prev + value);
      }
    } else {
      setPrice(prev => prev === "0" ? value : prev + value);
    }
  };

  const handleAddToCart = () => {
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid price",
        variant: "destructive",
      });
      return;
    }

    // Create a temporary custom item
    const customItem: Product = {
      id: Date.now(), // Temporary ID
      name: name.trim(),
      price: numericPrice,
      quantity: 1,
      categoryId: undefined,
      barcode: undefined,
      secondName: undefined,
      wholesalePrice: undefined,
      startQty: undefined,
      stockPrice: undefined,
      totalAmount: undefined,
      shelfLife: undefined,
      origin: undefined,
      ingredients: undefined,
      remarks: undefined,
      weighing: false,
      isOffShelf: false,
      sortOrder: undefined
    };

    onItemCreated(customItem);
    handleClose();
    
    toast({
      title: "Success",
      description: `${name} added to cart`,
    });
  };

  const handleClose = () => {
    setName("Custom Item");
    setPrice("0.00");
    setShowKeyboard(false);
    onClose();
  };

  const keypadNumbers = [
    ["1", "2", "3"],
    ["4", "5", "6"], 
    ["7", "8", "9"],
    [".", "0", "⌫"]
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleClose}>
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
              Custom Item
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex h-[600px]">
          {/* Left Side - Item Details */}
          <div className="flex-1 p-6 space-y-6">
            {/* Item Name */}
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-3">
                Item Name
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-14 text-lg"
                placeholder="Enter item name"
              />
            </div>

            {/* Price with Keyboard Button */}
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-3">
                Price
              </label>
              <div className="flex items-center gap-4">
                <Input
                  type="text"
                  value={`$${price}`}
                  readOnly
                  className="flex-1 h-14 text-2xl font-bold text-center bg-red-50 border-red-200"
                />
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setShowKeyboard(!showKeyboard)}
                  className="h-14 px-6"
                >
                  <Keyboard className="w-6 h-6" />
                </Button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <div className="pt-8">
              <Button
                onClick={handleAddToCart}
                disabled={isLoading}
                className="w-full h-16 text-2xl font-bold bg-red-500 hover:bg-red-600 text-white"
              >
                Add to Cart - ${price}
              </Button>
            </div>
          </div>

          {/* Right Side - Numeric Keypad */}
          {showKeyboard && (
            <div className="w-80 bg-gray-50 border-l border-gray-200 p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800 text-center">
                  Enter Price
                </h3>
                
                {/* Price Display */}
                <div className="bg-white p-4 rounded-lg border-2 border-gray-300">
                  <div className="text-4xl font-bold text-center text-red-600">
                    ${price}
                  </div>
                </div>

                {/* Numeric Keypad */}
                <div className="grid grid-cols-3 gap-3">
                  {keypadNumbers.flat().map((key, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-16 text-2xl font-semibold hover:bg-gray-100"
                      onClick={() => handleKeypadInput(key)}
                    >
                      {key === "⌫" ? "⌫" : key}
                    </Button>
                  ))}
                </div>

                {/* Quick Amount Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-4">
                  {["1.00", "5.00", "10.00", "20.00"].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      onClick={() => setPrice(amount)}
                      className="h-12 text-lg"
                    >
                      ${amount}
                    </Button>
                  ))}
                </div>

                {/* Clear Button */}
                <Button
                  variant="outline"
                  onClick={() => setPrice("0")}
                  className="w-full h-12 text-lg text-red-600 border-red-300 hover:bg-red-50"
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
