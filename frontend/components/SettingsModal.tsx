import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { 
  ChevronLeft, 
  ChevronRight,
  FileText, 
  Package, 
  Settings as SettingsIcon, 
  Crown, 
  DollarSign, 
  Printer, 
  Database, 
  Info,
  User
} from "lucide-react";
import SalesSummaryModal from "./SalesSummaryModal";
import HardwareSettingsModal from "./HardwareSettingsModal";
import CashierReceiptModal from "./CashierReceiptModal";
import StockReportModal from "./StockReportModal";
import LowStockAlertModal from "./LowStockAlertModal";
import ItemsManagementModal from "./ItemsManagementModal";
import DualScreenModal from "./DualScreenModal";
import DayClosingReportModal from "./DayClosingReportModal";
import SalesCategoryReportModal from "./SalesCategoryReportModal";
import SalesTransactionReportModal from "./SalesTransactionReportModal";
import TopSalesReportModal from "./TopSalesReportModal";
import HourlySalesReportModal from "./HourlySalesReportModal";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems?: Array<{ product: any; quantity: number }>;
}

export default function SettingsModal({ isOpen, onClose, cartItems = [] }: SettingsModalProps) {
  const [selectedMenu, setSelectedMenu] = useState<string>("Report");
  const [showSalesSummary, setShowSalesSummary] = useState(false);
  const [showHardwareSettings, setShowHardwareSettings] = useState(false);
  const [showCashierReceipt, setShowCashierReceipt] = useState(false);
  const [showStockReport, setShowStockReport] = useState(false);
  const [showLowStockAlert, setShowLowStockAlert] = useState(false);
  const [showItemsManagement, setShowItemsManagement] = useState(false);
  const [showDualScreen, setShowDualScreen] = useState(false);
  const [showDayClosingReport, setShowDayClosingReport] = useState(false);
  const [showSalesCategoryReport, setShowSalesCategoryReport] = useState(false);
  const [showSalesTransactionReport, setShowSalesTransactionReport] = useState(false);
  const [showTopSalesReport, setShowTopSalesReport] = useState(false);
  const [showHourlySalesReport, setShowHourlySalesReport] = useState(false);
  const { toast } = useToast();

  const handleMenuAction = (action: string) => {
    if (action === "Sales Summary") {
      setShowSalesSummary(true);
      return;
    }
    
    if (action === "Printer Settings") {
      setShowHardwareSettings(true);
      return;
    }

    if (action === "Cashier Receipts") {
      setShowCashierReceipt(true);
      return;
    }

    if (action === "Barcode Receipt") {
      setShowHardwareSettings(true);
      return;
    }

    if (action === "Stock Report") {
      setShowStockReport(true);
      return;
    }

    if (action === "Low Stock Alert") {
      setShowLowStockAlert(true);
      return;
    }

    if (action === "Items") {
      setShowItemsManagement(true);
      return;
    }

    if (action === "Dual Screen") {
      setShowDualScreen(true);
      return;
    }

    if (action === "Day Closing Report") {
      setShowDayClosingReport(true);
      return;
    }

    if (action === "Sales Category") {
      setShowSalesCategoryReport(true);
      return;
    }

    if (action === "Sales Transaction") {
      setShowSalesTransactionReport(true);
      return;
    }

    if (action === "Top Sales") {
      setShowTopSalesReport(true);
      return;
    }

    if (action === "Hourly Sales") {
      setShowHourlySalesReport(true);
      return;
    }
    
    toast({
      title: "Feature",
      description: `${action} functionality will be implemented soon`,
    });
  };

  const handleMenuSelect = (menuName: string) => {
    setSelectedMenu(menuName);
  };

  const leftMenuItems = [
    {
      icon: FileText,
      label: "Report",
      color: "bg-orange-500",
      action: "Report"
    },
    {
      icon: Package,
      label: "Stock",
      color: "bg-blue-500",
      action: "Stock"
    },
    {
      icon: SettingsIcon,
      label: "Promotion",
      color: "bg-orange-500",
      action: "Promotion"
    },
    {
      icon: Crown,
      label: "Member",
      color: "bg-red-500",
      action: "Member"
    },
    {
      icon: DollarSign,
      label: "Cashier Settings",
      color: "bg-red-500",
      action: "Cashier Settings"
    },
    {
      icon: Printer,
      label: "Hardware",
      color: "bg-blue-500",
      action: "Hardware"
    },
    {
      icon: Database,
      label: "Data Processing",
      color: "bg-green-500",
      action: "Data Processing"
    },
    {
      icon: Info,
      label: "About",
      color: "bg-gray-500",
      action: "About"
    }
  ];

  const getMenuItems = (menuName: string) => {
    switch (menuName) {
      case "Report":
        return [
          { label: "Sales Summary", action: "Sales Summary" },
          { label: "Day Closing Report", action: "Day Closing Report" },
          { label: "Sales Category", action: "Sales Category" },
          { label: "Sales Transaction", action: "Sales Transaction" },
          { label: "Top Sales", action: "Top Sales" },
          { label: "Hourly Sales", action: "Hourly Sales" },
        ];
      case "Stock":
        return [
          { label: "Items", action: "Items" },
          { label: "Stock Report", action: "Stock Report" },
          { label: "Low Stock Alert", action: "Low Stock Alert" }
        ];
      case "Promotion":
        return [
          { label: "Create Promotion", action: "Create Promotion" },
        ];
      case "Member":
        return [
          { label: "Member Registration", action: "Member Registration" },
          { label: "Member List", action: "Member List" },
          { label: "Member Points", action: "Member Points" },
          { label: "Member Report", action: "Member Report" }
        ];
      case "Cashier Settings":
        return [
          { label: "User Management", action: "User Management" },
        ];
      case "Hardware":
        return [
          { label: "Cashier Receipts", action: "Cashier Receipts" },
          { label: "Barcode Receipt", action: "Barcode Receipt" },
          { label: "Dual Screen", action: "Dual Screen" }
        ];
      case "Data Processing":
        return [
          { label: "Backup Data", action: "Backup Data" },
          { label: "Restore Data", action: "Restore Data" },
        ];
      case "About":
        return [
          { label: "System Information", action: "System Information" },
        ];
      default:
        return [];
    }
  };

  const rightMenuItems = getMenuItems(selectedMenu);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                Settings
              </DialogTitle>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
                <span className="text-gray-700 font-medium">Admin</span>
              </div>
            </div>
          </DialogHeader>

          <div className="flex h-[600px]">
            {/* Left Sidebar */}
            <div className="w-80 bg-gray-50 border-r border-gray-200 overflow-y-auto">
              <div className="p-4 space-y-2">
                {leftMenuItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Button
                      key={item.action}
                      variant="ghost"
                      className={`w-full justify-start gap-3 p-4 h-auto ${
                        selectedMenu === item.label ? "bg-orange-100 border border-orange-200" : "hover:bg-white"
                      }`}
                      onClick={() => handleMenuSelect(item.label)}
                    >
                      <div className={`w-10 h-10 ${item.color} rounded-lg flex items-center justify-center`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-gray-800 font-medium">{item.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Right Content Area */}
            <div className="flex-1 p-6">
              <div className="space-y-4">
                {rightMenuItems.map((item) => (
                  <Button
                    key={item.action}
                    variant="ghost"
                    className="w-full justify-between p-4 h-auto border border-gray-200 hover:bg-gray-50"
                    onClick={() => handleMenuAction(item.action)}
                  >
                    <span className="text-gray-800 font-medium text-lg">{item.label}</span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sales Summary Modal */}
      <SalesSummaryModal
        isOpen={showSalesSummary}
        onClose={() => setShowSalesSummary(false)}
      />

      {/* Hardware Settings Modal */}
      <HardwareSettingsModal
        isOpen={showHardwareSettings}
        onClose={() => setShowHardwareSettings(false)}
      />

      {/* Cashier Receipt Modal */}
      <CashierReceiptModal
        isOpen={showCashierReceipt}
        onClose={() => setShowCashierReceipt(false)}
      />

      {/* Stock Report Modal */}
      <StockReportModal
        isOpen={showStockReport}
        onClose={() => setShowStockReport(false)}
      />

      {/* Low Stock Alert Modal */}
      <LowStockAlertModal
        isOpen={showLowStockAlert}
        onClose={() => setShowLowStockAlert(false)}
      />

      {/* Items Management Modal */}
      <ItemsManagementModal
        isOpen={showItemsManagement}
        onClose={() => setShowItemsManagement(false)}
      />

      {/* Dual Screen Modal */}
      <DualScreenModal
        isOpen={showDualScreen}
        onClose={() => setShowDualScreen(false)}
        cartItems={cartItems}
      />

      {/* Day Closing Report Modal */}
      <DayClosingReportModal
        isOpen={showDayClosingReport}
        onClose={() => setShowDayClosingReport(false)}
      />

      {/* Sales Category Report Modal */}
      <SalesCategoryReportModal
        isOpen={showSalesCategoryReport}
        onClose={() => setShowSalesCategoryReport(false)}
      />

      {/* Sales Transaction Report Modal */}
      <SalesTransactionReportModal
        isOpen={showSalesTransactionReport}
        onClose={() => setShowSalesTransactionReport(false)}
      />

      {/* Top Sales Report Modal */}
      <TopSalesReportModal
        isOpen={showTopSalesReport}
        onClose={() => setShowTopSalesReport(false)}
      />

      {/* Hourly Sales Report Modal */}
      <HourlySalesReportModal
        isOpen={showHourlySalesReport}
        onClose={() => setShowHourlySalesReport(false)}
      />
    </>
  );
}
