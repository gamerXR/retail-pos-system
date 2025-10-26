import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, Type, Image as ImageIcon, Minus, Square, Grid, MoveUp, MoveDown, ZoomIn, ZoomOut, RotateCcw, Edit3, Trash2 } from "lucide-react";

interface Template {
  id: string;
  name: string;
  width: number;
  height: number;
  type: 'predefined' | 'custom';
  elements?: TemplateElement[];
}

interface TemplateElement {
  id: string;
  type: 'text' | 'image' | 'line' | 'rectangle' | 'background' | 'barcode' | 'attribute';
  x: number;
  y: number;
  width?: number;
  height?: number;
  content?: string;
  fontSize?: number;
  attribute?: string;
}

interface TemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: Template) => void;
  template: Template | null;
}

export default function TemplateEditorModal({ 
  isOpen, 
  onClose, 
  onSave,
  template 
}: TemplateEditorModalProps) {
  const [templateName, setTemplateName] = useState("Custom template");
  const [paperWidth, setPaperWidth] = useState(40);
  const [paperHeight, setPaperHeight] = useState(30);
  const [labelGap, setLabelGap] = useState("Gap Paper,2mm");
  const [elements, setElements] = useState<TemplateElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (template) {
      setTemplateName(template.name);
      setPaperWidth(template.width);
      setPaperHeight(template.height);
      setElements(template.elements || []);
    } else {
      setTemplateName("Custom template");
      setPaperWidth(40);
      setPaperHeight(30);
      setElements([]);
      setSelectedElement(null);
    }
  }, [template, isOpen]);

  const attributes = [
    { id: 'product-name', label: 'Product name' },
    { id: 'unit-price', label: 'Unit Price' },
    { id: 'mem-price', label: 'Mem. price' },
    { id: 'total-amt', label: 'Total Amt' },
    { id: 'barcode', label: 'Barcode' },
    { id: 'weight-bar-code', label: 'Weight bar code' },
    { id: 'weight', label: 'Weight' },
    { id: 'shelf-life', label: 'Shelf life' },
    { id: 'production-date', label: 'Production Date' },
    { id: 'place-of-origin', label: 'Place of origin' },
    { id: 'spec', label: 'Spec.' },
    { id: 'material-description', label: 'Material description' },
  ];

  const addElement = (type: TemplateElement['type']) => {
    const newElement: TemplateElement = {
      id: `${type}-${Date.now()}`,
      type,
      x: 5,
      y: 5,
      width: type === 'text' ? 50 : type === 'line' ? 30 : type === 'barcode' ? 30 : 20,
      height: type === 'text' ? 8 : type === 'line' ? 1 : type === 'barcode' ? 10 : 15,
      content: type === 'text' ? 'Text' : '',
      fontSize: 12,
    };

    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
  };

  const addAttributeElement = (attributeId: string) => {
    const attribute = attributes.find(a => a.id === attributeId);
    if (!attribute) return;

    const newElement: TemplateElement = {
      id: `attribute-${Date.now()}`,
      type: 'attribute',
      x: 5,
      y: 5,
      width: 50,
      height: 8,
      content: attribute.label,
      fontSize: 11,
      attribute: attributeId,
    };

    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
  };

  const deleteSelectedElement = () => {
    if (selectedElement) {
      setElements(elements.filter(el => el.id !== selectedElement));
      setSelectedElement(null);
    }
  };

  const moveElement = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!selectedElement) return;

    setElements(elements.map(el => {
      if (el.id === selectedElement) {
        const step = 1;
        switch (direction) {
          case 'up':
            return { ...el, y: Math.max(0, el.y - step) };
          case 'down':
            return { ...el, y: Math.min(paperHeight - (el.height || 0), el.y + step) };
          case 'left':
            return { ...el, x: Math.max(0, el.x - step) };
          case 'right':
            return { ...el, x: Math.min(paperWidth - (el.width || 0), el.x + step) };
        }
      }
      return el;
    }));
  };

  const adjustFontSize = (increase: boolean) => {
    if (!selectedElement) return;

    setElements(elements.map(el => {
      if (el.id === selectedElement && (el.type === 'text' || el.type === 'attribute')) {
        const currentSize = el.fontSize || 12;
        return { ...el, fontSize: increase ? currentSize + 1 : Math.max(8, currentSize - 1) };
      }
      return el;
    }));
  };

  const handleSave = () => {
    const savedTemplate: Template = {
      id: template?.id || `custom-${Date.now()}`,
      name: templateName,
      width: paperWidth,
      height: paperHeight,
      type: 'custom',
      elements,
    };
    onSave(savedTemplate);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this template?")) {
      onClose();
    }
  };

  const handleMouseDown = (elementId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedElement(elementId);
    setIsDragging(true);
    
    const element = elements.find(el => el.id === elementId);
    if (element) {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedElement) return;

    const canvas = document.getElementById('label-canvas');
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scale = 5;
    
    const newX = ((e.clientX - rect.left - dragOffset.x) / scale);
    const newY = ((e.clientY - rect.top - dragOffset.y) / scale);

    setElements(elements.map(el => {
      if (el.id === selectedElement) {
        return {
          ...el,
          x: Math.max(0, Math.min(paperWidth - (el.width || 0), newX)),
          y: Math.max(0, Math.min(paperHeight - (el.height || 0), newY)),
        };
      }
      return el;
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const scale = 5;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <DialogTitle>Edit template</DialogTitle>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleDelete}
                className="text-red-500 border-red-500"
              >
                Delete
              </Button>
              <Button
                onClick={handleSave}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Save
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex gap-4 h-[75vh]">
          <div className="flex-1 bg-gray-50 rounded-lg p-4 overflow-auto relative">
            <div className="absolute top-0 left-0 right-0 h-8 bg-white border-b flex items-center px-4 text-xs text-gray-600 z-10">
              {Array.from({ length: Math.ceil(paperWidth / 10) + 1 }, (_, i) => (
                <div key={i} className="absolute" style={{ left: `${i * 10 * scale + 32}px` }}>
                  {i * 10}
                </div>
              ))}
            </div>

            <div className="absolute top-8 left-0 bottom-0 w-8 bg-white border-r flex flex-col text-xs text-gray-600 z-10">
              {Array.from({ length: Math.ceil(paperHeight / 10) + 1 }, (_, i) => (
                <div key={i} className="absolute" style={{ top: `${i * 10 * scale + 32}px` }}>
                  {i * 10}
                </div>
              ))}
            </div>

            <div 
              id="label-canvas"
              className="relative bg-white border-2 border-gray-300 ml-8 mt-8"
              style={{ 
                width: `${paperWidth * scale}mm`, 
                height: `${paperHeight * scale}mm`,
              }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {elements.map(element => (
                <div
                  key={element.id}
                  className={`absolute cursor-move border ${selectedElement === element.id ? 'border-blue-500 border-2 bg-blue-50' : 'border-gray-300'}`}
                  style={{
                    left: `${element.x * scale}mm`,
                    top: `${element.y * scale}mm`,
                    width: element.width ? `${element.width * scale}mm` : 'auto',
                    height: element.height ? `${element.height * scale}mm` : 'auto',
                    fontSize: element.fontSize ? `${element.fontSize}px` : '12px',
                  }}
                  onMouseDown={(e) => handleMouseDown(element.id, e)}
                >
                  {element.type === 'text' && (
                    <div className="p-1 select-none">{element.content}</div>
                  )}
                  {element.type === 'attribute' && (
                    <div className="p-1 bg-blue-100 select-none font-semibold">{element.content}</div>
                  )}
                  {element.type === 'line' && (
                    <div className="w-full h-full bg-black"></div>
                  )}
                  {element.type === 'rectangle' && (
                    <div className="w-full h-full border-2 border-black"></div>
                  )}
                  {element.type === 'barcode' && (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center text-white text-xs select-none">
                      ||||||||||
                    </div>
                  )}
                  {element.type === 'background' && (
                    <div className="w-full h-full bg-gray-200"></div>
                  )}
                </div>
              ))}
            </div>

            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 bg-white border rounded-lg p-2 shadow-lg">
              <Button variant="ghost" size="sm" onClick={() => moveElement('left')} title="Move Left">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => moveElement('right')} title="Move Right">
                <ChevronLeft className="w-4 h-4 rotate-180" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => moveElement('up')} title="Move Up">
                <MoveUp className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => moveElement('down')} title="Move Down">
                <MoveDown className="w-4 h-4" />
              </Button>
              <div className="w-px bg-gray-300 mx-1"></div>
              <Button variant="ghost" size="sm" onClick={() => adjustFontSize(true)} title="Increase Font">
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => adjustFontSize(false)} title="Decrease Font">
                <ZoomOut className="w-4 h-4" />
              </Button>
              <div className="w-px bg-gray-300 mx-1"></div>
              <Button variant="ghost" size="sm" onClick={deleteSelectedElement} className="text-red-500" title="Delete">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="w-96 space-y-4 overflow-y-auto">
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Template name</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="px-2 py-1 border rounded text-sm text-teal-600"
                />
              </div>

              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Paper width</label>
                <div className="text-sm text-orange-500">
                  {paperWidth} X {paperHeight} <span className="text-gray-400 ml-1">mm</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Label gap</label>
                <div className="text-sm text-orange-500 cursor-pointer">
                  {labelGap} <span>›</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-4">
              <div className="text-sm font-medium text-gray-400 mb-3">Item Attribute</div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {attributes.map((attr) => (
                  <button
                    key={attr.id}
                    onClick={() => addAttributeElement(attr.id)}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded border"
                  >
                    <span>{attr.label}</span>
                  </button>
                ))}
              </div>

              <div className="text-sm font-medium text-gray-400 mb-3">Add other items</div>
              <div className="grid grid-cols-5 gap-2">
                <button
                  onClick={() => addElement('text')}
                  className="flex flex-col items-center gap-1 p-3 border rounded hover:bg-gray-50"
                >
                  <Type className="w-6 h-6 text-orange-500" />
                  <span className="text-xs">Text</span>
                </button>
                <button
                  onClick={() => addElement('image')}
                  className="flex flex-col items-center gap-1 p-3 border rounded hover:bg-gray-50"
                >
                  <ImageIcon className="w-6 h-6 text-orange-500" />
                  <span className="text-xs">Image</span>
                </button>
                <button
                  onClick={() => addElement('line')}
                  className="flex flex-col items-center gap-1 p-3 border rounded hover:bg-gray-50"
                >
                  <Minus className="w-6 h-6 text-orange-500" />
                  <span className="text-xs">Line</span>
                </button>
                <button
                  onClick={() => addElement('rectangle')}
                  className="flex flex-col items-center gap-1 p-3 border rounded hover:bg-gray-50"
                >
                  <Square className="w-6 h-6 text-orange-500" />
                  <span className="text-xs">Rectangle</span>
                </button>
                <button
                  onClick={() => addElement('background')}
                  className="flex flex-col items-center gap-1 p-3 border rounded hover:bg-gray-50"
                >
                  <Grid className="w-6 h-6 text-orange-500" />
                  <span className="text-xs">Background</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
