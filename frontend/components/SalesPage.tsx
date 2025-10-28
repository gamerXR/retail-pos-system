import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Grid3X3, List, Settings, Trash2, Keyboard, ChevronLeft, ChevronRight, Plus, Clock, AlertTriangle } from "lucide-react";
import { useBackend } from "../lib/auth";
import type { Product } from "~backend/pos/products";
import type { Category } from "~backend/pos/categories";
import AddCategoryModal from "./AddCategoryModal";
import AddItemModal from "./AddItemModal";
import EditItemModal from "./EditItemModal";
import ProductContextMenu from "./ProductContextMenu";
import CategoryContextMenu from "./CategoryContextMenu";
import EditCategoryModal from "./EditCategoryModal";
import SettlementModal from "./SettlementModal";
import StockPage from "./StockPage";
import SearchModal from "./SearchModal";
import MoreMenuModal from "./MoreMenuModal";
import PrinterModal from "./PrinterModal";
import ShiftReportModal from "./ShiftReportModal";
import ReprintModal from "./ReprintModal";
import ReturnModal from "./ReturnModal";
import SettingsModal from "./SettingsModal";
import CustomItemModal from "./CustomItemModal";
import SalespersonManagementModal from "./SalespersonManagementModal";

interface SalesPageProps {
  onLogout?: () => void;
  userType: "licensed" | "trial" | null;
}

