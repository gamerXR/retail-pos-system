import { Button } from "@/components/ui/button";

interface ProductContextMenuProps {
  position: { x: number; y: number };
  onSelect: () => void;
  onEdit: () => void;
  onStick: () => void;
  onOffShelf: () => void;
  onCancel: () => void;
  isOffShelf?: boolean;
}

export default function ProductContextMenu({
  position,
  onSelect,
  onEdit,
  onStick,
  onOffShelf,
  onCancel,
  isOffShelf = false
}: ProductContextMenuProps) {
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit();
  };

  const handleStick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onStick();
  };

  const handleOffShelf = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onOffShelf();
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onCancel();
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect();
  };

  return (
    <div
      className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[220px] animate-in fade-in-0 zoom-in-95"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="text-center py-3 px-4 border-b border-gray-100 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-800">Product Options</h3>
        <p className="text-xs text-gray-500 mt-1">Choose an action</p>
      </div>
      
      <div className="py-2">
        <button
          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-50 border-0 bg-transparent cursor-pointer text-gray-900 transition-colors"
          onClick={handleSelect}
        >
          <span className="text-blue-600 font-bold text-lg">🛒</span>
          <div>
            <div className="font-medium text-blue-700">Add to Cart</div>
            <div className="text-xs text-gray-500">Add this item to your cart</div>
          </div>
        </button>
        
        <button
          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 border-0 bg-transparent cursor-pointer text-gray-900 transition-colors"
          onClick={handleEdit}
        >
          <span className="text-gray-600 font-bold text-lg">✏️</span>
          <div>
            <div className="font-medium">Edit Item</div>
            <div className="text-xs text-gray-500">Modify item details</div>
          </div>
        </button>
        
        <button
          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-50 border-0 bg-transparent cursor-pointer transition-colors"
          onClick={handleStick}
        >
          <span className="text-blue-600 font-bold text-lg">📌</span>
          <div>
            <div className="font-medium text-blue-700">Stick to Top</div>
            <div className="text-xs text-gray-500">Move to first position in category</div>
          </div>
        </button>
        
        <button
          className={`w-full flex items-center gap-3 px-4 py-3 text-left border-0 bg-transparent cursor-pointer transition-colors ${
            isOffShelf 
              ? "hover:bg-green-50" 
              : "hover:bg-red-50"
          }`}
          onClick={handleOffShelf}
        >
          <span className={`font-bold text-lg ${isOffShelf ? "text-green-600" : "text-red-600"}`}>
            {isOffShelf ? "📦" : "🚫"}
          </span>
          <div>
            <div className={`font-medium ${isOffShelf ? "text-green-700" : "text-red-700"}`}>
              {isOffShelf ? "Put Back on Shelf" : "Take Off Shelf"}
            </div>
            <div className="text-xs text-gray-500">
              {isOffShelf ? "Make available for sale again" : "Mark as unavailable for sale"}
            </div>
          </div>
        </button>
      </div>
      
      <div className="border-t border-gray-100 pt-2">
        <button
          className="w-full justify-center px-4 py-3 text-gray-600 hover:bg-gray-50 border-0 bg-transparent cursor-pointer transition-colors"
          onClick={handleCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
