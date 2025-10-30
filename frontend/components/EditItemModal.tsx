import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, ChevronLeft } from "lucide-react";
import { useBackend } from "../lib/auth";
import type { Product } from "~backend/pos/products";
import type { Category } from "~backend/pos/categories";

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemUpdated: (product: Product) => void;
  onItemDeleted: (productId: number) => void;
  product: Product;
  categories: Category[];
}

export default function EditItemModal({ 
  isOpen, 
  onClose, 
  onItemUpdated, 
  onItemDeleted,
  product,
  categories
}: EditItemModalProps) {
  const [activeTab, setActiveTab] = useState<"basic" | "advance">("basic");
  const [formData, setFormData] = useState({
    barcode: "",
    name: "",
    secondName: "",
    categoryId: "",
    price: "",
    wholesalePrice: "",
    startQty: "",
    stockQty: "",
    stockPrice: "",
    totalAmount: "",
    shelfLife: "",
    origin: "",
    ingredients: "",
    remarks: "",
    weighing: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const backend = useBackend();

  useEffect(() => {
    if (product) {
      setFormData({
        barcode: product.barcode || "",
        name: product.name || "",
        secondName: product.secondName || "",
        categoryId: product.categoryId?.toString() || "",
        price: product.price?.toString() || "",
        wholesalePrice: product.wholesalePrice?.toString() || "",
        startQty: product.startQty?.toString() || "",
        stockQty: product.quantity?.toString() || "",
        stockPrice: product.stockPrice?.toString() || "",
        totalAmount: product.totalAmount?.toString() || "",
        shelfLife: product.shelfLife?.toString() || "",
        origin: product.origin || "",
        ingredients: product.ingredients || "",
        remarks: product.remarks || "",
        weighing: product.weighing || false
      });
    }
  }, [product]);

  useEffect(() => {
    // Calculate total amount when stock qty and stock price change
    const stockQty = parseFloat(formData.stockQty) || 0;
    const stockPrice = parseFloat(formData.stockPrice) || 0;
    const total = stockQty * stockPrice;
    setFormData(prev => ({ ...prev, totalAmount: total > 0 ? total.toFixed(2) : "" }));
  }, [formData.stockQty, formData.stockPrice]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdate = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter an item name",
        variant: "destructive",
      });
      return;
    }

    if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid price",
        variant: "destructive",
      });
      return;
    }

    if (!formData.categoryId) {
      toast({
        title: "Error",
        description: "Please select a category",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const updatedProduct = await backend.pos.updateProduct({
        id: product.id,
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        quantity: formData.stockQty ? parseInt(formData.stockQty) : undefined,
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : undefined,
        barcode: formData.barcode || undefined,
        secondName: formData.secondName || undefined,
        wholesalePrice: formData.wholesalePrice ? parseFloat(formData.wholesalePrice) : undefined,
        startQty: formData.startQty ? parseInt(formData.startQty) : undefined,
        stockPrice: formData.stockPrice ? parseFloat(formData.stockPrice) : undefined,
        totalAmount: formData.totalAmount ? parseFloat(formData.totalAmount) : undefined,
        shelfLife: formData.shelfLife ? parseInt(formData.shelfLife) : undefined,
        origin: formData.origin || undefined,
        ingredients: formData.ingredients || undefined,
        remarks: formData.remarks || undefined,
        weighing: formData.weighing
      });

      toast({
        title: "Success",
        description: "Item updated successfully",
      });

      onItemUpdated(updatedProduct);
    } catch (error: any) {
      console.error("Error updating item:", error);
      
      // Check if it's a duplicate name error
      if (error?.message?.includes("already exists in the selected category")) {
        toast({
          title: "Duplicate Name",
          description: "An item with this name already exists in the selected category. Please choose a different name.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update item",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this item?")) {
      return;
    }

    setIsLoading(true);
    try {
      await backend.pos.deleteProduct({ id: product.id });
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
      onItemDeleted(product.id);
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              Update product
            </DialogTitle>
            <div className="flex gap-2">
              <Button
                onClick={handleDelete}
                disabled={isLoading}
                variant="outline"
                className="text-gray-600"
              >
                Delete
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={isLoading}
                className="bg-gray-600 hover:bg-gray-700 text-white"
              >
                Save
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 mb-6">
          <Button
            variant={activeTab === "basic" ? "default" : "outline"}
            className={activeTab === "basic" ? "bg-red-500 hover:bg-red-600 text-white" : ""}
            onClick={() => setActiveTab("basic")}
          >
            Basic
          </Button>
          <Button
            variant={activeTab === "advance" ? "default" : "outline"}
            className={activeTab === "advance" ? "bg-gray-200 hover:bg-gray-300 text-gray-700" : ""}
            onClick={() => setActiveTab("advance")}
          >
            Advance
          </Button>
        </div>

        {activeTab === "basic" && (
          <div className="space-y-6">
            {/* Barcode */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className="col-span-2 text-sm font-medium text-gray-700">
                Barcode
              </label>
              <div className="col-span-8">
                <Input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => handleInputChange("barcode", e.target.value)}
                  placeholder="Use Scanner"
                  className="w-full"
                />
              </div>
              <Button variant="outline" size="sm" className="col-span-2 bg-red-500 hover:bg-red-600 text-white">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Name and 2nd Name */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className="col-span-2 text-sm font-medium text-gray-700">
                Name *
              </label>
              <div className="col-span-5">
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full border-l-4 border-l-green-500"
                  required
                />
              </div>
              <div className="col-span-1 text-center text-sm text-gray-500">
                2nd Name
              </div>
              <div className="col-span-4">
                <Input
                  type="text"
                  value={formData.secondName}
                  onChange={(e) => handleInputChange("secondName", e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            {/* Category and Price */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className="col-span-2 text-sm font-medium text-gray-700">
                Category *
              </label>
              <div className="col-span-4 flex items-center gap-2">
                <Select value={formData.categoryId} onValueChange={(value) => handleInputChange("categoryId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    )) || []}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="bg-red-500 hover:bg-red-600 text-white">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="col-span-2 text-center text-sm text-gray-500">
                Price *
              </div>
              <div className="col-span-4">
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  className="w-full bg-cyan-100"
                  required
                />
              </div>
            </div>

            {/* Wholesale and Start Qty */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className="col-span-2 text-sm font-medium text-gray-700">
                Wholesale...
              </label>
              <div className="col-span-4">
                <Input
                  type="number"
                  step="0.01"
                  value={formData.wholesalePrice}
                  onChange={(e) => handleInputChange("wholesalePrice", e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="col-span-2 text-center text-sm text-gray-500">
                Start Qty
              </div>
              <div className="col-span-4">
                <Input
                  type="number"
                  value={formData.startQty}
                  onChange={(e) => handleInputChange("startQty", e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            {/* Cost */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className="col-span-2 text-sm font-medium text-gray-700">
                Cost
              </label>
              <div className="col-span-10">
                <Input
                  type="number"
                  step="0.01"
                  value={formData.stockPrice}
                  onChange={(e) => handleInputChange("stockPrice", e.target.value)}
                  className="w-full text-orange-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Weighing */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className="col-span-2 text-sm font-medium text-gray-700">
                Weighing
              </label>
              <div className="col-span-10">
                <Switch
                  checked={formData.weighing}
                  onCheckedChange={(checked) => handleInputChange("weighing", checked)}
                />
              </div>
            </div>

            {/* Validation Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> Item names must be unique within the same category. You can use the same name in different categories.
              </p>
            </div>
          </div>
        )}

        {activeTab === "advance" && (
          <div className="space-y-6">
            {/* Shelf Life and Day */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className="col-span-2 text-sm font-medium text-gray-700">
                Shelf Life
              </label>
              <div className="col-span-8">
                <Input
                  type="number"
                  value={formData.shelfLife}
                  onChange={(e) => handleInputChange("shelfLife", e.target.value)}
                  className="w-full text-orange-500"
                  placeholder="0"
                />
              </div>
              <div className="col-span-2 text-center text-sm text-gray-500">
                Day
              </div>
            </div>

            {/* Remarks */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <label className="col-span-2 text-sm font-medium text-gray-700 pt-2">
                Remarks
              </label>
              <div className="col-span-10">
                <Textarea
                  value={formData.remarks}
                  onChange={(e) => handleInputChange("remarks", e.target.value)}
                  className="w-full min-h-[100px]"
                  placeholder="Enter remarks..."
                />
              </div>
            </div>

            {/* Origin */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <label className="col-span-2 text-sm font-medium text-gray-700 pt-2">
                Origin
              </label>
              <div className="col-span-10">
                <Textarea
                  value={formData.origin}
                  onChange={(e) => handleInputChange("origin", e.target.value)}
                  className="w-full min-h-[100px]"
                  placeholder="Enter origin..."
                />
              </div>
            </div>

            {/* Ingredients */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <label className="col-span-2 text-sm font-medium text-gray-700 pt-2">
                Ingredients
              </label>
              <div className="col-span-10">
                <Textarea
                  value={formData.ingredients}
                  onChange={(e) => handleInputChange("ingredients", e.target.value)}
                  className="w-full min-h-[100px]"
                  placeholder="Enter ingredients..."
                />
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