export default function SalesPage({ onLogout, userType }: SalesPageProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<Array<{ product: Product; quantity: number }>>([]);
  const [barcode, setBarcode] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [showStockPage, setShowStockPage] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showMoreMenuModal, setShowMoreMenuModal] = useState(false);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [showShiftReportModal, setShowShiftReportModal] = useState(false);
  const [showReprintModal, setShowReprintModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [showSalespersonModal, setShowSalespersonModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [contextMenuProduct, setContextMenuProduct] = useState<Product | null>(null);
  const [contextMenuCategory, setContextMenuCategory] = useState<Category | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [categoryContextMenuPosition, setCategoryContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [trialTimeRemaining, setTrialTimeRemaining] = useState<number | null>(null);
  const [deviceId] = useState(() => localStorage.getItem('deviceId') || 'unknown');
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const [printerConnected, setPrinterConnected] = useState(false);
  const { toast } = useToast();
  const backend = useBackend();

  useEffect(() => {
    loadCategories();
    loadProducts();
    checkPrinterStatus();
    autoConnectPrinter();
  }, []);

  useEffect(() => {
    if (selectedCategoryId) {
      loadProductsByCategory(selectedCategoryId);
    } else {
      loadProducts();
    }
  }, [selectedCategoryId]);

  // Check printer status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      checkPrinterStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const autoConnectPrinter = async () => {
    try {
      const savedPrinter = localStorage.getItem('selectedPrinter');
      if (!savedPrinter) {
        setPrinterConnected(false);
        return;
      }

      const printerInfo = JSON.parse(savedPrinter);
      
      if (printerInfo.connectionType === 'usb') {
        // Check if the USB device is still available
        if ('usb' in navigator) {
          const devices = await (navigator as any).usb.getDevices();
          const [vendorIdHex, productIdHex] = printerInfo.address.split(':').slice(1);
          const vendorId = parseInt(vendorIdHex, 16);
          const productId = parseInt(productIdHex, 16);
          
          const device = devices.find((d: any) => d.vendorId === vendorId && d.productId === productId);
          
          if (device) {
            setPrinterConnected(true);
            toast({
              title: "Printer Auto-Connected",
              description: `${printerInfo.name} is ready for use`,
            });
          } else {
            setPrinterConnected(false);
            // Remove the saved printer if device is no longer available
            localStorage.removeItem('selectedPrinter');
          }
        }
      } else {
        // For non-USB printers, assume they're connected if saved
        setPrinterConnected(true);
      }
    } catch (error) {
      console.error("Error auto-connecting printer:", error);
      setPrinterConnected(false);
    }
  };

  const checkPrinterStatus = async () => {
    try {
      const savedPrinter = localStorage.getItem('selectedPrinter');
      if (!savedPrinter) {
        setPrinterConnected(false);
        return;
      }

      const printerInfo = JSON.parse(savedPrinter);
      
      if (printerInfo.connectionType === 'usb') {
        // Check if USB device is still available
        if ('usb' in navigator) {
          const devices = await (navigator as any).usb.getDevices();
          const [vendorIdHex, productIdHex] = printerInfo.address.split(':').slice(1);
          const vendorId = parseInt(vendorIdHex, 16);
          const productId = parseInt(productIdHex, 16);
          
          const device = devices.find((d: any) => d.vendorId === vendorId && d.productId === productId);
          setPrinterConnected(!!device);
        } else {
          setPrinterConnected(false);
        }
      } else {
        // For other connection types, keep the status as is
        setPrinterConnected(true);
      }
    } catch (error) {
      console.error("Error checking printer status:", error);
      setPrinterConnected(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await backend.pos.getCategories();
      setCategories(response.categories);
      
      // Show welcome message for new users with no categories
      if (response.categories.length === 0 && userType === "licensed") {
        setShowWelcomeMessage(true);
        toast({
          title: "Welcome to Your POS System!",
          description: "Start by adding your first category and products to get started.",
        });
      }
      
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

  // Function to handle stock updates from StockPage
  const handleStockUpdate = async () => {
    // Reload products to reflect updated stock quantities
    if (selectedCategoryId) {
      await loadProductsByCategory(selectedCategoryId);
    } else {
      await loadProducts();
    }
    
    toast({
      title: "Stock Synchronized",
      description: "Product quantities have been updated on the sales page",
    });
  };

  const findProductByBarcode = (barcodeValue: string): Product | null => {
    // First try to find by exact barcode match
    let product = products.find(p => p.barcode === barcodeValue);
    
    // If not found by barcode, try to find by product ID (if barcode is numeric)
    if (!product && /^\d+$/.test(barcodeValue)) {
      const productId = parseInt(barcodeValue);
      product = products.find(p => p.id === productId);
    }
    
    // If still not found, try to find by name (partial match)
    if (!product) {
      product = products.find(p => 
        p.name.toLowerCase().includes(barcodeValue.toLowerCase())
      );
    }
    
    return product || null;
  };

  const handleBarcodeSubmit = () => {
    if (!barcode.trim()) {
      return;
    }

    const product = findProductByBarcode(barcode.trim());
    
    if (product) {
      if (product.isOffShelf) {
        toast({
          title: "Product Off Shelf",
          description: `${product.name} is currently off shelf and cannot be sold`,
          variant: "destructive",
        });
        return;
      }
      
      addToCart(product);
      setBarcode(""); // Clear barcode input after successful scan
      toast({
        title: "Product Added",
        description: `${product.name} added to cart via barcode`,
      });
    } else {
      toast({
        title: "Product Not Found",
        description: `No product found with barcode: ${barcode}`,
        variant: "destructive",
      });
    }
  };

  const handleBarcodeKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleBarcodeSubmit();
    }
  };

  const addToCart = (product: Product) => {
    if (product.isOffShelf) {
      toast({
        title: "Product Off Shelf",
        description: `${product.name} is currently off shelf and cannot be sold`,
        variant: "destructive",
      });
      return;
    }

    setCartItems(prev => {
      const existingItem = prev.find(item => item.product.id === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    
    toast({
      title: "Added to Cart",
      description: `${product.name} added to cart`,
    });
  };

  const removeFromCart = (productId: number) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateCartItemQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCartItems(prev => prev.map(item =>
      item.product.id === productId
        ? { ...item, quantity }
        : item
    ));
  };

  const getTotalAmount = () => {
    return cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const handleCategoryCreated = (category: Category) => {
    loadCategories();
    setSelectedCategoryId(category.id);
    setShowAddCategoryModal(false);
    setShowWelcomeMessage(false); // Hide welcome message after first category is created
  };

  const handleCategoryUpdated = (updatedCategory: Category) => {
    loadCategories();
    setShowEditCategoryModal(false);
    setEditingCategory(null);
  };

  const handleCategoryDeleted = (categoryId: number) => {
    loadCategories();
    if (selectedCategoryId === categoryId) {
      const remainingCategories = categories.filter(c => c.id !== categoryId);
      setSelectedCategoryId(remainingCategories.length > 0 ? remainingCategories[0].id : null);
    }
    setShowEditCategoryModal(false);
    setEditingCategory(null);
  };

  const handleItemCreated = (product: Product) => {
    setProducts(prev => [...prev, product]);
    setShowAddItemModal(false);
  };

  const handleCustomItemCreated = (product: Product) => {
    // For custom items, add directly to cart instead of product list
    addToCart(product);
    setShowCustomItemModal(false);
  };

  const handleItemUpdated = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    setShowEditItemModal(false);
    setEditingProduct(null);
  };

  const handleItemDeleted = (productId: number) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    setShowEditItemModal(false);
    setEditingProduct(null);
  };

  // Handle category right-click
  const handleCategoryRightClick = (category: Category, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    setContextMenuCategory(category);
    setCategoryContextMenuPosition({ x: event.clientX, y: event.clientY });
  };

  const handleCategoryContextMenuEdit = () => {
    if (contextMenuCategory) {
      setEditingCategory(contextMenuCategory);
      setShowEditCategoryModal(true);
    }
    closeCategoryContextMenu();
  };

  const closeCategoryContextMenu = () => {
    setContextMenuCategory(null);
    setCategoryContextMenuPosition(null);
  };

  // Handle product interactions - left click adds to cart, right click shows menu
  const handleProductClick = (product: Product, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Left click - add to cart
    if (event.button === 0) {
      addToCart(product);
    }
  };

  const handleProductRightClick = (product: Product, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    setContextMenuProduct(product);
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
  };

  // Handle touch events for mobile/tablet
  const handleProductTouchStart = (product: Product, event: React.TouchEvent) => {
    const touchTimer = setTimeout(() => {
      // Long press detected
      const touch = event.touches[0];
      setContextMenuProduct(product);
      setContextMenuPosition({ x: touch.clientX, y: touch.clientY });
    }, 800); // 800ms for long press

    // Store timer to clear it if touch ends early
    (event.currentTarget as any).touchTimer = touchTimer;
  };

  const handleProductTouchEnd = (product: Product, event: React.TouchEvent) => {
    const touchTimer = (event.currentTarget as any).touchTimer;
    if (touchTimer) {
      clearTimeout(touchTimer);
      // If it was a short touch, add to cart
      if (!contextMenuProduct) {
        addToCart(product);
      }
    }
  };

  const handleContextMenuEdit = () => {
    if (contextMenuProduct) {
      setEditingProduct(contextMenuProduct);
      setShowEditItemModal(true);
    }
    closeContextMenu();
  };

  const handleContextMenuStick = async () => {
    if (contextMenuProduct) {
      try {
        const updatedProduct = await backend.pos.stickProduct({ id: contextMenuProduct.id });
        
        // Update the product in the list and move it to the top
        setProducts(prev => {
          const filtered = prev.filter(p => p.id !== contextMenuProduct.id);
          return [updatedProduct, ...filtered];
        });
        
        toast({
          title: "Product Sticked",
          description: `${contextMenuProduct.name} moved to the top of the category`,
        });
      } catch (error) {
        console.error("Error sticking product:", error);
        toast({
          title: "Error",
          description: "Failed to stick product",
          variant: "destructive",
        });
      }
    }
    closeContextMenu();
  };

  const handleContextMenuOffShelf = async () => {
    if (contextMenuProduct) {
      try {
        const updatedProduct = await backend.pos.toggleOffShelf({ id: contextMenuProduct.id });
        
        // Update the product in the list
        setProducts(prev => prev.map(p => p.id === contextMenuProduct.id ? updatedProduct : p));
        
        // Remove from cart if it's being put off shelf
        if (updatedProduct.isOffShelf) {
          setCartItems(prev => prev.filter(item => item.product.id !== contextMenuProduct.id));
        }
        
        toast({
          title: updatedProduct.isOffShelf ? "Product Off Shelf" : "Product Back on Shelf",
          description: updatedProduct.isOffShelf 
            ? `${contextMenuProduct.name} is now off shelf and cannot be sold`
            : `${contextMenuProduct.name} is back on shelf and can be sold`,
        });
      } catch (error) {
        console.error("Error toggling off shelf:", error);
        toast({
          title: "Error",
          description: "Failed to toggle off shelf status",
          variant: "destructive",
        });
      }
    }
    closeContextMenu();
  };

  const closeContextMenu = () => {
    setContextMenuProduct(null);
    setContextMenuPosition(null);
  };

  const handleEnterClick = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Error",
        description: "Cart is empty",
        variant: "destructive",
      });
      return;
    }
    setShowSettlementModal(true);
  };

  const handleSaleComplete = () => {
    setCartItems([]);
    setShowSettlementModal(false);
    toast({
      title: "Success",
      description: "Sale completed successfully",
    });
  };

  const handleSearchProductSelect = (product: Product) => {
    addToCart(product);
  };

  const handlePrinterClick = () => {
    // Check printer status when clicked
    checkPrinterStatus();
    setShowPrinterModal(true);
  };

  const formatTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Close context menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuProduct) {
        closeContextMenu();
      }
      if (contextMenuCategory) {
        closeCategoryContextMenu();
      }
    };

    if (contextMenuProduct || contextMenuCategory) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenuProduct, contextMenuCategory]);

  if (showStockPage) {
    return (
      <StockPage 
        onBack={() => setShowStockPage(false)} 
        onStockUpdate={handleStockUpdate}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/nexpos-logo.png" alt="NexPos Logo" className="h-16" />
        </div>
        
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowStockPage(true)}
          >
            <Grid3X3 className="w-4 h-4" />
            Stock
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowMoreMenuModal(true)}
          >
            <List className="w-4 h-4" />
            More
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowSettingsModal(true)}
          >
            <Settings className="w-4 h-4" />
            Setting
          </Button>
        </div>
      </div>

      {/* Trial Status Banner */}
      {trialTimeRemaining !== null && (
        <div className={`p-3 text-center text-white ${
          trialTimeRemaining <= 5 ? 'bg-red-500' : trialTimeRemaining <= 15 ? 'bg-orange-500' : 'bg-blue-500'
        }`}>
          <div className="flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="font-medium">
              Trial Mode - {formatTime(trialTimeRemaining)} remaining
            </span>
            {trialTimeRemaining <= 5 && <AlertTriangle className="w-4 h-4" />}
          </div>
        </div>
      )}

      {/* Welcome Message for New Users */}
      {showWelcomeMessage && categories.length === 0 && (
        <div className="bg-green-50 border border-green-200 p-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-green-600 font-medium">
              🎉 Welcome to your new POS system! Start by adding your first category below.
            </span>
          </div>
        </div>
      )}

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
              onContextMenu={(e) => handleCategoryRightClick(category, e)}
            >
              {category.name}
            </Badge>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddCategoryModal(true)}
            className="ml-2"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Side - Cart */}
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
              onClick={() => setShowAddItemModal(true)}
            >
              <span className="text-4xl mr-2">+</span>
              Add Item
            </Button>
          </div>

          <div className="flex-1 p-4">
            {cartItems.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-400">
                  <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                    🛒
                  </div>
                  <p>No items in cart</p>
                  <p className="text-xs mt-2">Left click to add items</p>
                  <p className="text-xs mt-1">Right click or long press for options</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {cartItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-medium text-sm flex-1">{item.product.name}</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateCartItemQuantity(item.product.id, item.quantity - 1)}
                        className="w-6 h-6 p-0"
                      >
                        -
                      </Button>
                      <span className="text-sm w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateCartItemQuantity(item.product.id, item.quantity + 1)}
                        className="w-6 h-6 p-0"
                      >
                        +
                      </Button>
                    </div>
                    <span className="text-sm font-medium w-16 text-right">${(item.product.price * item.quantity).toFixed(2)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(item.product.id)}
                      className="ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <div className="border-t pt-2 mt-4">
                  <div className="flex justify-between items-center font-bold">
                    <span>Total:</span>
                    <span>${getTotalAmount().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Products */}
        <div className="flex-1 p-6">
          {categories.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-400">
                <div className="w-32 h-32 mx-auto mb-6 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-6xl">📦</span>
                </div>
                <h3 className="text-xl font-medium text-gray-600 mb-2">No Categories Yet</h3>
                <p className="text-gray-500 mb-6">Create your first category to start adding products</p>
                <Button
                  onClick={() => setShowAddCategoryModal(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Category
                </Button>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-400">
                <div className="w-32 h-32 mx-auto mb-6 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-6xl">📋</span>
                </div>
                <h3 className="text-xl font-medium text-gray-600 mb-2">No Products Yet</h3>
                <p className="text-gray-500 mb-6">Add your first product to this category</p>
                <Button
                  onClick={() => setShowAddItemModal(true)}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Product
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-4 mb-6">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow select-none ${
                      product.isOffShelf 
                        ? "opacity-50 bg-gray-100 border-red-300 cursor-not-allowed" 
                        : "hover:border-blue-300"
                    }`}
                    onClick={(e) => handleProductClick(product, e)}
                    onContextMenu={(e) => handleProductRightClick(product, e)}
                    onTouchStart={(e) => handleProductTouchStart(product, e)}
                    onTouchEnd={(e) => handleProductTouchEnd(product, e)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className={`font-medium text-sm flex-1 ${
                        product.isOffShelf ? "text-gray-500 line-through" : "text-gray-800"
                      }`}>
                        {product.name}
                      </h3>
                      {product.isOffShelf && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded ml-2">
                          OFF SHELF
                        </span>
                      )}
                      {product.sortOrder && product.sortOrder > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded ml-2">
                          📌
                        </span>
                      )}
                    </div>
                    <p className={`text-lg font-semibold ${
                      product.isOffShelf ? "text-gray-400" : "text-green-600"
                    }`}>
                      ${product.price.toFixed(2)}
                    </p>
                    <div className="flex justify-between items-center mt-1">
                      <p className={`text-xs ${
                        product.isOffShelf ? "text-gray-400" : "text-gray-500"
                      }`}>
                        Stock: {product.quantity}
                      </p>
                      {product.barcode && (
                        <p className={`text-xs ${
                          product.isOffShelf ? "text-gray-400" : "text-blue-500"
                        }`}>
                          #{product.barcode}
                        </p>
                      )}
                    </div>
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

              {/* Custom Item Button */}
              <div className="flex justify-end">
                <Button 
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800"
                  onClick={() => setShowCustomItemModal(true)}
                >
                  Custom Item
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-medium">Member</span>
            <Button variant="outline" size="sm">
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
            <div className="flex items-center gap-2">
              <div 
                className={`w-3 h-3 rounded-full cursor-pointer transition-colors ${
                  printerConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
                onClick={handlePrinterClick}
                title={printerConnected ? 'Printer Connected' : 'Printer Disconnected'}
              ></div>
              <span 
                className="cursor-pointer hover:text-blue-600"
                onClick={handlePrinterClick}
              >
                Printer
              </span>
              {printerConnected && (
                <span className="text-xs text-green-600 font-medium">Connected</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Scan barcode or enter product ID"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyPress={handleBarcodeKeyPress}
                className="w-64"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleBarcodeSubmit}
                disabled={!barcode.trim()}
              >
                Add
              </Button>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowSearchModal(true)}
            >
              <Keyboard className="w-4 h-4" />
            </Button>
            <Button 
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-8"
              onClick={handleEnterClick}
            >
              Enter
            </Button>
          </div>
        </div>
      </div>

      {/* Product Context Menu */}
      {contextMenuProduct && contextMenuPosition && (
        <ProductContextMenu
          position={contextMenuPosition}
          onSelect={() => addToCart(contextMenuProduct)}
          onEdit={handleContextMenuEdit}
          onStick={handleContextMenuStick}
          onOffShelf={handleContextMenuOffShelf}
          onCancel={closeContextMenu}
          isOffShelf={contextMenuProduct.isOffShelf}
        />
      )}

      {/* Category Context Menu */}
      {contextMenuCategory && categoryContextMenuPosition && (
        <CategoryContextMenu
          position={categoryContextMenuPosition}
          onEdit={handleCategoryContextMenuEdit}
          onCancel={closeCategoryContextMenu}
        />
      )}

      {/* Modals */}
      <AddCategoryModal
        isOpen={showAddCategoryModal}
        onClose={() => setShowAddCategoryModal(false)}
        onCategoryCreated={handleCategoryCreated}
      />

      {editingCategory && (
        <EditCategoryModal
          isOpen={showEditCategoryModal}
          onClose={() => {
            setShowEditCategoryModal(false);
            setEditingCategory(null);
          }}
          onCategoryUpdated={handleCategoryUpdated}
          onCategoryDeleted={handleCategoryDeleted}
          category={editingCategory}
        />
      )}

      <AddItemModal
        isOpen={showAddItemModal}
        onClose={() => setShowAddItemModal(false)}
        onItemCreated={handleItemCreated}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
      />

      <CustomItemModal
        isOpen={showCustomItemModal}
        onClose={() => setShowCustomItemModal(false)}
        onItemCreated={handleCustomItemCreated}
      />

      {editingProduct && (
        <EditItemModal
          isOpen={showEditItemModal}
          onClose={() => {
            setShowEditItemModal(false);
            setEditingProduct(null);
          }}
          onItemUpdated={handleItemUpdated}
          onItemDeleted={handleItemDeleted}
          product={editingProduct}
          categories={categories}
        />
      )}

      <SettlementModal
        isOpen={showSettlementModal}
        onClose={() => setShowSettlementModal(false)}
        cartItems={cartItems}
        onSaleComplete={handleSaleComplete}
      />

      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onProductSelect={handleSearchProductSelect}
      />

      <MoreMenuModal
        isOpen={showMoreMenuModal}
        onClose={() => setShowMoreMenuModal(false)}
        onLogout={onLogout}
        onShiftReport={() => setShowShiftReportModal(true)}
        onReprint={() => setShowReprintModal(true)}
        onReturn={() => setShowReturnModal(true)}
        onSalesperson={() => setShowSalespersonModal(true)}
      />

      <PrinterModal
        isOpen={showPrinterModal}
        onClose={() => setShowPrinterModal(false)}
      />

      <ShiftReportModal
        isOpen={showShiftReportModal}
        onClose={() => setShowShiftReportModal(false)}
        onLogout={onLogout || (() => {})}
      />

      <ReprintModal
        isOpen={showReprintModal}
        onClose={() => setShowReprintModal(false)}
      />

      <ReturnModal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      <SalespersonManagementModal
        isOpen={showSalespersonModal}
        onClose={() => setShowSalespersonModal(false)}
      />
    </div>
  );
}
