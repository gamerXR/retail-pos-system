import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import type { Product } from "~backend/pos/products";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductSelect: (product: Product) => void;
}

export default function SearchModal({ isOpen, onClose, onProductSelect }: SearchModalProps) {
  const [searchType, setSearchType] = useState<"barcode" | "name">("barcode");
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadAllProducts();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchValue.trim()) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchValue, searchType, allProducts]);

  const loadAllProducts = async () => {
    try {
      const response = await backend.pos.getProducts();
      setAllProducts(response.products);
    } catch (error) {
      console.error("Error loading products:", error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    }
  };

  const performSearch = () => {
    if (!searchValue.trim()) {
      setSearchResults([]);
      return;
    }

    const searchTerm = searchValue.toLowerCase().trim();
    let results: Product[] = [];

    if (searchType === "barcode") {
      // Search by barcode (exact match or partial match)
      results = allProducts.filter(product => 
        product.barcode?.toLowerCase().includes(searchTerm) ||
        product.id.toString().includes(searchTerm)
      );
    } else {
      // Search by name (partial match)
      results = allProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.secondName?.toLowerCase().includes(searchTerm)
      );
    }

    setSearchResults(results);
  };

  const handleProductSelect = (product: Product) => {
    onProductSelect(product);
    handleClose();
  };

  const handleClose = () => {
    setSearchValue("");
    setSearchResults([]);
    onClose();
  };

  const handleSearchTypeChange = (value: string) => {
    setSearchType(value as "barcode" | "name");
    setSearchValue("");
    setSearchResults([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-4">
              <span>Search</span>
              <div className="flex items-center gap-2">
                <Select value={searchType} onValueChange={handleSearchTypeChange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="barcode">Barcode</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder={searchType === "barcode" ? "Please enter barcode!" : "Please enter product name!"}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="w-80"
                  autoFocus
                />
              </div>
            </DialogTitle>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </DialogHeader>

        {/* Search Results Header */}
        <div className="grid grid-cols-3 gap-4 py-3 px-4 bg-gray-50 border-b font-medium text-gray-700">
          <div>Barcode</div>
          <div>Name</div>
          <div className="text-right">Price</div>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto">
          {searchValue.trim() === "" ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <p>Enter {searchType} to search for products</p>
                <p className="text-sm mt-2">
                  {searchType === "barcode" 
                    ? "You can search by barcode or product ID" 
                    : "You can search by product name or second name"
                  }
                </p>
              </div>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <p>No products found</p>
                <p className="text-sm mt-2">Try a different search term</p>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {searchResults.map((product) => (
                <div
                  key={product.id}
                  className="grid grid-cols-3 gap-4 py-3 px-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors"
                  onClick={() => handleProductSelect(product)}
                >
                  <div className="text-sm text-gray-600">
                    {product.barcode || `ID: ${product.id}`}
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">{product.name}</div>
                    {product.secondName && (
                      <div className="text-xs text-gray-500">{product.secondName}</div>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-green-600 text-right">
                    ${product.price.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with result count */}
        {searchValue.trim() && (
          <div className="border-t px-4 py-2 text-sm text-gray-500">
            {searchResults.length} product{searchResults.length !== 1 ? 's' : ''} found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
