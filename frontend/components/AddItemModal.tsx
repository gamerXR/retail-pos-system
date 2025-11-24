import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Plus } from "lucide-react";
import { useBackend } from "../lib/auth";
import type { Product } from "~backend/pos/products";
import type { Category } from "~backend/pos/categories";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemCreated: (product: Product) => void;
  categories: Category[];
  selectedCategoryId: number | null;
}

export default function AddItemModal({ 
  isOpen, 
  onClose, 
  onItemCreated, 
  categories, 
  selectedCategoryId 
}: AddItemModalProps) {
  const [formData, setFormData] = useState({
    barcode: "",
    name: "",
    secondName: "",
    categoryId: selectedCategoryId?.toString() || "",
    price: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const backend = useBackend();

  useEffect(() => {
    if (selectedCategoryId) {
      setFormData(prev => ({ ...prev, categoryId: selectedCategoryId.toString() }));
    }
  }, [selectedCategoryId]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (saveAndAdd: boolean = false) => {
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
      const product = await backend.pos.createProduct({
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        quantity: 0,
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : undefined,
        barcode: formData.barcode || undefined,
        secondName: formData.secondName || undefined,
        weighing: false
      });

      toast({
        title: "Success",
        description: "Item created successfully",
      });

      onItemCreated(product);
      
      if (saveAndAdd) {
        resetForm();
      } else {
        handleClose();
      }
    } catch (error: any) {
      console.error("Error creating item:", error);
      
      if (error?.message?.includes("already exists in the selected category")) {
        toast({
          title: "Duplicate Name",
          description: "An item with this name already exists in the selected category. Please choose a different name.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to create item",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      barcode: "",
      name: "",
      secondName: "",
      categoryId: selectedCategoryId?.toString() || "",
      price: ""
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleClose}>
                ←
              </Button>
              Add Item
            </DialogTitle>
            <div className="flex gap-2">
              <Button
                onClick={() => handleSubmit(false)}
                disabled={isLoading}
                variant="outline"
              >
                Save
              </Button>
              <Button
                onClick={() => handleSubmit(true)}
                disabled={isLoading}
                className="text-white hover:opacity-90"
                style={{ backgroundColor: 'hsl(163.1, 88.1%, 19.8%)' }}
              >
                Save and Add
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Basic Tab Button */}
        <div className="flex gap-1 mb-6">
          <Button
            variant="default"
            className="text-white hover:opacity-90"
            style={{ backgroundColor: 'hsl(163.1, 88.1%, 19.8%)' }}
          >
            Basic
          </Button>
        </div>

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
            <Button 
              variant="outline" 
              size="sm" 
              className="col-span-2 text-white hover:opacity-90"
              style={{ backgroundColor: 'hsl(163.1, 88.1%, 19.8%)' }}
            >
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
              <Button 
                variant="outline" 
                size="sm" 
                className="text-white hover:opacity-90"
                style={{ backgroundColor: 'hsl(163.1, 88.1%, 19.8%)' }}
              >
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
                className="w-full"
                required
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
      </DialogContent>
    </Dialog>
  );
}
