import { useState, useEffect } from "react";
import backend from "../client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { SalesReport } from "./SalesReport";
import { CategoryReport } from "./CategoryReport";
import { TopProductsReport } from "./TopProductsReport";
import { CashflowReport } from "./CashflowReport";
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  LogOut, 
  ShoppingCart,
  DollarSign,
  PieChart,
  Star,
  Wallet,
  Home
} from "lucide-react";

interface DashboardProps {
  clientData: any;
  onLogout: () => void;
}

type TabType = "overview" | "sales" | "categories" | "products" | "cashflow";

export function Dashboard({ clientData, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    setIsLoading(true);
    try {
      const response = await backend.pos.getClientDashboard();
      setStats(response);
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error loading dashboard",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: Home },
    { id: "sales" as TabType, label: "Sales Report", icon: ShoppingCart },
    { id: "categories" as TabType, label: "Categories", icon: PieChart },
    { id: "products" as TabType, label: "Top Products", icon: Star },
    { id: "cashflow" as TabType, label: "Cashflow", icon: Wallet },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">NexPOS Reports</h1>
                <p className="text-sm text-gray-600">{clientData.clientName}</p>
              </div>
            </div>
            <Button 
              onClick={onLogout} 
              variant="outline"
              className="flex items-center gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1">
            <nav className="flex gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600 font-medium">Loading dashboard...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow duration-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Total Sales
                      </CardTitle>
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <ShoppingCart className="w-5 h-5 text-blue-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900">{stats?.totalSales || 0}</div>
                      <p className="text-xs text-gray-500 mt-1">Total transactions</p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow duration-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Total Revenue
                      </CardTitle>
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-green-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900">฿{stats?.totalRevenue?.toLocaleString() || 0}</div>
                      <p className="text-xs text-gray-500 mt-1">All time revenue</p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow duration-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Total Products
                      </CardTitle>
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-purple-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900">{stats?.totalProducts || 0}</div>
                      <p className="text-xs text-gray-500 mt-1">In inventory</p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-shadow duration-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Low Stock Items
                      </CardTitle>
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900">{stats?.lowStockItems || 0}</div>
                      <p className="text-xs text-gray-500 mt-1">Needs attention</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="hover:shadow-lg transition-shadow duration-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                        Quick Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Average Sale Value</span>
                        <span className="text-lg font-bold text-gray-900">
                          ฿{stats?.totalSales > 0 ? ((stats?.totalRevenue || 0) / stats?.totalSales).toFixed(2) : 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Status</span>
                        <Badge variant={stats?.lowStockItems > 5 ? "destructive" : "success"}>
                          {stats?.lowStockItems > 5 ? "Action Required" : "All Good"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow duration-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-purple-600" />
                        Available Reports
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <button
                        onClick={() => setActiveTab("sales")}
                        className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-lg transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-700">Sales Report</span>
                        <ShoppingCart className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => setActiveTab("categories")}
                        className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-lg transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-700">Category Analysis</span>
                        <PieChart className="w-4 h-4 text-purple-600" />
                      </button>
                      <button
                        onClick={() => setActiveTab("cashflow")}
                        className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-lg transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-700">Cashflow Report</span>
                        <Wallet className="w-4 h-4 text-green-600" />
                      </button>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "sales" && <SalesReport />}
        {activeTab === "categories" && <CategoryReport />}
        {activeTab === "products" && <TopProductsReport />}
        {activeTab === "cashflow" && <CashflowReport />}
      </div>
    </div>
  );
}
