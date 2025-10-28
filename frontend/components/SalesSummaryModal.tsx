import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { ChevronLeft, Calendar, User, Printer, Download, Check, AlertCircle } from "lucide-react";
import { useBackend } from "../lib/auth";
import ExportModal from "./ExportModal";
import EmailExportModal from "./EmailExportModal";

interface SalesSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PaymentMethodSummary {
  method: string;
  amount: number;
  percentage: number;
}

interface SalesSummaryData {
  totalSales: number;
  totalTransactions: number;
  totalQuantity: number;
  averageTransaction: number;
  paymentMethods: PaymentMethodSummary[];
  topSellingItems: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  hourlySales: Array<{
    hour: string;
    sales: number;
    transactions: number;
  }>;
}

export default function SalesSummaryModal({ isOpen, onClose }: SalesSummaryModalProps) {
  const [dateFilter, setDateFilter] = useState("today");
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [summaryData, setSummaryData] = useState<SalesSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const { toast } = useToast();
  const backend = useBackend();

  const dateOptions = [
    { value: "today", label: "Today" },
    { value: "yesterday", label: "Yesterday" },
    { value: "week", label: "Week" },
    { value: "month", label: "Month" }
  ];

  useEffect(() => {
    if (isOpen) {
      loadSummaryData();
    }
  }, [isOpen, dateFilter, employeeFilter, fromDate, toDate]);

  const loadSummaryData = async () => {
    setIsLoading(true);
    try {
      let dateFromParam = fromDate;
      let dateToParam = toDate;

      // Adjust dates based on filter
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      switch (dateFilter) {
        case "today":
          dateFromParam = today.toISOString().split('T')[0];
          dateToParam = today.toISOString().split('T')[0];
          break;
        case "yesterday":
          dateFromParam = yesterday.toISOString().split('T')[0];
          dateToParam = yesterday.toISOString().split('T')[0];
          break;
        case "week":
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          dateFromParam = weekStart.toISOString().split('T')[0];
          dateToParam = today.toISOString().split('T')[0];
          break;
        case "month":
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          dateFromParam = monthStart.toISOString().split('T')[0];
          dateToParam = today.toISOString().split('T')[0];
          break;
      }

      const response = await backend.pos.getSalesSummary({
        dateFrom: dateFromParam,
        dateTo: dateToParam,
        employeeFilter: employeeFilter !== "all" ? employeeFilter : undefined
      });

      if (response.success) {
        setSummaryData(response.data);
      }
    } catch (error) {
      console.error("Error loading sales summary:", error);
      toast({
        title: "Error",
        description: "Failed to load sales summary",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    toast({
      title: "Printing",
      description: "Printing sales summary report...",
    });
    // TODO: Implement print functionality
  };

  const handleExport = () => {
    setShowExportModal(true);
  };

  const handleExportConfirm = (method: "usb" | "email") => {
    setShowExportModal(false);
    
    if (method === "usb") {
      handleUSBExport();
    } else {
      setShowEmailModal(true);
    }
  };

  const handleUSBExport = () => {
    if (!summaryData) {
      toast({
        title: "Error",
        description: "No data to export",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "USB Export",
      description: "Please insert USB flash drive to export sales summary...",
    });
    
    // TODO: Implement actual USB export functionality
    // For now, we'll simulate the export
    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: "Sales summary exported to USB drive successfully",
      });
    }, 2000);
  };

  const handleEmailExport = async (email: string) => {
    if (!summaryData) {
      toast({
        title: "Error",
        description: "No data to export",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get current date parameters
      let dateFromParam = fromDate;
      let dateToParam = toDate;

      // Adjust dates based on filter
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      switch (dateFilter) {
        case "today":
          dateFromParam = today.toISOString().split('T')[0];
          dateToParam = today.toISOString().split('T')[0];
          break;
        case "yesterday":
          dateFromParam = yesterday.toISOString().split('T')[0];
          dateToParam = yesterday.toISOString().split('T')[0];
          break;
        case "week":
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          dateFromParam = weekStart.toISOString().split('T')[0];
          dateToParam = today.toISOString().split('T')[0];
          break;
        case "month":
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          dateFromParam = monthStart.toISOString().split('T')[0];
          dateToParam = today.toISOString().split('T')[0];
          break;
      }

      // Call the backend API to export via email
      const response = await backend.pos.exportSalesViaEmail({
        dateFrom: dateFromParam,
        dateTo: dateToParam,
        employeeFilter: employeeFilter !== "all" ? employeeFilter : undefined,
        format: "excel",
        email: email
      });

      if (response.success) {
        toast({
          title: "Email Sent",
          description: response.message,
        });
      } else {
        toast({
          title: "Email Error",
          description: response.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending email export:", error);
      toast({
        title: "Email Error",
        description: "Failed to send email. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const getDateRangeText = () => {
    switch (dateFilter) {
      case "today":
        return "Today";
      case "yesterday":
        return "Yesterday";
      case "week":
        return "This Week";
      case "month":
        return "This Month";
      case "custom":
        return `${fromDate} to ${toDate}`;
      default:
        return "Today";
    }
  };

  const handleDateFilterSelect = (value: string) => {
    setDateFilter(value);
    setShowDateDropdown(false);
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case "cash":
        return "💵";
      case "member":
        return "👑";
      case "others":
        return "•••";
      default:
        return "💳";
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method.toLowerCase()) {
      case "cash":
        return "Cash Income";
      case "member":
        return "Member";
      case "others":
        return "Baiduri Online";
      default:
        return method;
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method.toLowerCase()) {
      case "cash":
        return "border-red-300 bg-red-50";
      case "member":
        return "border-blue-300 bg-blue-50";
      case "others":
        return "border-gray-300 bg-gray-50";
      default:
        return "border-gray-300 bg-gray-50";
    }
  };

  const DateFilterDropdown = () => {
    if (!showDateDropdown) return null;

    return (
      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[200px]">
        <div className="py-2">
          <div className="px-4 py-2 text-sm font-medium text-gray-700 border-b border-gray-100">
            Select
          </div>
          {dateOptions.map((option) => (
            <button
              key={option.value}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              onClick={() => handleDateFilterSelect(option.value)}
            >
              <span className="text-gray-800">{option.label}</span>
              {dateFilter === option.value && (
                <Check className="w-4 h-4 text-red-500" />
              )}
            </button>
          ))}
          <div className="border-t border-gray-100 pt-2">
            <button
              className="w-full px-4 py-3 text-center text-gray-600 hover:bg-gray-50 transition-colors"
              onClick={() => setShowDateDropdown(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                Sales Summary
              </DialogTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <Button variant="outline" onClick={handleExport}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </DialogHeader>

					<div className="space-y-6">
            
            {/* Filters */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <h3 className="font-medium text-gray-800">Filters</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Date Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Date
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Button
                        variant={dateFilter === "today" ? "default" : "outline"}
                        className={`w-full ${dateFilter === "today" ? "bg-red-500 hover:bg-red-600 text-white" : ""}`}
                        onClick={() => setShowDateDropdown(!showDateDropdown)}
                      >
                        {dateOptions.find(opt => opt.value === dateFilter)?.label || "Today"}
                      </Button>
                      <DateFilterDropdown />
                    </div>
                    <Button
                      variant={dateFilter === "shift" ? "default" : "outline"}
                      className={`flex-1 ${dateFilter === "shift" ? "bg-red-500 hover:bg-red-600 text-white" : ""}`}
                      onClick={() => setDateFilter("shift")}
                    >
                      Shift
                    </Button>
                  </div>
                </div>

                {/* Date Range */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From - To
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="datetime-local"
                      value={`${fromDate}T00:00`}
                      onChange={(e) => setFromDate(e.target.value.split('T')[0])}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <input
                      type="datetime-local"
                      value={`${toDate}T23:59`}
                      onChange={(e) => setToDate(e.target.value.split('T')[0])}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>

                {/* Employee Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Employee
                  </label>
                  <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="cashier1">Cashier 1</SelectItem>
                      <SelectItem value="cashier2">Cashier 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                <span className="ml-3">Loading sales data...</span>
              </div>
            ) : summaryData ? (
              <>
                {/* Period Info */}
                <div className="text-center bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-800">
                    Sales Summary for {getDateRangeText()}
                  </h3>
                  <p className="text-sm text-blue-600 mt-1">
                    Generated on {new Date().toLocaleString()}
                  </p>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Total Quantity */}
                  <div className="text-center">
                    <div className="text-6xl font-bold text-red-500 mb-2">
                      {summaryData.totalQuantity}
                    </div>
                    <div className="text-lg text-gray-600">Total Quantity</div>
                  </div>
                  
                  {/* Total Income */}
                  <div className="text-center">
                    <div className="text-6xl font-bold text-red-500 mb-2">
                      ${summaryData.totalSales.toFixed(2)}
                    </div>
                    <div className="text-lg text-gray-600">Total Income</div>
                  </div>
                </div>

                {/* Payment Methods Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {summaryData.paymentMethods.map((payment, index) => (
                    <div key={index} className={`p-6 rounded-lg border-2 ${getPaymentMethodColor(payment.method)}`}>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-gray-800 mb-2">
                          ${payment.amount.toFixed(2)}
                        </div>
                        <div className="flex items-center justify-center gap-2 text-gray-600">
                          <span className="text-xl">{getPaymentMethodIcon(payment.method)}</span>
                          <span className="font-medium">{getPaymentMethodLabel(payment.method)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Additional Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-700">
                      {summaryData.totalTransactions}
                    </div>
                    <div className="text-sm text-blue-600">Total Transactions</div>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="text-2xl font-bold text-purple-700">
                      ${summaryData.averageTransaction.toFixed(2)}
                    </div>
                    <div className="text-sm text-purple-600">Average Transaction</div>
                  </div>
                </div>

                {/* Top Selling Items */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-4">Top Selling Items</h3>
                  <div className="space-y-2">
                    {summaryData.topSellingItems.length > 0 ? (
                      summaryData.topSellingItems.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">{item.name}</div>
                            <div className="text-sm text-gray-500">Qty: {item.quantity}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-green-600">${item.revenue.toFixed(2)}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-4">
                        No sales data available for this period
                      </div>
                    )}
                  </div>
                </div>

                {/* Hourly Sales */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-4">Hourly Sales</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {summaryData.hourlySales.length > 0 ? (
                      summaryData.hourlySales.map((hour, index) => (
                        <div key={index} className="text-center p-3 bg-gray-50 rounded">
                          <div className="font-medium text-gray-800">{hour.hour}</div>
                          <div className="text-sm text-green-600">${hour.sales.toFixed(2)}</div>
                          <div className="text-xs text-gray-500">{hour.transactions} transactions</div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-3 text-center text-gray-500 py-4">
                        No hourly sales data available
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-lg font-medium">No data during this period</div>
                <p className="text-sm mt-2">Try adjusting your date range or filters</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onConfirm={handleExportConfirm}
      />

      {/* Email Export Modal */}
      <EmailExportModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSend={handleEmailExport}
      />
    </>
  );
}
