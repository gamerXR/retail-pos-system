import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, Pencil, Plus } from "lucide-react";
import TemplateEditorModal from "./TemplateEditorModal";
import { useBackend } from "../lib/auth";

interface Template {
  id: string;
  name: string;
  width: number;
  height: number;
  type: 'predefined' | 'custom';
}

interface TemplateSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: Template) => void;
}

export default function TemplateSelectionModal({ 
  isOpen, 
  onClose, 
  onSelect 
}: TemplateSelectionModalProps) {
  const [customTemplates, setCustomTemplates] = useState<Template[]>([]);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const backend = useBackend();

  useEffect(() => {
    if (isOpen) {
      loadCustomTemplates();
    }
  }, [isOpen]);

  const loadCustomTemplates = async () => {
    try {
      const response = await backend.pos.listTemplates();
      if (response.success) {
        setCustomTemplates(response.templates);
      }
    } catch (error) {
      console.error("Error loading templates:", error);
    }
  };

  const predefinedTemplates: Template[] = [
    {
      id: 'barcode-sticker-25x35',
      name: 'Barcode Sticker 35x25mm',
      width: 35,
      height: 25,
      type: 'predefined'
    },
    {
      id: 'barcode-centered',
      name: '商品名 + Barcode + Price',
      width: 40,
      height: 30,
      type: 'predefined'
    }
  ];

  const handleTemplateSelect = (template: Template) => {
    onSelect(template);
    onClose();
  };

  const handleEditTemplate = (template: Template, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTemplate(template);
    setShowTemplateEditor(true);
  };

  const handleCreateCustomTemplate = () => {
    setEditingTemplate(null);
    setShowTemplateEditor(true);
  };

  const handleSaveTemplate = async (template: Template) => {
    try {
      if (editingTemplate && editingTemplate.type === 'custom') {
        await backend.pos.updateTemplate({
          id: template.id,
          name: template.name,
          width: template.width,
          height: template.height,
          elements: (template as any).elements || []
        });
      } else if (!editingTemplate) {
        await backend.pos.createTemplate({
          name: template.name,
          width: template.width,
          height: template.height,
          elements: (template as any).elements || []
        });
      }
      await loadCustomTemplates();
    } catch (error) {
      console.error("Error saving template:", error);
    }
    setShowTemplateEditor(false);
    setEditingTemplate(null);
  };

  const renderTemplatePreview = (template: Template) => {
    switch (template.id) {
      case 'barcode-sticker-25x35':
        return (
          <div className="w-full h-24 bg-white border-2 border-gray-300 rounded p-2 text-xs flex flex-row items-center justify-center gap-2">
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="font-bold text-[9px] mb-1 px-1 leading-tight break-words w-full">Product Name Here</div>
              <div className="text-sm font-bold mt-auto">$2.00</div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="h-16 w-20 bg-white flex items-center justify-center text-black border border-gray-200">
                <svg className="w-full h-full" viewBox="0 0 100 60">
                  <rect x="2" y="10" width="1" height="40" fill="black"/>
                  <rect x="4" y="10" width="2" height="40" fill="black"/>
                  <rect x="7" y="10" width="1" height="40" fill="black"/>
                  <rect x="9" y="10" width="1" height="40" fill="black"/>
                  <rect x="11" y="10" width="2" height="40" fill="black"/>
                  <rect x="14" y="10" width="1" height="40" fill="black"/>
                  <rect x="16" y="10" width="1" height="40" fill="black"/>
                  <rect x="18" y="10" width="2" height="40" fill="black"/>
                  <rect x="21" y="10" width="1" height="40" fill="black"/>
                  <rect x="23" y="10" width="2" height="40" fill="black"/>
                  <rect x="26" y="10" width="1" height="40" fill="black"/>
                  <rect x="28" y="10" width="1" height="40" fill="black"/>
                  <rect x="30" y="10" width="2" height="40" fill="black"/>
                  <rect x="33" y="10" width="1" height="40" fill="black"/>
                  <rect x="35" y="10" width="2" height="40" fill="black"/>
                  <rect x="38" y="10" width="1" height="40" fill="black"/>
                  <rect x="40" y="10" width="1" height="40" fill="black"/>
                  <rect x="42" y="10" width="2" height="40" fill="black"/>
                  <rect x="45" y="10" width="1" height="40" fill="black"/>
                  <rect x="47" y="10" width="1" height="40" fill="black"/>
                  <rect x="49" y="10" width="2" height="40" fill="black"/>
                  <rect x="52" y="10" width="1" height="40" fill="black"/>
                  <rect x="54" y="10" width="2" height="40" fill="black"/>
                  <rect x="57" y="10" width="1" height="40" fill="black"/>
                  <rect x="59" y="10" width="1" height="40" fill="black"/>
                  <rect x="61" y="10" width="2" height="40" fill="black"/>
                  <rect x="64" y="10" width="1" height="40" fill="black"/>
                  <rect x="66" y="10" width="2" height="40" fill="black"/>
                  <rect x="69" y="10" width="1" height="40" fill="black"/>
                  <rect x="71" y="10" width="1" height="40" fill="black"/>
                  <rect x="73" y="10" width="2" height="40" fill="black"/>
                  <rect x="76" y="10" width="1" height="40" fill="black"/>
                  <rect x="78" y="10" width="1" height="40" fill="black"/>
                  <rect x="80" y="10" width="2" height="40" fill="black"/>
                  <rect x="83" y="10" width="1" height="40" fill="black"/>
                  <rect x="85" y="10" width="2" height="40" fill="black"/>
                  <rect x="88" y="10" width="1" height="40" fill="black"/>
                  <rect x="90" y="10" width="1" height="40" fill="black"/>
                  <rect x="92" y="10" width="2" height="40" fill="black"/>
                </svg>
              </div>
              <div className="text-[7px] mt-1">9988880202624</div>
            </div>
          </div>
        );
      case 'barcode-centered':
        return (
          <div className="w-full h-28 bg-white border-2 border-gray-300 rounded p-2 text-xs flex flex-col items-center justify-center">
            <div className="font-bold text-sm mb-2">商品名</div>
            <div className="h-10 bg-white w-full mb-1 flex items-center justify-center text-black text-[10px] border border-gray-200">
              <svg className="w-full h-full" viewBox="0 0 100 40">
                <rect x="2" y="5" width="1" height="25" fill="black"/>
                <rect x="4" y="5" width="2" height="25" fill="black"/>
                <rect x="7" y="5" width="1" height="25" fill="black"/>
                <rect x="9" y="5" width="1" height="25" fill="black"/>
                <rect x="11" y="5" width="2" height="25" fill="black"/>
                <rect x="14" y="5" width="1" height="25" fill="black"/>
                <rect x="16" y="5" width="1" height="25" fill="black"/>
                <rect x="18" y="5" width="2" height="25" fill="black"/>
                <rect x="21" y="5" width="1" height="25" fill="black"/>
                <rect x="23" y="5" width="2" height="25" fill="black"/>
                <rect x="26" y="5" width="1" height="25" fill="black"/>
                <rect x="28" y="5" width="1" height="25" fill="black"/>
                <rect x="30" y="5" width="2" height="25" fill="black"/>
                <rect x="33" y="5" width="1" height="25" fill="black"/>
                <rect x="35" y="5" width="2" height="25" fill="black"/>
                <rect x="38" y="5" width="1" height="25" fill="black"/>
                <rect x="40" y="5" width="1" height="25" fill="black"/>
                <rect x="42" y="5" width="2" height="25" fill="black"/>
                <rect x="45" y="5" width="1" height="25" fill="black"/>
                <rect x="47" y="5" width="1" height="25" fill="black"/>
                <rect x="49" y="5" width="2" height="25" fill="black"/>
                <rect x="52" y="5" width="1" height="25" fill="black"/>
                <rect x="54" y="5" width="2" height="25" fill="black"/>
                <rect x="57" y="5" width="1" height="25" fill="black"/>
                <rect x="59" y="5" width="1" height="25" fill="black"/>
                <rect x="61" y="5" width="2" height="25" fill="black"/>
                <rect x="64" y="5" width="1" height="25" fill="black"/>
                <rect x="66" y="5" width="2" height="25" fill="black"/>
                <rect x="69" y="5" width="1" height="25" fill="black"/>
                <rect x="71" y="5" width="1" height="25" fill="black"/>
                <rect x="73" y="5" width="2" height="25" fill="black"/>
                <rect x="76" y="5" width="1" height="25" fill="black"/>
                <rect x="78" y="5" width="1" height="25" fill="black"/>
                <rect x="80" y="5" width="2" height="25" fill="black"/>
                <rect x="83" y="5" width="1" height="25" fill="black"/>
                <rect x="85" y="5" width="2" height="25" fill="black"/>
                <rect x="88" y="5" width="1" height="25" fill="black"/>
                <rect x="90" y="5" width="1" height="25" fill="black"/>
                <rect x="92" y="5" width="2" height="25" fill="black"/>
                <rect x="95" y="5" width="1" height="25" fill="black"/>
                <rect x="97" y="5" width="1" height="25" fill="black"/>
              </svg>
            </div>
            <div className="text-[9px] font-semibold mb-1">6701234567891</div>
            <div className="text-base font-bold">$ 2.00</div>
          </div>
        );
      case 'small-item-name':
        return (
          <div className="w-full h-28 bg-white border rounded p-2 text-xs">
            <div className="font-bold mb-1">Item name</div>
            <div>Unit Price  15.00</div>
          </div>
        );
      case 'small-item-price':
        return (
          <div className="w-full h-28 bg-white border rounded p-2 text-xs flex flex-col items-center justify-center">
            <div className="font-bold mb-1">Unit Price:</div>
            <div className="text-xl font-bold">15.00</div>
          </div>
        );
      case 'small-item-barcode':
        return (
          <div className="w-full h-28 bg-white border rounded p-2 text-xs flex flex-col items-center justify-center">
            <div className="h-8 bg-gray-800 w-full mb-1 flex items-center justify-center text-white text-[8px]">
              ||||||||||||||||||||
            </div>
            <div className="text-[9px]">6701234567891</div>
            <div className="text-[9px] mt-1">Unit Price: 15.00</div>
          </div>
        );
      case 'weighing-class':
        return (
          <div className="w-full h-28 bg-white border rounded p-2 text-xs flex flex-col items-center">
            <div className="font-bold text-[10px]">Item Name</div>
            <div className="text-[9px]">Weight(kg): 0.605</div>
            <div className="text-[9px]">Unit Price: 2.00</div>
            <div className="h-6 bg-gray-800 w-full my-1 flex items-center justify-center text-white text-[6px]">
              ||||||||||||||||
            </div>
            <div className="text-[8px]">Total Amount: 1.2</div>
            <div className="text-[8px]">Thank You</div>
          </div>
        );
      case 'normal-item':
        return (
          <div className="w-full h-28 bg-white border rounded p-2 text-xs">
            <div className="font-bold text-[10px] mb-1">Item Name</div>
            <div className="text-[9px]">Mem. Price:  12.50</div>
            <div className="text-[9px] mb-1">Normal Price: 15.00</div>
            <div className="h-6 bg-gray-800 w-full flex items-center justify-center text-white text-[6px]">
              ||||||||||||||||
            </div>
            <div className="text-[8px] text-center mt-1">6701234567891</div>
            <div className="text-[8px] text-center">Thank You</div>
          </div>
        );
      case 'fresh-food':
        return (
          <div className="w-full h-28 bg-white border rounded p-2 text-xs">
            <div className="font-bold text-[10px] mb-1">Item Name</div>
            <div className="text-[9px]">Mem. Price:  12.50</div>
            <div className="text-[9px]">Normal Price: 15.00</div>
            <div className="h-6 bg-gray-800 w-full flex items-center justify-center text-white text-[6px] my-1">
              ||||||||||||||||
            </div>
            <div className="text-[8px]">6701234567891</div>
            <div className="text-[8px]">Production Date: 2017-10-11 12:25</div>
            <div className="text-[8px]">Shelf Life(D):  7</div>
          </div>
        );
      default:
        return (
          <div className="w-full h-28 bg-white border rounded p-2 text-xs">
            Custom Template
          </div>
        );
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <DialogTitle>Choose Template</DialogTitle>
              </div>
              <Button
                onClick={onClose}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Confirm
              </Button>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {predefinedTemplates.map((template) => (
              <div
                key={template.id}
                className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleTemplateSelect(template)}
              >
                <div className="p-3 bg-gray-50">
                  <div className="text-sm font-medium text-gray-600 mb-2">{template.name}</div>
                  {renderTemplatePreview(template)}
                </div>
                <div className="p-2 bg-white border-t flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-600"
                    onClick={(e) => handleEditTemplate(template, e)}
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            ))}

            {customTemplates.map((template) => (
              <div
                key={template.id}
                className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleTemplateSelect(template)}
              >
                <div className="p-3 bg-gray-50">
                  <div className="text-sm font-medium text-gray-600 mb-2">{template.name}</div>
                  {renderTemplatePreview(template)}
                </div>
                <div className="p-2 bg-white border-t flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-600"
                    onClick={(e) => handleEditTemplate(template, e)}
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            ))}

            <div
              className="border-2 border-dashed rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer bg-gray-50"
              onClick={handleCreateCustomTemplate}
            >
              <div className="h-full flex flex-col items-center justify-center p-8">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                  <Plus className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-sm font-medium text-gray-700">Custom template</div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <TemplateEditorModal
        isOpen={showTemplateEditor}
        onClose={() => {
          setShowTemplateEditor(false);
          setEditingTemplate(null);
        }}
        onSave={handleSaveTemplate}
        template={editingTemplate}
      />
    </>
  );
}
