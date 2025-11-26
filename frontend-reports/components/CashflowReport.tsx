import { useState } from "react";
import backend from "../client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { 
  Wallet, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Download, 
  RefreshCw,
  CreditCard,
  QrCode,
  Minus,
  Plus
} from "lucide-react";

export function CashflowReport() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [cashflowData, setCashflowData] = useState<any>(null);
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
      const response = await backend.pos.getClientCashflow({
        startDate,
        endDate
      });
      setCashflowData(response);
      toast({
        title: "Report generated",
        description: "Cashflow report loaded successfully"
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Card className="border-t-4 border-t-green-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-green-600" />
            Cashflow Report
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
                className="w-full h-11 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Loading...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Generate
                  </span>
                )}
              </Button>
            </div>
            {cashflowData && (
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

      {cashflowData && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base font-medium text-gray-700">Opening Balance</CardTitle>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-gray-900">฿{cashflowData.openingBalance.toLocaleString()}</p>
                <p className="text-sm text-gray-600 mt-2">Starting cash position</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base font-medium text-gray-700">Closing Balance</CardTitle>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-gray-900">฿{cashflowData.closingBalance.toLocaleString()}</p>
                <p className="text-sm text-gray-600 mt-2">Ending cash position</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-t-4 border-t-green-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Total Income
                  </CardTitle>
                  <Badge variant="success" className="text-base px-3 py-1">
                    +฿{cashflowData.totalIncome.toLocaleString()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-green-700" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Cash Sales</p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {cashflowData.totalIncome > 0 ? ((cashflowData.cashSales / cashflowData.totalIncome) * 100).toFixed(1) : 0}% of total
                        </p>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-green-900">฿{cashflowData.cashSales.toLocaleString()}</p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center">
                        <QrCode className="w-5 h-5 text-blue-700" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">QR Payments</p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {cashflowData.totalIncome > 0 ? ((cashflowData.qrSales / cashflowData.totalIncome) * 100).toFixed(1) : 0}% of total
                        </p>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-blue-900">฿{cashflowData.qrSales.toLocaleString()}</p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-200 rounded-lg flex items-center justify-center">
                        <Plus className="w-5 h-5 text-purple-700" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Other Payments</p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {cashflowData.totalIncome > 0 ? ((cashflowData.otherSales / cashflowData.totalIncome) * 100).toFixed(1) : 0}% of total
                        </p>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-purple-900">฿{cashflowData.otherSales.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-red-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-red-600" />
                    Total Expenses
                  </CardTitle>
                  <Badge variant="destructive" className="text-base px-3 py-1">
                    -฿{cashflowData.totalExpenses.toLocaleString()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-200 rounded-lg flex items-center justify-center">
                      <Minus className="w-6 h-6 text-red-700" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Total Outflow</p>
                      <p className="text-xs text-gray-600 mt-1">All expenses and costs</p>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-red-900">฿{cashflowData.totalExpenses.toLocaleString()}</p>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-gray-700">Expense Ratio</p>
                    <Badge variant="outline">
                      {cashflowData.totalIncome > 0 
                        ? ((cashflowData.totalExpenses / cashflowData.totalIncome) * 100).toFixed(1) 
                        : 0}%
                    </Badge>
                  </div>
                  <div className="bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-red-500 to-orange-500 h-3 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.min(cashflowData.totalIncome > 0 
                          ? (cashflowData.totalExpenses / cashflowData.totalIncome) * 100 
                          : 0, 100)}%` 
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">Expenses as percentage of income</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className={`border-t-4 ${cashflowData.netCashflow >= 0 ? 'border-t-green-500 bg-gradient-to-br from-green-50/50 to-emerald-50/50' : 'border-t-red-500 bg-gradient-to-br from-red-50/50 to-orange-50/50'}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xl">
                  {cashflowData.netCashflow >= 0 ? (
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  )}
                  Net Cashflow
                </CardTitle>
                <Badge 
                  variant={cashflowData.netCashflow >= 0 ? "success" : "destructive"}
                  className="text-lg px-4 py-2"
                >
                  {cashflowData.netCashflow >= 0 ? '+' : ''}฿{cashflowData.netCashflow.toLocaleString()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white rounded-xl border border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Total Income</p>
                  <p className="text-2xl font-bold text-green-600">฿{cashflowData.totalIncome.toLocaleString()}</p>
                </div>
                <div className="flex items-center justify-center">
                  <div className="text-3xl font-bold text-gray-400">-</div>
                </div>
                <div className="text-center p-4 bg-white rounded-xl border border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">฿{cashflowData.totalExpenses.toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-6 text-center p-6 bg-white rounded-xl border-2 border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Net Change in Cash</p>
                <p className={`text-5xl font-bold ${cashflowData.netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {cashflowData.netCashflow >= 0 ? '+' : ''}฿{cashflowData.netCashflow.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 mt-3">
                  {cashflowData.netCashflow >= 0 
                    ? 'Positive cashflow indicates healthy business growth' 
                    : 'Negative cashflow requires attention and cost optimization'}
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!isLoading && !cashflowData && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
              <p className="text-gray-600">
                Select a date range and click "Generate" to view cashflow report
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
