import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { ChevronLeft, ChevronUp, ChevronDown, Upload, Search } from "lucide-react";
import { useBackend } from "../lib/auth";
import type { StockMovement } from "~backend/pos/stock";
import type { Product } from "~backend/pos/products";

interface StockReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StockReportModal({ isOpen, onClose }: StockReportModalProps) {
  const [dateFilter, setDateFilter] = useState<"today" | "shift">("today");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("All");
  const [reasonFilter, setReasonFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<StockMovement[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const backend = useBackend();

  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      setFromDate(todayStr + ' 00:00');
      setToDate(todayStr + ' 18:44');
      loadStockHistory();
    }
  }, [isOpen]);

  useEffect(() => {
    filterMovements();
  }, [movements, searchQuery]);

  const loadStockHistory = async () => {
    setIsLoading(true);
    try {
      const response = await backend.pos.getStockHistory({
        startDate: fromDate || undefined,
        endDate: toDate || undefined,
        employee: employeeFilter !== "All" ? employeeFilter : undefined,
        reason: reasonFilter !== "All" ? reasonFilter : undefined,
      });
      setMovements(response.movements);
      setFilteredMovements(response.movements);
    } catch (error) {
      console.error("Error loading stock history:", error);
      toast({
        title: "Error",
        description: "Failed to load stock history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterMovements = () => {
    let filtered = movements;

    if (searchQuery) {
      filtered = filtered.filter(m => 
        m.productName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredMovements(filtered);
  };

  const handleSearch = () => {
    loadStockHistory();
  };

  const handleExport = () => {
    const csv = [
      ["Time", "Item Name", "Original", "Quantity", "Current", "Reason", "Employee"],
      ...filteredMovements.map(m => [
        new Date(m.createdAt).toLocaleString(),
        m.productName,
        m.action === "stock-in" ? m.currentQuantity - m.quantity : m.currentQuantity + m.quantity,
        m.action === "stock-in" ? `+${m.quantity}` : `-${m.quantity}`,
        m.currentQuantity,
        m.action === "stock-in" ? "Stock In" : m.action === "stock-out" ? "Stock Out" : "Stock Loss",
        m.employee
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stock-history-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Stock history exported successfully",
    });
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    setFilteredMovements(prev => [...prev].reverse());
  };

  const getQuantityDisplay = (movement: StockMovement) => {
    if (movement.action === "stock-in") {
      return <span className="text-green-600">+{movement.quantity}</span>;
    } else {
      return <span className="text-red-600">-{movement.quantity}</span>;
    }
  };

  const getReasonDisplay = (action: string) => {
    switch (action) {
      case "stock-in":
        return "Stock In";
      case "stock-out":
        return "Stock Out";
      case "stock-loss":
        return "Stock Loss";
      default:
        return action;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-7xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              Stock History
            </DialogTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Export
            </Button>
          </div>
        </DialogHeader>

        <div className="flex h-[600px]">
          <div className="w-80 bg-gray-50 border-r border-gray-200 p-4 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Date</label>
              <div className="space-y-2">
                <Button
                  variant={dateFilter === "today" ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setDateFilter("today")}
                >
                  Today
                </Button>
                <Button
                  variant={dateFilter === "shift" ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setDateFilter("shift")}
                >
                  Shift
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">From</label>
              <Input
                type="datetime-local"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">To</label>
              <Input
                type="datetime-local"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Employee</label>
              <select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="All">All</option>
                <option value="6737165617">6737165617</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Reason</label>
              <select
                value={reasonFilter}
                onChange={(e) => setReasonFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="All">All</option>
                <option value="stock-in">Stock In</option>
                <option value="stock-out">Stock Out</option>
                <option value="stock-loss">Stock Loss</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Select Item</label>
              <div className="relative">
                <Input
                  placeholder="Barcode, Item Name, First Letter"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10"
                />
                <Search className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">From</span>
                  <span className="text-sm font-medium text-orange-600">{fromDate || 'Not set'}</span>
                  <span className="text-sm text-gray-600">To</span>
                  <span className="text-sm font-medium text-orange-600">{toDate || 'Not set'}</span>
                </div>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={handleSearch}
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : "Search"}
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      <div className="flex items-center gap-1 cursor-pointer" onClick={toggleSortOrder}>
                        Time
                        {sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Item Name</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Original</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Quantity</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Current</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Reason</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Employee</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMovements.map((movement) => (
                    <tr key={movement.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        {new Date(movement.createdAt).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm">{movement.productName}</td>
                      <td className="px-4 py-3 text-sm text-right">
                        {movement.action === "stock-in" 
                          ? movement.currentQuantity - movement.quantity 
                          : movement.currentQuantity + movement.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        {getQuantityDisplay(movement)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">{movement.currentQuantity}</td>
                      <td className="px-4 py-3 text-sm">{getReasonDisplay(movement.action)}</td>
                      <td className="px-4 py-3 text-sm">{movement.employee}</td>
                    </tr>
                  ))}
                  {filteredMovements.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                        {isLoading ? "Loading..." : "No stock movements found"}
                      </td>
                    </tr>
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
