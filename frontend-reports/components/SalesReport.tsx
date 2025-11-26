import { useState } from "react";
import backend from "../client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Calendar, TrendingUp, DollarSign, Download, RefreshCw } from "lucide-react";

export function SalesReport() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [salesData, setSalesData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Invalid dates",
        description: "Please select both start and end dates",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await backend.pos.getClientSalesReport({
        startDate,
        endDate
      });
      setSalesData(response.sales);
      toast({
        title: "Report generated",
        description: `Found ${response.sales.length} days of sales data`
      });
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error loading report",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const totalRevenue = salesData.reduce((sum, s) => sum + s.totalRevenue, 0);
  const totalSales = salesData.reduce((sum, s) => sum + s.totalSales, 0);
  const cashTotal = salesData.reduce((sum, s) => sum + s.cashSales, 0);
  const qrTotal = salesData.reduce((sum, s) => sum + s.qrSales, 0);
  const otherTotal = salesData.reduce((sum, s) => sum + s.otherSales, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Card className="border-t-4 border-t-indigo-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Sales Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-11"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleGenerate} 
                disabled={isLoading} 
                className="w-full h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Loading...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Generate
                  </span>
                )}
              </Button>
            </div>
            {salesData.length > 0 && (
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  className="w-full h-11"
                  onClick={() => toast({ title: "Export feature coming soon!" })}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {salesData.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Total Sales</p>
                    <p className="text-3xl font-bold text-blue-900 mt-1">{totalSales}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-200 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-blue-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-900 mt-1">฿{totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-purple-700">Cash</p>
                <p className="text-xl font-bold text-purple-900 mt-1">฿{cashTotal.toLocaleString()}</p>
                <Badge variant="outline" className="mt-2 text-xs">
                  {totalRevenue > 0 ? ((cashTotal / totalRevenue) * 100).toFixed(1) : 0}%
                </Badge>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-amber-700">QR Payment</p>
                <p className="text-xl font-bold text-amber-900 mt-1">฿{qrTotal.toLocaleString()}</p>
                <Badge variant="outline" className="mt-2 text-xs">
                  {totalRevenue > 0 ? ((qrTotal / totalRevenue) * 100).toFixed(1) : 0}%
                </Badge>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-pink-700">Other</p>
                <p className="text-xl font-bold text-pink-900 mt-1">฿{otherTotal.toLocaleString()}</p>
                <Badge variant="outline" className="mt-2 text-xs">
                  {totalRevenue > 0 ? ((otherTotal / totalRevenue) * 100).toFixed(1) : 0}%
                </Badge>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Daily Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sales
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cash
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        QR
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Other
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {salesData.map((sale, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {new Date(sale.date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="secondary">{sale.totalSales}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          ฿{sale.totalRevenue.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          ฿{sale.cashSales.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          ฿{sale.qrSales.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          ฿{sale.otherSales.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!isLoading && salesData.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
              <p className="text-gray-600">
                Select a date range and click "Generate" to view sales report
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
