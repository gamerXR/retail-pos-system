import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft } from "lucide-react";
import TemplateSelectionModal from "./TemplateSelectionModal";
import SearchModal from "./SearchModal";

interface LabelPrintingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LabelPrintingModal({ isOpen, onClose }: LabelPrintingModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [reversePrint, setReversePrint] = useState(false);
  const [printCopies, setPrintCopies] = useState(1);
  const [showTemplateSelection, setShowTemplateSelection] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    setShowTemplateSelection(false);
  };

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    setShowProductSearch(false);
  };

  const handlePrint = () => {
    if (!selectedTemplate) {
      alert("Please select a template");
      return;
    }
    if (!selectedProduct) {
      alert("Please select an item");
      return;
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const labelContent = generateLabelContent();
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Label Print</title>
            <style>
              body { 
                margin: 0; 
                padding: 0; 
                font-family: Arial, sans-serif;
              }
              @media print {
                @page {
                  size: ${selectedTemplate.width}mm ${selectedTemplate.height}mm;
                  margin: 0;
                }
              }
            </style>
          </head>
          <body>
            ${labelContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  const generateLabelContent = () => {
    let content = '';
    for (let i = 0; i < printCopies; i++) {
      content += `
        <div style="width: ${selectedTemplate.width}mm; height: ${selectedTemplate.height}mm; padding: 2mm; box-sizing: border-box; ${reversePrint ? 'transform: rotate(180deg);' : ''} page-break-after: always;">
          ${renderTemplateContent()}
        </div>
      `;
    }
    return content;
  };

  const renderTemplateContent = () => {
    const template = selectedTemplate;
    const product = selectedProduct;

    switch (template.id) {
      case 'small-item-name':
        return `
          <div style="font-size: 14px; font-weight: bold; margin-bottom: 3mm;">Item name</div>
          <div style="font-size: 12px;">Unit Price  ${product.price.toFixed(2)}</div>
        `;
      case 'small-item-price':
        return `
          <div style="font-size: 16px; font-weight: bold; margin-bottom: 3mm;">Unit Price:</div>
          <div style="font-size: 24px; font-weight: bold;">${product.price.toFixed(2)}</div>
        `;
      case 'small-item-barcode':
        return `
          <div style="text-align: center;">
            <svg style="height: 40px; width: 100%;"></svg>
            <div style="font-size: 10px; margin-top: 2mm;">${product.barcode || '6701234567891'}</div>
            <div style="font-size: 10px; margin-top: 1mm;">Unit Price: ${product.price.toFixed(2)}</div>
          </div>
        `;
      case 'weighing-class':
        return `
          <div style="text-align: center;">
            <div style="font-size: 12px; font-weight: bold;">${product.name}</div>
            <div style="font-size: 10px;">Weight(kg): 0.605</div>
            <div style="font-size: 10px;">Unit Price: ${product.price.toFixed(2)}</div>
            <svg style="height: 30px; width: 100%; margin-top: 2mm;"></svg>
            <div style="font-size: 8px;">Total Amount: ${(product.price * 0.605).toFixed(2)}</div>
            <div style="font-size: 8px;">Thank You</div>
          </div>
        `;
      case 'normal-item':
        return `
          <div>
            <div style="font-size: 14px; font-weight: bold; margin-bottom: 2mm;">${product.name}</div>
            <div style="font-size: 11px; margin-bottom: 1mm;">Mem. Price:  ${product.price.toFixed(2)}</div>
            <div style="font-size: 11px; margin-bottom: 3mm;">Normal Price: ${product.price.toFixed(2)}</div>
            <div style="text-align: center;">
              <svg style="height: 35px; width: 100%;"></svg>
              <div style="font-size: 9px; margin-top: 1mm;">${product.barcode || '6701234567891'}</div>
            </div>
            <div style="font-size: 9px; margin-top: 2mm; text-align: center;">Thank You</div>
          </div>
        `;
      case 'fresh-food':
        return `
          <div>
            <div style="font-size: 14px; font-weight: bold; margin-bottom: 2mm;">${product.name}</div>
            <div style="font-size: 11px;">Mem. Price:  ${product.price.toFixed(2)}</div>
            <div style="font-size: 11px; margin-bottom: 2mm;">Normal Price: ${product.price.toFixed(2)}</div>
            <div style="text-align: center;">
              <svg style="height: 35px; width: 100%;"></svg>
              <div style="font-size: 9px; margin-top: 1mm;">${product.barcode || '6701234567891'}</div>
            </div>
            <div style="font-size: 9px; margin-top: 1mm;">Production Date: ${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
            <div style="font-size: 9px;">Shelf Life(D):  7</div>
          </div>
        `;
      default:
        return `<div style="padding: 2mm;">${product.name}<br/>Price: ${product.price.toFixed(2)}</div>`;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <DialogTitle>Label printing</DialogTitle>
            </div>
          </DialogHeader>

          <div className="flex gap-6">
            <div className="w-80 bg-gray-100 rounded-lg p-4">
              <div className="text-center text-gray-400">Preview Area</div>
            </div>

            <div className="flex-1 space-y-4">
              <div 
                className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                onClick={() => setShowTemplateSelection(true)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">Choose Template</span>
                  <span className="text-red-500">*</span>
                </div>
                <span className="text-orange-500">
                  {selectedTemplate ? selectedTemplate.name : "please select"}
                  <span className="ml-2">›</span>
                </span>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Select Item</span>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-orange-500 border-orange-500"
                      onClick={() => setShowProductSearch(true)}
                    >
                      Ok
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowProductSearch(true)}
                    >
                      Select
                    </Button>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Barcode, Item Name, Fir..."
                  value={selectedProduct ? selectedProduct.name : ""}
                  readOnly
                  className="w-full px-3 py-2 border rounded-md bg-white"
                  onClick={() => setShowProductSearch(true)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <span className="font-medium">Reverse print</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reversePrint}
                    onChange={(e) => setReversePrint(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <span className="font-medium">Print Copies</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPrintCopies(Math.max(1, printCopies - 1))}
                  >
                    -
                  </Button>
                  <span className="w-12 text-center font-medium text-orange-500">{printCopies}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPrintCopies(printCopies + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>

              <Button
                onClick={handlePrint}
                className="w-full h-14 text-lg font-bold bg-red-500 hover:bg-red-600 text-white"
              >
                Print
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <TemplateSelectionModal
        isOpen={showTemplateSelection}
        onClose={() => setShowTemplateSelection(false)}
        onSelect={handleTemplateSelect}
      />

      <SearchModal
        isOpen={showProductSearch}
        onClose={() => setShowProductSearch(false)}
        onSelect={handleProductSelect}
      />
    </>
  );
}
