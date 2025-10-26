import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { ChevronLeft, AlertTriangle } from "lucide-react";
import { useBackend } from "../lib/auth";
import type { LowStockItem } from "~backend/pos/stock";

interface LowStockAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LowStockAlertModal({ isOpen, onClose }: LowStockAlertModalProps) {
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const backend = useBackend();

  useEffect(() => {
    if (isOpen) {
      loadLowStockItems();
    }
  }, [isOpen]);

  const loadLowStockItems = async () => {
    setIsLoading(true);
    try {
      const response = await backend.pos.getLowStock();
      setLowStockItems(response.items);
    } catch (error) {
      console.error("Error loading low stock items:", error);
      toast({
        title: "Error",
        description: "Failed to load low stock items",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStockLevelColor = (quantity: number) => {
    if (quantity === 0) return "text-red-600 font-bold";
    if (quantity <= 2) return "text-red-500 font-semibold";
    if (quantity <= 5) return "text-orange-500 font-medium";
    return "text-gray-700";
  };

  const getStockLevelBg = (quantity: number) => {
    if (quantity === 0) return "bg-red-50 border-red-200";
    if (quantity <= 2) return "bg-red-50 border-red-100";
    if (quantity <= 5) return "bg-orange-50 border-orange-100";
    return "bg-gray-50 border-gray-200";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Low Stock Alert
            </DialogTitle>
            <div className="text-sm text-gray-600">
              <span className="font-medium">{lowStockItems.length}</span> items with low stock
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col h-[600px]">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-orange-900">Stock Alert Settings</h3>
                <p className="text-sm text-orange-700 mt-1">
                  Showing all items with quantity 5 or lower. Please restock these items soon to avoid running out.
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400">Loading low stock items...</p>
              </div>
            ) : lowStockItems.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium">All items are well stocked!</p>
                  <p className="text-sm text-gray-400 mt-1">No items with quantity 5 or lower</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {lowStockItems.map((item) => (
                  <div 
                    key={item.id} 
                    className={`flex items-center justify-between p-4 rounded-lg border ${getStockLevelBg(item.quantity)}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {item.quantity === 0 && (
                          <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded">
                            OUT OF STOCK
                          </span>
                        )}
                        <h3 className="font-medium text-gray-900">{item.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Price: <span className="font-medium">${item.price.toFixed(2)}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`w-5 h-5 ${item.quantity === 0 ? 'text-red-600' : 'text-orange-500'}`} />
                        <div>
                          <div className={`text-2xl font-bold ${getStockLevelColor(item.quantity)}`}>
                            {item.quantity}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.quantity === 0 ? 'No stock' : `${item.quantity} left`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {lowStockItems.length > 0 && (
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span className="font-medium text-red-600">
                    {lowStockItems.filter(i => i.quantity === 0).length}
                  </span> out of stock, {" "}
                  <span className="font-medium text-orange-600">
                    {lowStockItems.filter(i => i.quantity > 0 && i.quantity <= 5).length}
                  </span> low stock
                </div>
                <Button 
                  variant="default" 
                  className="bg-orange-500 hover:bg-orange-600"
                  onClick={loadLowStockItems}
                >
                  Refresh
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
