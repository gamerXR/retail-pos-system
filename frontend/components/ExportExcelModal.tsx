import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { ChevronLeft, Download, Mail, FileSpreadsheet } from "lucide-react";
import { useBackend } from "../lib/auth";
import * as XLSX from "xlsx";

interface ExportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportExcelModal({ isOpen, onClose }: ExportExcelModalProps) {
  const [email, setEmail] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const { toast } = useToast();
  const backend = useBackend();

  const exportToExcel = async () => {
    try {
      const response = await backend.pos.exportProducts();
      
      if (!response.products || response.products.length === 0) {
        toast({
          title: "No Data",
          description: "No products available to export",
          variant: "destructive",
        });
        return null;
      }

      const exportData = response.products.map(product => ({
        Name: product.name,
        Price: product.price,
        Quantity: product.quantity || 0,
        "Category Name": product.categoryName || "",
        Barcode: product.barcode || "",
        SKU: product.sku || "",
        "Second Name": product.secondName || "",
        "Wholesale Price": product.wholesalePrice || "",
        "Stock Price": product.stockPrice || "",
        Origin: product.origin || "",
        Ingredients: product.ingredients || "",
        Remarks: product.remarks || ""
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      const columnWidths = [
        { wch: 25 },
        { wch: 10 },
        { wch: 10 },
        { wch: 15 },
        { wch: 18 },
        { wch: 10 },
        { wch: 15 },
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
        { wch: 20 },
        { wch: 20 }
      ];
      worksheet['!cols'] = columnWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

      return workbook;
    } catch (error: any) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export products",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const workbook = await exportToExcel();
      
      if (workbook) {
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `products_export_${timestamp}.xlsx`;
        
        XLSX.writeFile(workbook, filename);

        toast({
          title: "Export Successful",
          description: `Products exported to ${filename}`,
        });

        onClose();
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleEmailExport = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsSendingEmail(true);
    try {
      const workbook = await exportToExcel();
      
      if (workbook) {
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });

        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64data = (reader.result as string).split(',')[1];
          
          try {
            toast({
              title: "Email Feature",
              description: "Email functionality will be implemented with email service integration. File downloaded locally instead.",
            });

            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `products_export_${timestamp}.xlsx`;
            XLSX.writeFile(workbook, filename);

            setEmail("");
            onClose();
          } catch (error: any) {
            console.error("Email send error:", error);
            toast({
              title: "Email Failed",
              description: "Failed to send email. File downloaded locally instead.",
              variant: "destructive",
            });
            
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `products_export_${timestamp}.xlsx`;
            XLSX.writeFile(workbook, filename);
          }
        };
        
        reader.readAsDataURL(blob);
      }
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              Export Products to Excel
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <FileSpreadsheet className="w-16 h-16 mx-auto mb-3 text-green-600" />
            <h3 className="font-semibold text-gray-900 mb-1">Export All Products</h3>
            <p className="text-sm text-gray-600">
              Export all your products data to an Excel file
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-3">Export Options:</h4>
              
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full gap-2 justify-start h-auto py-4 border-2"
                  onClick={handleDownload}
                  disabled={isExporting || isSendingEmail}
                >
                  <Download className="w-5 h-5 text-blue-600" />
                  <div className="text-left flex-1">
                    <div className="font-semibold text-gray-900">Download to Computer</div>
                    <div className="text-xs text-gray-500">Save Excel file locally</div>
                  </div>
                </Button>

                <div className="border-2 border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-orange-600" />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-sm">Send via Email</div>
                      <div className="text-xs text-gray-500">Receive Excel file in your inbox</div>
                    </div>
                  </div>
                  
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isExporting || isSendingEmail}
                    className="h-10"
                  />
                  
                  <Button
                    className="w-full bg-orange-500 hover:bg-orange-600 gap-2"
                    onClick={handleEmailExport}
                    disabled={isExporting || isSendingEmail || !email}
                  >
                    {isSendingEmail ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        Sending Email...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        Send to Email
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> The exported file will include all product details including 
              name, price, quantity, category, barcode, SKU, and other fields.
            </p>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={onClose}
            disabled={isExporting || isSendingEmail}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
