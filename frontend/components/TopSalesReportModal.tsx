import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { ChevronLeft, TrendingUp } from "lucide-react";
import backend from "~backend/client";

interface TopSalesReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TopSalesItem {
  product_id: number;
  product_name: string;
  category_name: string;
  total_quantity: number;
  total_sales: number;
  transaction_count: number;
}

interface Category {
  id: number;
  name: string;
}

export default function TopSalesReportModal({ isOpen, onClose }: TopSalesReportModalProps) {
  const [items, setItems] = useState<TopSalesItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterType, setFilterType] = useState<"all" | "item" | "category">("all");
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      setEndDate(today);
      fetchCategories();
      fetchTopSales(today, today, "all", undefined);
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const response = await backend.pos.getCategories();
      setCategories(response.categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchTopSales = async (start: string, end: string, type: "all" | "item" | "category", categoryId?: number) => {
    try {
      setLoading(true);
      const startDateTime = new Date(start + 'T00:00:00');
      const endDateTime = new Date(end + 'T23:59:59');
      
      const response = await backend.pos.getTopSales({
        startDate: startDateTime,
        endDate: endDateTime,
        filterType: type,
        categoryId: categoryId
      });
      
      setItems(response.items);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to load top sales report",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (startDate && endDate) {
      fetchTopSales(startDate, endDate, filterType, selectedCategory);
    }
  };

  const handleFilterChange = (type: "all" | "item" | "category") => {
    setFilterType(type);
    if (type !== "category") {
      setSelectedCategory(undefined);
    }
  };

  const totalQuantity = items.reduce((sum, item) => sum + item.total_quantity, 0);
  const totalRevenue = items.reduce((sum, item) => sum + item.total_sales, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <TrendingUp className="w-5 h-5 text-orange-500" />
              Top Sales Report
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
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
            <div>
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
          </div>

          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter By
              </label>
              <div className="flex gap-2">
                <Button
                  variant={filterType === "all" ? "default" : "outline"}
                  onClick={() => handleFilterChange("all")}
                  className="flex-1"
                >
                  All Items
                </Button>
                <Button
                  variant={filterType === "category" ? "default" : "outline"}
                  onClick={() => handleFilterChange("category")}
                  className="flex-1"
                >
                  By Category
                </Button>
              </div>
            </div>

            {filterType === "category" && (
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Category
                </label>
                <select
                  value={selectedCategory || ""}
                  onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            )}

            <Button onClick={handleSearch} disabled={loading}>
              {loading ? "Loading..." : "Search"}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <div className="text-sm text-gray-600">Total Items Sold</div>
              <div className="text-2xl font-bold text-gray-900">{totalQuantity}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Revenue</div>
              <div className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(2)}</div>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                      Rank
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                      Product Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                      Category
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b">
                      Qty Sold
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b">
                      Transactions
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b">
                      Total Sales ($)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No sales data available
                      </td>
                    </tr>
                  ) : (
                    items.map((item, index) => (
                      <tr key={item.product_id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0 ? 'bg-yellow-100 text-yellow-800' :
                            index === 1 ? 'bg-gray-200 text-gray-700' :
                            index === 2 ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-50 text-gray-600'
                          }`}>
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {item.product_name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {item.category_name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {item.total_quantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">
                          {item.transaction_count}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-green-600 text-right">
                          ${item.total_sales.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
