import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, X } from "lucide-react";
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

  const renderPreview = () => {
    if (!selectedTemplate || !selectedProduct) {
      return <div className="text-center text-gray-400 py-20">Select template and item to preview</div>;
    }

    const scale = 2.5;
    const product = selectedProduct;

    if (selectedTemplate.type === 'custom' && selectedTemplate.elements) {
      return (
        <div
          className="bg-white border-2 border-gray-300 relative"
          style={{
            width: `${selectedTemplate.width * scale}mm`,
            height: `${selectedTemplate.height * scale}mm`,
          }}
        >
          {selectedTemplate.elements.map((element: any) => (
            <div
              key={element.id}
              className="absolute"
              style={{
                left: `${element.x * scale}mm`,
                top: `${element.y * scale}mm`,
                width: element.width ? `${element.width * scale}mm` : 'auto',
                height: element.height ? `${element.height * scale}mm` : 'auto',
                fontSize: element.fontSize ? `${element.fontSize}px` : '12px',
              }}
            >
              {element.type === 'text' && <div>{element.content}</div>}
              {element.type === 'attribute' && (
                <div className="font-semibold">
                  {renderAttributeValue(element.attribute, product)}
                </div>
              )}
              {element.type === 'line' && <div className="w-full h-full bg-black"></div>}
              {element.type === 'rectangle' && <div className="w-full h-full border-2 border-black"></div>}
              {element.type === 'barcode' && (
                <svg ref={(el) => { if (el) renderBarcode(el, product.barcode || '9988880202624'); }} className="w-full h-full"></svg>
              )}
              {element.type === 'background' && <div className="w-full h-full bg-gray-200"></div>}
            </div>
          ))}
        </div>
      );
    }

    if (selectedTemplate.id === 'barcode-sticker-25x35') {
      return (
        <div
          className="bg-white border-2 border-gray-300 flex flex-col items-center justify-center p-1"
          style={{
            width: `${25 * scale}mm`,
            height: `${35 * scale}mm`,
          }}
        >
          <div className="text-[9px] font-bold text-center mb-1 px-1 leading-tight line-clamp-2 w-full overflow-hidden">
            {product.name}
          </div>
          <div className="flex-1 flex items-center justify-center w-full">
            <svg ref={(el) => { if (el) renderBarcode(el, product.barcode || '9988880202624'); }} className="w-full" style={{ height: '40px' }}></svg>
          </div>
          <div className="text-[8px] text-center mt-1">{product.barcode || '9988880202624'}</div>
          <div className="text-[11px] font-bold text-center mt-1">
            ${product.price.toFixed(2)}
          </div>
        </div>
      );
    }

    switch (selectedTemplate.id) {
      case 'normal-item':
        return (
          <div
            className="bg-white border-2 border-gray-300"
            style={{
              width: `${selectedTemplate.width * scale}mm`,
              height: `${selectedTemplate.height * scale}mm`,
              padding: '4mm',
              fontSize: '11px',
            }}
          >
            <div className="font-bold mb-2">{product.name}</div>
            <div className="mb-1">Mem. Price: {product.price.toFixed(2)}</div>
            <div className="mb-3">Normal Price: {product.price.toFixed(2)}</div>
            <div className="text-center">
              <svg ref={(el) => { if (el) renderBarcode(el, product.barcode || '9988880202624'); }} className="w-full" style={{ height: '35px' }}></svg>
              <div className="text-xs mt-1">{product.barcode || '9988880202624'}</div>
            </div>
            <div className="text-xs mt-2 text-center">Thank You</div>
          </div>
        );
      default:
        return (
          <div
            className="bg-white border-2 border-gray-300 p-2"
            style={{
              width: `${selectedTemplate.width * scale}mm`,
              height: `${selectedTemplate.height * scale}mm`,
            }}
          >
            <div className="text-sm">{product.name}</div>
            <div className="text-xs">Price: {product.price.toFixed(2)}</div>
          </div>
        );
    }
  };

  const renderAttributeValue = (attribute: string, product: any) => {
    switch (attribute) {
      case 'product-name':
        return product.name;
      case 'unit-price':
        return `${product.price.toFixed(2)}`;
      case 'mem-price':
        return `${product.price.toFixed(2)}`;
      case 'barcode':
        return product.barcode || '9988880202624';
      case 'production-date':
        return new Date().toISOString().split('T')[0];
      case 'shelf-life':
        return '7';
      default:
        return attribute;
    }
  };

  const renderBarcode = (svg: SVGSVGElement, value: string) => {
    const width = svg.clientWidth || 200;
    const height = svg.clientHeight || 50;
    const barWidth = 2;
    
    const code128Patterns: { [key: string]: string } = {
      '0': '11011001100', '1': '11001101100', '2': '11001100110', '3': '10010011000',
      '4': '10010001100', '5': '10001001100', '6': '10011001000', '7': '10011000100',
      '8': '10001100100', '9': '11001001000', 'A': '11001000100', 'B': '11000100100',
      'C': '10110011100', 'D': '10011011100', 'E': '10011001110', 'F': '10111001100',
      'G': '10011101100', 'H': '10011100110', 'I': '11001110010', 'J': '11001011100',
      'K': '11001001110', 'L': '11011100100', 'M': '11001110100', 'N': '11101101110',
      'O': '11101001100', 'P': '11100101100', 'Q': '11100100110', 'R': '11101100100',
      'S': '11100110100', 'T': '11100110010', 'U': '11011011000', 'V': '11011000110',
      'W': '11000110110', 'X': '10100011000', 'Y': '10001011000', 'Z': '10001000110',
      ' ': '10110001000', '-': '10001101000', '.': '10001100010', 'start': '11010010000'
    };
    
    let pattern = code128Patterns['start'] || '11010010000';
    for (let char of value.toUpperCase()) {
      pattern += code128Patterns[char] || code128Patterns['0'];
    }
    pattern += '1100011101011';
    
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.innerHTML = '';
    
    let x = 0;
    const barWidthUnit = width / pattern.length;
    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i] === '1') {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', `${x}`);
        rect.setAttribute('y', '0');
        rect.setAttribute('width', `${barWidthUnit}`);
        rect.setAttribute('height', `${height}`);
        rect.setAttribute('fill', 'black');
        svg.appendChild(rect);
      }
      x += barWidthUnit;
    }
  };

  const generateBarcodeSVG = (value: string, width: number, height: number) => {
    const code128Patterns: { [key: string]: string } = {
      '0': '11011001100', '1': '11001101100', '2': '11001100110', '3': '10010011000',
      '4': '10010001100', '5': '10001001100', '6': '10011001000', '7': '10011000100',
      '8': '10001100100', '9': '11001001000', 'A': '11001000100', 'B': '11000100100',
      'C': '10110011100', 'D': '10011011100', 'E': '10011001110', 'F': '10111001100',
      'G': '10011101100', 'H': '10011100110', 'I': '11001110010', 'J': '11001011100',
      'K': '11001001110', 'L': '11011100100', 'M': '11001110100', 'N': '11101101110',
      'O': '11101001100', 'P': '11100101100', 'Q': '11100100110', 'R': '11101100100',
      'S': '11100110100', 'T': '11100110010', 'U': '11011011000', 'V': '11011000110',
      'W': '11000110110', 'X': '10100011000', 'Y': '10001011000', 'Z': '10001000110',
      ' ': '10110001000', '-': '10001101000', '.': '10001100010', 'start': '11010010000'
    };
    
    let pattern = code128Patterns['start'] || '11010010000';
    for (let char of value.toUpperCase()) {
      pattern += code128Patterns[char] || code128Patterns['0'];
    }
    pattern += '1100011101011';
    
    let x = 0;
    const barWidthUnit = width / pattern.length;
    let rects = '';
    
    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i] === '1') {
        rects += `<rect x="${x}" y="0" width="${barWidthUnit}" height="${height}" fill="white"/>`;
      }
      x += barWidthUnit;
    }
    
    return rects;
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

    if (template.type === 'custom' && template.elements) {
      return `
        <div style="width: ${template.width}mm; height: ${template.height}mm; position: relative;">
          ${template.elements.map((element: any) => {
            const left = element.x;
            const top = element.y;
            const width = element.width || 'auto';
            const height = element.height || 'auto';
            const fontSize = element.fontSize || 12;
            
            let content = '';
            if (element.type === 'text') {
              content = element.content || '';
            } else if (element.type === 'attribute') {
              content = renderAttributeValue(element.attribute, product);
            } else if (element.type === 'line') {
              return `<div style="position: absolute; left: ${left}mm; top: ${top}mm; width: ${width}mm; height: ${height}mm; background: black;"></div>`;
            } else if (element.type === 'rectangle') {
              return `<div style="position: absolute; left: ${left}mm; top: ${top}mm; width: ${width}mm; height: ${height}mm; border: 2px solid black;"></div>`;
            } else if (element.type === 'barcode') {
              const barcode = product.barcode || '9988880202624';
              return `<div style="position: absolute; left: ${left}mm; top: ${top}mm; width: ${width}mm; height: ${height}mm;">
                <svg width="100%" height="100%" style="background: #000;">
                  ${generateBarcodeSVG(barcode, width, height)}
                </svg>
              </div>`;
            } else if (element.type === 'background') {
              return `<div style="position: absolute; left: ${left}mm; top: ${top}mm; width: ${width}mm; height: ${height}mm; background: #e5e5e5;"></div>`;
            }
            
            return `<div style="position: absolute; left: ${left}mm; top: ${top}mm; font-size: ${fontSize}px; font-weight: ${element.type === 'attribute' ? 'bold' : 'normal'};">${content}</div>`;
          }).join('')}
        </div>
      `;
    }

    if (template.id === 'barcode-sticker-25x35') {
      const barcode = product.barcode || '9988880202624';
      return `
        <div style="width: 25mm; height: 35mm; padding: 1mm; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
          <div style="font-size: 9px; font-weight: bold; margin-bottom: 1mm; max-height: 8mm; overflow: hidden; line-height: 1.2; padding: 0 1mm;">
            ${product.name}
          </div>
          <div style="flex: 1; display: flex; align-items: center; justify-content: center; width: 100%;">
            <svg width="100%" height="40px" style="background: #000;">
              ${generateBarcodeSVG(barcode, 23, 40)}
            </svg>
          </div>
          <div style="font-size: 8px; margin-top: 1mm;">${barcode}</div>
          <div style="font-size: 11px; font-weight: bold; margin-top: 1mm;">
            $${product.price.toFixed(2)}
          </div>
        </div>
      `;
    }

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
            <div className="w-80 bg-gray-50 rounded-lg p-4 flex items-center justify-center">
              {renderPreview()}
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
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Barcode, Item Name, Fir..."
                    value={selectedProduct ? selectedProduct.name : ""}
                    readOnly
                    className="w-full px-3 py-2 border rounded-md bg-white pr-8"
                    onClick={() => setShowProductSearch(true)}
                  />
                  {selectedProduct && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProduct(null);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
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
        onProductSelect={handleProductSelect}
      />
    </>
  );
}
