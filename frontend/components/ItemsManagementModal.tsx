import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { 
  ChevronLeft, 
  Plus, 
  Trash2, 
  Edit, 
  Search,
  Upload,
  Download,
  Package
} from "lucide-react";
import { useBackend } from "../lib/auth";
import type { Product } from "~backend/pos/products";
import type { Category } from "~backend/pos/categories";
import AddCategoryModal from "./AddCategoryModal";
import EditCategoryModal from "./EditCategoryModal";
import AddItemModal from "./AddItemModal";
import EditItemModal from "./EditItemModal";
import ImportExcelModal from "./ImportExcelModal";
import ExportExcelModal from "./ExportExcelModal";

interface ItemsManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ItemsManagementModal({ isOpen, onClose }: ItemsManagementModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showEditCategory, setShowEditCategory] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showEditItem, setShowEditItem] = useState(false);
  const [showImportExcel, setShowImportExcel] = useState(false);
  const [showExportExcel, setShowExportExcel] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { toast } = useToast();
  const backend = useBackend();

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      loadProducts();
    }
  }, [isOpen]);

  useEffect(() => {
    filterProducts();
  }, [selectedCategoryId, products, searchQuery]);

  const loadCategories = async () => {
    try {
      const response = await backend.pos.getCategories();
      setCategories(response.categories);
      if (response.categories.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(null);
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

  const filterProducts = () => {
    let filtered = products;

    if (selectedCategoryId !== null) {
      filtered = filtered.filter(p => p.categoryId === selectedCategoryId);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query) ||
        p.barcode?.toLowerCase().includes(query)
      );
    }

    setFilteredProducts(filtered);
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setShowEditCategory(true);
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      await backend.pos.deleteCategory({ id: categoryId });
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
      loadCategories();
      if (selectedCategoryId === categoryId) {
        setSelectedCategoryId(null);
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowEditItem(true);
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      await backend.pos.deleteProduct({ id: productId });
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
      loadProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  const handleImport = () => {
    setShowImportExcel(true);
  };

  const handleExport = () => {
    setShowExportExcel(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[95vw] max-h-[95vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                Items Management
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleImport}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Import
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex h-[75vh] gap-4">
            {/* Left Sidebar - Categories */}
            <div className="w-64 bg-gray-50 rounded-lg border border-gray-200 flex flex-col">
              <div className="p-3 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm">Categories</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowAddCategory(true)}
                    className="h-6 w-6 p-0"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                <Button
                  variant="ghost"
                  className={`w-full justify-start text-sm ${
                    selectedCategoryId === null ? "bg-orange-100 border border-orange-200" : "hover:bg-white"
                  }`}
                  onClick={() => setSelectedCategoryId(null)}
                >
                  <Package className="w-4 h-4 mr-2" />
                  All Items
                  <Badge variant="secondary" className="ml-auto">
                    {products.length}
                  </Badge>
                </Button>
                
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className={`group flex items-center gap-1 rounded-md ${
                      selectedCategoryId === category.id ? "bg-orange-100" : ""
                    }`}
                  >
                    <Button
                      variant="ghost"
                      className={`flex-1 justify-start text-sm ${
                        selectedCategoryId === category.id ? "bg-orange-100" : "hover:bg-white"
                      }`}
                      onClick={() => setSelectedCategoryId(category.id)}
                    >
                      {category.name}
                      <Badge variant="secondary" className="ml-auto">
                        {products.filter(p => p.categoryId === category.id).length}
                      </Badge>
                    </Button>
                    <div className="opacity-0 group-hover:opacity-100 flex gap-1 pr-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditCategory(category)}
                        className="h-6 w-6 p-0"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteCategory(category.id)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Content - Items List */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search by name, SKU, or barcode..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  onClick={() => setShowAddItem(true)}
                  className="bg-orange-500 hover:bg-orange-600 gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Item
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700 border-b">SKU</th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700 border-b">Name</th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700 border-b">Category</th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700 border-b">Barcode</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-700 border-b">Price</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-700 border-b">Stock</th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700 border-b">Status</th>
                      <th className="text-center p-3 text-sm font-semibold text-gray-700 border-b">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-gray-500">
                          <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                          <p>No items found</p>
                          <p className="text-sm mt-1">Add your first item to get started</p>
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((product) => (
                        <tr key={product.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 text-sm text-gray-600">{product.sku || "-"}</td>
                          <td className="p-3 text-sm font-medium text-gray-800">{product.name}</td>
                          <td className="p-3 text-sm text-gray-600">
                            {categories.find(c => c.id === product.categoryId)?.name || "-"}
                          </td>
                          <td className="p-3 text-sm text-gray-600">{product.barcode || "-"}</td>
                          <td className="p-3 text-sm text-right font-medium text-gray-800">
                            ${product.price.toFixed(2)}
                          </td>
                          <td className="p-3 text-sm text-right">
                            <span className={`font-medium ${
                              product.quantity <= 10 ? "text-red-500" :
                              product.quantity <= 50 ? "text-yellow-600" :
                              "text-green-600"
                            }`}>
                              {product.quantity}
                            </span>
                          </td>
                          <td className="p-3">
                            <Badge variant={product.status === "active" ? "default" : "secondary"}>
                              {product.status}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditProduct(product)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteProduct(product.id)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                <span>Total: {filteredProducts.length} items</span>
                <span>
                  Total Stock Value: ${filteredProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AddCategoryModal
        isOpen={showAddCategory}
        onClose={() => setShowAddCategory(false)}
        onSuccess={() => {
          setShowAddCategory(false);
          loadCategories();
        }}
      />

      <EditCategoryModal
        isOpen={showEditCategory}
        onClose={() => {
          setShowEditCategory(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
        onSuccess={() => {
          setShowEditCategory(false);
          setSelectedCategory(null);
          loadCategories();
        }}
      />

      <AddItemModal
        isOpen={showAddItem}
        onClose={() => setShowAddItem(false)}
        onSuccess={() => {
          setShowAddItem(false);
          loadProducts();
        }}
      />

      <EditItemModal
        isOpen={showEditItem}
        onClose={() => {
          setShowEditItem(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onSuccess={() => {
          setShowEditItem(false);
          setSelectedProduct(null);
          loadProducts();
        }}
      />

      <ImportExcelModal
        isOpen={showImportExcel}
        onClose={() => setShowImportExcel(false)}
        onSuccess={() => {
          setShowImportExcel(false);
          loadProducts();
          loadCategories();
        }}
      />

      <ExportExcelModal
        isOpen={showExportExcel}
        onClose={() => setShowExportExcel(false)}
      />
    </>
  );
}
