import { Button } from "@/components/ui/button";

interface CategoryContextMenuProps {
  position: { x: number; y: number };
  onEdit: () => void;
  onCancel: () => void;
}

export default function CategoryContextMenu({
  position,
  onEdit,
  onCancel
}: CategoryContextMenuProps) {
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit();
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onCancel();
  };

  return (
    <div
      className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[160px] animate-in fade-in-0 zoom-in-95"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="py-2">
        <button
          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 border-0 bg-transparent cursor-pointer text-gray-900 transition-colors"
          onClick={handleEdit}
        >
          <span className="text-gray-600 font-bold text-lg">✏️</span>
          <div>
            <div className="font-medium">Edit</div>
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
