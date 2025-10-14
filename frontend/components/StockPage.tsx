import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { ChevronLeft, ChevronRight, Plus, Trash2, Edit, Keyboard } from "lucide-react";
import { useBackend } from "../lib/auth";
import type { Product } from "~backend/pos/products";
import type { Category } from "~backend/pos/categories";
import StockQuantityModal from "./StockQuantityModal";
import StockActionModal from "./StockActionModal";

interface StockPageProps {
  onBack: () => void;
  onStockUpdate?: () => void; // Callback to notify parent about stock updates
}

interface StockItem {
  product: Product;
  quantity: number;
  amount: number;
  action: "stock-in" | "stock-out" | "stock-loss";
}

export default function StockPage({ onBack, onStockUpdate }: StockPageProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [printBill, setPrintBill] = useState(true);
  const [barcode, setBarcode] = useState("");
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedAction, setSelectedAction] = useState<"stock-in" | "stock-out" | "stock-loss">("stock-in");
  const [actionModalPosition, setActionModalPosition] = useState<{ x: number; y: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const backend = useBackend();

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  useEffect(() => {
    if (selectedCategoryId) {
      loadProductsByCategory(selectedCategoryId);
    } else {
      loadProducts();
    }
  }, [selectedCategoryId]);

  const loadCategories = async () => {
    try {
      const response = await backend.pos.getCategories();
      setCategories(response.categories);
      if (response.categories.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(response.categories[0].id);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      });
    }
  };

  const loadProducts = async () => {
    try {
      const response = await backend.pos.getProducts();
      setProducts(response.products);
    } catch (error) {
      console.error("Error loading products:", error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    }
  };

  const loadProductsByCategory = async (categoryId: number) => {
    try {
      const response = await backend.pos.getProductsByCategory({ categoryId });
      setProducts(response.products);
    } catch (error) {
      console.error("Error loading products by category:", error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    }
  };

  const handleProductClick = (product: Product, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedProduct(product);
    setActionModalPosition({ x: event.clientX, y: event.clientY });
    setShowActionModal(true);
  };

  const handleActionSelect = (action: "stock-in" | "stock-out" | "stock-loss") => {
    setSelectedAction(action);
    setShowActionModal(false);
    setShowQuantityModal(true);
  };

  const handleQuantityConfirm = (quantity: number, amount: number) => {
    if (selectedProduct) {
      setStockItems(prev => {
        const existingItem = prev.find(item => 
          item.product.id === selectedProduct.id && item.action === selectedAction
        );
        if (existingItem) {
          return prev.map(item =>
            item.product.id === selectedProduct.id && item.action === selectedAction
              ? { ...item, quantity: item.quantity + quantity, amount: item.amount + amount }
              : item
          );
        }
        return [...prev, { product: selectedProduct, quantity, amount, action: selectedAction }];
      });

      const actionText = getActionDescription(selectedAction);
      
      toast({
        title: "Success",
        description: `${quantity} units of ${selectedProduct.name} ${actionText}`,
      });
    }
    setShowQuantityModal(false);
    setSelectedProduct(null);
  };

  const removeStockItem = (productId: number, action: "stock-in" | "stock-out" | "stock-loss") => {
    setStockItems(prev => prev.filter(item => !(item.product.id === productId && item.action === action)));
  };

  const handleDelete = () => {
    if (stockItems.length === 0) {
      toast({
        title: "Error",
        description: "No items to delete",
        variant: "destructive",
      });
      return;
    }
    
    setStockItems([]);
    toast({
      title: "Success",
      description: "All items removed",
    });
  };

  const handleRemark = () => {
    if (stockItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add items to add remarks",
        variant: "destructive",
      });
      return;
    }
    
    // TODO: Implement bulk remark functionality
    toast({
      title: "Info",
      description: "Remark functionality not implemented yet",
    });
  };

  const handleConfirm = async () => {
    if (stockItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add items to confirm",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Prepare stock updates
      const updates = stockItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        action: item.action,
        price: item.amount / item.quantity, // Calculate unit price
      }));

      // Send bulk stock update request
      const response = await backend.pos.updateStock({ updates });

      if (response.success) {
        const stockInCount = stockItems.filter(item => item.action === "stock-in").length;
        const stockOutCount = stockItems.filter(item => item.action === "stock-out").length;
        const stockLossCount = stockItems.filter(item => item.action === "stock-loss").length;
        
        let message = "Stock updated successfully";
        if (stockInCount > 0) message += ` (${stockInCount} added)`;
        if (stockOutCount > 0) message += ` (${stockOutCount} removed)`;
        if (stockLossCount > 0) message += ` (${stockLossCount} marked as damaged)`;

        toast({
          title: "Success",
          description: message,
        });

        // Clear stock items
        setStockItems([]);

        // Reload products to show updated quantities
        if (selectedCategoryId) {
          await loadProductsByCategory(selectedCategoryId);
        } else {
          await loadProducts();
        }

        // Notify parent component (SalesPage) about stock updates
        if (onStockUpdate) {
          onStockUpdate();
        }
      }
    } catch (error) {
      console.error("Error updating stock:", error);
      toast({
        title: "Error",
        description: "Failed to update stock. Please check quantities and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const closeActionModal = () => {
    setShowActionModal(false);
    setSelectedProduct(null);
    setActionModalPosition(null);
  };

  const getActionColor = (action: "stock-in" | "stock-out" | "stock-loss") => {
    switch (action) {
      case "stock-in": return "text-green-600";
      case "stock-out": return "text-red-600";
      case "stock-loss": return "text-orange-600";
      default: return "text-gray-600";
    }
  };

  const getActionBgColor = (action: "stock-in" | "stock-out" | "stock-loss") => {
    switch (action) {
      case "stock-in": return "bg-green-50 border-green-200";
      case "stock-out": return "bg-red-50 border-red-200";
      case "stock-loss": return "bg-orange-50 border-orange-200";
      default: return "bg-gray-50 border-gray-200";
    }
  };

  const getActionSymbol = (action: "stock-in" | "stock-out" | "stock-loss") => {
    switch (action) {
      case "stock-in": return "+";
      case "stock-out": return "-";
      case "stock-loss": return "⚠";
      default: return "";
    }
  };

  const getActionDescription = (action: "stock-in" | "stock-out" | "stock-loss") => {
    switch (action) {
      case "stock-in": return "added to inventory";
      case "stock-out": return "removed from inventory";
      case "stock-loss": return "marked as damaged";
      default: return "";
    }
  };

  const getActionLabel = (action: "stock-in" | "stock-out" | "stock-loss") => {
    switch (action) {
      case "stock-in": return "STOCK IN";
      case "stock-out": return "STOCK OUT";
      case "stock-loss": return "DAMAGED";
      default: return "";
    }
  };

  // Close action modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showActionModal) {
        closeActionModal();
      }
    };

    if (showActionModal) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showActionModal]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-2xl font-semibold text-gray-800">Stock Management</h1>
        </div>
        <div className="text-sm text-gray-600">
          <span className="text-green-600 font-medium">Stock In: +Add</span> | 
          <span className="text-red-600 font-medium ml-2">Stock Out: -Remove</span> | 
          <span className="text-orange-600 font-medium ml-2">Stock Loss: ⚠Damage</span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex gap-2 overflow-x-auto">
          {categories.map((category) => (
            <Badge
              key={category.id}
              variant={selectedCategoryId === category.id ? "default" : "secondary"}
              className={`px-4 py-2 whitespace-nowrap cursor-pointer ${
                selectedCategoryId === category.id 
                  ? "bg-red-500 text-white" 
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() => setSelectedCategoryId(category.id)}
            >
              {category.name}
            </Badge>
          ))}
          <Button variant="outline" size="sm" className="ml-2">
            <Plus className="w-4 h-4 mr-1" />
          </Button>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="sm">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Side - Stock Items */}
        <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <span className="font-medium">Item Name</span>
              <span className="font-medium">Qty</span>
              <span className="font-medium">Amount</span>
            </div>
            
            <Button
              variant="outline"
              className="w-full h-16 border-2 border-dashed border-gray-300 text-gray-500"
            >
              <span className="text-4xl mr-2">+</span>
              Click items to add
            </Button>
          </div>

          <div className="flex-1 p-4">
            {stockItems.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-400">
                  <p>Click on items to add stock changes</p>
                  <p className="text-xs mt-2">Choose Stock In (+), Stock Out (-), or Stock Loss (⚠)</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {stockItems.map((item, index) => (
                  <div key={index} className={`flex justify-between items-center p-3 rounded border ${getActionBgColor(item.action)}`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${getActionColor(item.action)}`}>
                          {getActionSymbol(item.action)}
                        </span>
                        <span className="font-medium text-sm">{item.product.name}</span>
                      </div>
                      <span className={`text-xs font-medium ${getActionColor(item.action)}`}>
                        {getActionLabel(item.action)}
                      </span>
                    </div>
                    <span className="text-sm w-8 text-center font-medium">{item.quantity}</span>
                    <span className="text-sm font-medium w-16 text-right">${item.amount.toFixed(2)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStockItem(item.product.id, item.action)}
                      className="ml-2 hover:bg-red-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <div className="border-t pt-2 mt-4">
                  <div className="flex justify-between items-center font-bold">
                    <span>Total Value:</span>
                    <span>${stockItems.reduce((total, item) => total + item.amount, 0).toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {stockItems.filter(item => item.action === "stock-in").length} additions, {" "}
                    {stockItems.filter(item => item.action === "stock-out").length} removals, {" "}
                    {stockItems.filter(item => item.action === "stock-loss").length} damaged
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Products Grid */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-4 gap-4 mb-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all select-none"
                onClick={(e) => handleProductClick(product, e)}
              >
                <h3 className="font-medium text-gray-800 mb-2 text-sm">{product.name}</h3>
                <p className="text-lg font-semibold text-green-600">${product.price.toFixed(2)}</p>
                <p className={`text-xs font-medium ${product.quantity <= 5 ? 'text-red-500' : 'text-gray-500'}`}>
                  Stock: {product.quantity}
                  {product.quantity <= 5 && <span className="ml-1">⚠ Low</span>}
                </p>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <Button variant="outline" size="sm">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-red-500 font-medium">1</span>
            <Button variant="outline" size="sm">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-medium">Print Bill</span>
              <Switch
                checked={printBill}
                onCheckedChange={setPrintBill}
                className="data-[state=checked]:bg-red-500"
              />
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDelete}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRemark}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Remark
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <Input
              placeholder="Barcode"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              className="w-48"
            />
            <Button variant="outline" size="sm">
              <Keyboard className="w-4 h-4" />
            </Button>
            <Button 
              className="bg-red-500 hover:bg-red-600 text-white px-8 font-medium"
              onClick={handleConfirm}
              disabled={isLoading || stockItems.length === 0}
            >
              {isLoading ? "Processing..." : `Confirm (${stockItems.length})`}
            </Button>
          </div>
        </div>
      </div>

      {/* Stock Action Modal */}
      {showActionModal && actionModalPosition && (
        <StockActionModal
          position={actionModalPosition}
          onSelect={() => handleActionSelect("stock-in")}
          onStockIn={() => handleActionSelect("stock-in")}
          onStockOut={() => handleActionSelect("stock-out")}
          onStockLoss={() => handleActionSelect("stock-loss")}
          onCancel={closeActionModal}
        />
      )}

      {/* Stock Quantity Modal */}
      <StockQuantityModal
        isOpen={showQuantityModal}
        onClose={() => {
          setShowQuantityModal(false);
          setSelectedProduct(null);
        }}
        onConfirm={handleQuantityConfirm}
        product={selectedProduct}
      />
    </div>
  );
}
