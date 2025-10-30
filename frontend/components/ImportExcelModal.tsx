import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { ChevronLeft, Upload, FileSpreadsheet, Download, AlertCircle } from "lucide-react";
import { useBackend } from "../lib/auth";
import * as XLSX from "xlsx";

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportExcelModal({ isOpen, onClose, onSuccess }: ImportExcelModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [updateExisting, setUpdateExisting] = useState(false);
  const { toast } = useToast();
  const backend = useBackend();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast({
          title: "Invalid File",
          description: "Please select an Excel file (.xlsx or .xls)",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        name: "Example Product 1",
        price: 10.50,
        quantity: 100,
        categoryName: "Electronics",
        barcode: "1234567890123",
        secondName: "产品1",
        wholesalePrice: 8.00,
        stockPrice: 7.50,
        origin: "China",
        ingredients: "N/A",
        remarks: "Example product"
      },
      {
        name: "Example Product 2",
        price: 25.00,
        quantity: 50,
        categoryName: "Food",
        barcode: "9876543210987",
        secondName: "产品2",
        wholesalePrice: 20.00,
        stockPrice: 18.00,
        origin: "USA",
        ingredients: "Wheat, Sugar",
        remarks: ""
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    
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

    XLSX.writeFile(workbook, "products_import_template.xlsx");

    toast({
      title: "Template Downloaded",
      description: "Template file has been downloaded successfully",
    });
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select an Excel file to import",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null });

      if (jsonData.length === 0) {
        toast({
          title: "Empty File",
          description: "The Excel file is empty or has no data",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }

      const products = jsonData.map((row: any) => ({
        name: row.name || row.Name,
        price: parseFloat(row.price || row.Price),
        quantity: row.quantity || row.Quantity ? parseInt(row.quantity || row.Quantity) : undefined,
        categoryName: row.categoryName || row.CategoryName || row.category || row.Category || undefined,
        barcode: row.barcode || row.Barcode || undefined,
        secondName: row.secondName || row.SecondName || undefined,
        wholesalePrice: row.wholesalePrice || row.WholesalePrice ? parseFloat(row.wholesalePrice || row.WholesalePrice) : undefined,
        stockPrice: row.stockPrice || row.StockPrice ? parseFloat(row.stockPrice || row.StockPrice) : undefined,
        origin: row.origin || row.Origin || undefined,
        ingredients: row.ingredients || row.Ingredients || undefined,
        remarks: row.remarks || row.Remarks || undefined,
      }));

      const response = await backend.pos.importProducts({
        products,
        updateExisting
      });

      const successMessage = [];
      if (response.imported > 0) successMessage.push(`${response.imported} imported`);
      if (response.updated > 0) successMessage.push(`${response.updated} updated`);
      if (response.errors.length > 0) successMessage.push(`${response.errors.length} errors`);

      toast({
        title: "Import Completed",
        description: successMessage.join(", "),
      });

      if (response.errors.length > 0 && response.errors.length <= 5) {
        response.errors.forEach(error => {
          console.error("Import error:", error);
        });
      }

      setSelectedFile(null);
      onSuccess();
    } catch (error: any) {
      console.error("Import error:", error);
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import products",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              Import Products from Excel
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 mb-2">Important Instructions:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Download the template to see the correct format</li>
                  <li>• Required columns: <strong>name</strong>, <strong>price</strong></li>
                  <li>• Optional columns: quantity, categoryName, barcode, sku, etc.</li>
                  <li>• Categories will be created automatically if they don't exist</li>
                  <li>• Duplicate products (by name/barcode/sku) will be skipped unless "Update Existing" is checked</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full gap-2 border-2 border-dashed border-gray-300 h-12"
              onClick={handleDownloadTemplate}
            >
              <Download className="w-4 h-4" />
              Download Excel Template
            </Button>

            <div>
              <input
                type="file"
                id="excel-file-input"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />
              <label 
                htmlFor="excel-file-input"
                className={`flex items-center gap-2 w-full border-2 border-gray-300 rounded-md h-16 px-4 cursor-pointer hover:bg-gray-50 transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Upload className="w-5 h-5 text-gray-600" />
                <div className="text-left flex-1">
                  <div className="font-semibold text-gray-900">
                    {selectedFile ? selectedFile.name : "Click to select Excel file"}
                  </div>
                  <div className="text-xs text-gray-500">
                    Supports .xlsx and .xls files
                  </div>
                </div>
              </label>
            </div>

            {selectedFile && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900">{selectedFile.name}</p>
                  <p className="text-xs text-green-700">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedFile(null)}
                  className="text-red-500 hover:text-red-600"
                >
                  Remove
                </Button>
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={updateExisting}
                onChange={(e) => setUpdateExisting(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">
                Update existing products (match by name, barcode, or SKU)
              </span>
            </label>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-orange-500 hover:bg-orange-600"
              onClick={handleImport}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Products
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
