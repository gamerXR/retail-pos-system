import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import type { Category } from "~backend/pos/categories";

interface EditCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryUpdated: (category: Category) => void;
  onCategoryDeleted: (categoryId: number) => void;
  category: Category | null;
}

export default function EditCategoryModal({ 
  isOpen, 
  onClose, 
  onCategoryUpdated, 
  onCategoryDeleted,
  category 
}: EditCategoryModalProps) {
  const [name, setName] = useState("");
  const [showOnHomePage, setShowOnHomePage] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (category) {
      setName(category.name);
      setShowOnHomePage(true); // Default to true since we don't have this field in the backend yet
    }
  }, [category]);

  const handleUpdate = async () => {
    if (!category) return;
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a category name",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const updatedCategory = await backend.pos.updateCategory({
        id: category.id,
        name: name.trim(),
      });

      toast({
        title: "Success",
        description: "Category updated successfully",
      });

      onCategoryUpdated(updatedCategory);
      handleClose();
    } catch (error) {
      console.error("Error updating category:", error);
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!category) return;
    
    if (!confirm("Are you sure you want to delete this category? This action cannot be undone.")) {
      return;
    }

    setIsLoading(true);
    try {
      await backend.pos.deleteCategory({ id: category.id });
      
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });

      onCategoryDeleted(category.id);
      handleClose();
    } catch (error: any) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setName("");
    setShowOnHomePage(true);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Edit Category</DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
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
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Confirm
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Category name"
              className="w-full bg-cyan-50 border-cyan-200"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Show on Home Page
            </label>
            <Switch
              checked={showOnHomePage}
              onCheckedChange={setShowOnHomePage}
              className="data-[state=checked]:bg-red-500"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
