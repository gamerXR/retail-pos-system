import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { ChevronLeft, Clock, ChevronDown, ChevronUp } from "lucide-react";
import backend from "~backend/client";

interface HourlySalesReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HourlyItem {
  product_name: string;
  quantity: number;
  total_sales: number;
}

interface HourlySalesData {
  hour: string;
  hour_24: number;
  total_sales: number;
  transaction_count: number;
  items: HourlyItem[];
}

export default function HourlySalesReportModal({ isOpen, onClose }: HourlySalesReportModalProps) {
  const [hourlyData, setHourlyData] = useState<HourlySalesData[]>([]);
  const [expandedHour, setExpandedHour] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      setEndDate(today);
      fetchHourlySales(today, today);
    }
  }, [isOpen]);

  const fetchHourlySales = async (start: string, end: string) => {
    try {
      setLoading(true);
      const startDateTime = new Date(start + 'T00:00:00');
      const endDateTime = new Date(end + 'T23:59:59');
      
      const response = await backend.pos.getHourlySales({
        startDate: startDateTime,
        endDate: endDateTime
      });
      
      setHourlyData(response.hourlyData);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to load hourly sales report",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (startDate && endDate) {
      fetchHourlySales(startDate, endDate);
      setExpandedHour(null);
    }
  };

  const toggleHour = (hour24: number) => {
    setExpandedHour(expandedHour === hour24 ? null : hour24);
  };

  const totalSales = hourlyData.reduce((sum, hour) => sum + hour.total_sales, 0);
  const totalTransactions = hourlyData.reduce((sum, hour) => sum + hour.transaction_count, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Clock className="w-5 h-5 text-blue-500" />
              Hourly Sales Report
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
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

          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <div className="text-sm text-gray-600">Total Transactions</div>
              <div className="text-2xl font-bold text-gray-900">{totalTransactions}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Revenue</div>
              <div className="text-2xl font-bold text-green-600">${totalSales.toFixed(2)}</div>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-[500px] overflow-y-auto">
              {loading ? (
                <div className="px-4 py-8 text-center text-gray-500">Loading...</div>
              ) : hourlyData.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">No sales data available</div>
              ) : (
                <div className="divide-y">
                  {hourlyData.map((hour) => (
                    <div key={hour.hour_24} className="bg-white">
                      <div
                        className="px-4 py-3 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                        onClick={() => toggleHour(hour.hour_24)}
                      >
                        <div className="flex-1 grid grid-cols-4 gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Clock className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Time</div>
                              <div className="font-semibold text-gray-900">{hour.hour}</div>
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Transactions</div>
                            <div className="text-lg font-semibold text-gray-900">{hour.transaction_count}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Items Sold</div>
                            <div className="text-lg font-semibold text-gray-900">
                              {hour.items.reduce((sum, item) => sum + item.quantity, 0)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Revenue</div>
                            <div className="text-lg font-bold text-green-600">${hour.total_sales.toFixed(2)}</div>
                          </div>
                        </div>
                        <div className="ml-4">
                          {expandedHour === hour.hour_24 ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {expandedHour === hour.hour_24 && (
                        <div className="px-4 pb-4 bg-gray-50">
                          <div className="mt-2">
                            <div className="text-sm font-semibold text-gray-700 mb-2">
                              Items Sold During {hour.hour}:
                            </div>
                            {hour.items.length === 0 ? (
                              <div className="text-center text-gray-500 py-4">No items sold</div>
                            ) : (
                              <table className="w-full text-sm">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-3 py-2 text-left text-gray-600">Product</th>
                                    <th className="px-3 py-2 text-right text-gray-600">Quantity</th>
                                    <th className="px-3 py-2 text-right text-gray-600">Total Sales</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white">
                                  {hour.items.map((item, index) => (
                                    <tr key={index} className="border-b border-gray-100">
                                      <td className="px-3 py-2 text-gray-900">{item.product_name}</td>
                                      <td className="px-3 py-2 text-right text-gray-900">{item.quantity}</td>
                                      <td className="px-3 py-2 text-right font-semibold text-green-600">
                                        ${item.total_sales.toFixed(2)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot className="bg-gray-100">
                                  <tr>
                                    <td className="px-3 py-2 font-semibold text-gray-900">Total</td>
                                    <td className="px-3 py-2 text-right font-semibold text-gray-900">
                                      {hour.items.reduce((sum, item) => sum + item.quantity, 0)}
                                    </td>
                                    <td className="px-3 py-2 text-right font-semibold text-green-600">
                                      ${hour.items.reduce((sum, item) => sum + item.total_sales, 0).toFixed(2)}
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
