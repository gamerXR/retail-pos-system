import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { ChevronLeft, Printer, ChevronRight } from "lucide-react";
import backend from "~backend/client";

interface SalesCategoryReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CategorySales {
  category_id: number;
  category_name: string;
  total_quantity: number;
  total_sales: number;
}

interface CategoryItem {
  product_id: number;
  product_name: string;
  total_quantity: number;
  total_sales: number;
}

export default function SalesCategoryReportModal({ isOpen, onClose }: SalesCategoryReportModalProps) {
  const [categorySales, setCategorySales] = useState<CategorySales[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategorySales | null>(null);
  const [categoryItems, setCategoryItems] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      setEndDate(today);
      fetchCategorySales(today, today);
      setSelectedCategory(null);
    }
  }, [isOpen]);

  const fetchCategorySales = async (start: string, end: string) => {
    try {
      setLoading(true);
      const startDateTime = new Date(start + 'T00:00:00');
      const endDateTime = new Date(end + 'T23:59:59');
      
      const response = await backend.pos.getCategorySalesReport({
        startDate: startDateTime,
        endDate: endDateTime
      });
      
      setCategorySales(response.categories);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to load category sales report",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryItems = async (category: CategorySales) => {
    try {
      setItemsLoading(true);
      const startDateTime = new Date(startDate + 'T00:00:00');
      const endDateTime = new Date(endDate + 'T23:59:59');
      
      const response = await backend.pos.getCategoryItems({
        categoryId: category.category_id,
        startDate: startDateTime,
        endDate: endDateTime
      });
      
      setCategoryItems(response.items);
      setSelectedCategory(category);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to load category items",
        variant: "destructive"
      });
    } finally {
      setItemsLoading(false);
    }
  };

  const handleSearch = () => {
    if (startDate && endDate) {
      fetchCategorySales(startDate, endDate);
      setSelectedCategory(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setCategoryItems([]);
  };

  const totalQuantity = categorySales.reduce((sum, cat) => sum + cat.total_quantity, 0);
  const totalSales = categorySales.reduce((sum, cat) => sum + cat.total_sales, 0);

  const itemsTotalQuantity = categoryItems.reduce((sum, item) => sum + item.total_quantity, 0);
  const itemsTotalSales = categoryItems.reduce((sum, item) => sum + item.total_sales, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={selectedCategory ? handleBackToCategories : onClose}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {selectedCategory ? `${selectedCategory.category_name} - Items` : 'Sales Category Report'}
            </DialogTitle>
            <Button onClick={handlePrint} variant="outline" size="sm">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {!selectedCategory && (
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? "Loading..." : "Search"}
              </Button>
            </div>
          )}

          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-[400px] overflow-y-auto">
              {!selectedCategory ? (
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                        Category
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b">
                        Quantity Sold
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b">
                        Total Sales ($)
                      </th>
                      <th className="px-4 py-3 w-12 border-b"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {categorySales.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                          {loading ? "Loading..." : "No data available"}
                        </td>
                      </tr>
                    ) : (
                      categorySales.map((category) => (
                        <tr 
                          key={category.category_id} 
                          className="border-b hover:bg-gray-50 cursor-pointer"
                          onClick={() => fetchCategoryItems(category)}
                        >
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {category.category_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {category.total_quantity}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {category.total_sales.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-gray-400">
                            <ChevronRight className="w-4 h-4" />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {categorySales.length > 0 && (
                    <tfoot className="bg-gray-100 font-semibold sticky bottom-0">
                      <tr>
                        <td className="px-4 py-3 text-sm text-gray-900 border-t-2">
                          Total
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right border-t-2">
                          {totalQuantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right border-t-2" colSpan={2}>
                          $ {totalSales.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                        Item Name
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b">
                        Quantity Sold
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b">
                        Total Sales ($)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryItems.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                          {itemsLoading ? "Loading..." : "No items found"}
                        </td>
                      </tr>
                    ) : (
                      categoryItems.map((item) => (
                        <tr key={item.product_id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {item.product_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {item.total_quantity}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {item.total_sales.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {categoryItems.length > 0 && (
                    <tfoot className="bg-gray-100 font-semibold sticky bottom-0">
                      <tr>
                        <td className="px-4 py-3 text-sm text-gray-900 border-t-2">
                          Total
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right border-t-2">
                          {itemsTotalQuantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right border-t-2">
                          $ {itemsTotalSales.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
