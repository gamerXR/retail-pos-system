import { Button } from "@/components/ui/button";

interface StockActionModalProps {
  position: { x: number; y: number };
  onSelect: () => void;
  onStockIn: () => void;
  onStockOut: () => void;
  onStockLoss: () => void;
  onCancel: () => void;
}

export default function StockActionModal({
  position,
  onSelect,
  onStockIn,
  onStockOut,
  onStockLoss,
  onCancel
}: StockActionModalProps) {
  return (
    <div
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[240px]"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="text-center py-3 px-4 border-b border-gray-100">
        <h3 className="text-lg font-medium text-gray-800">Select Action</h3>
      </div>
      
      <div className="py-2">
        <Button
          variant="ghost"
          className="w-full justify-start px-4 py-3 text-left hover:bg-gray-50"
          onClick={onSelect}
        >
          <span className="flex items-center gap-3">
            <span className="text-blue-600 font-bold">📦</span>
            <div>
              <div className="font-medium">Select</div>
              <div className="text-xs text-gray-500">Add to current selection</div>
            </div>
          </span>
        </Button>
        
        <Button
          variant="ghost"
          className="w-full justify-start px-4 py-3 text-left hover:bg-green-50"
          onClick={onStockIn}
        >
          <span className="flex items-center gap-3">
            <span className="text-green-600 font-bold">+</span>
            <div>
              <div className="font-medium text-green-700">Stock In</div>
              <div className="text-xs text-gray-500">Add inventory (increase quantity)</div>
            </div>
          </span>
        </Button>
        
        <Button
          variant="ghost"
          className="w-full justify-start px-4 py-3 text-left hover:bg-red-50"
          onClick={onStockOut}
        >
          <span className="flex items-center gap-3">
            <span className="text-red-600 font-bold">-</span>
            <div>
              <div className="font-medium text-red-700">Stock Out</div>
              <div className="text-xs text-gray-500">Remove inventory (decrease quantity)</div>
            </div>
          </span>
        </Button>
        
        <Button
          variant="ghost"
          className="w-full justify-start px-4 py-3 text-left hover:bg-orange-50"
          onClick={onStockLoss}
        >
          <span className="flex items-center gap-3">
            <span className="text-orange-600 font-bold">⚠</span>
            <div>
              <div className="font-medium text-orange-700">Stock Loss</div>
              <div className="text-xs text-gray-500">Mark as damaged (decrease quantity)</div>
            </div>
          </span>
        </Button>
      </div>
      
      <div className="border-t border-gray-100 pt-2">
        <Button
          variant="ghost"
          className="w-full justify-center px-4 py-3 text-gray-600 hover:bg-gray-50"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
