import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";

interface VirtualKeyboardProps {
  onInput: (value: string) => void;
  onBackspace: () => void;
  onSpace: () => void;
}

export default function VirtualKeyboard({ onInput, onBackspace, onSpace }: VirtualKeyboardProps) {
  const rows = [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "7", "8", "9"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l", "4", "5", "6"],
    ["z", "x", "c", "v", "b", "n", "m", "1", "2", "3"],
    ["Symbol", "Space", "0", "BS"]
  ];

  const handleKeyPress = (key: string) => {
    if (key === "BS") {
      onBackspace();
    } else if (key === "Space") {
      onSpace();
    } else if (key === "Symbol") {
      // Handle symbol toggle if needed
    } else {
      onInput(key);
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="max-w-4xl mx-auto">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-2 mb-2 justify-center">
            {rowIndex === 2 && (
              <Button
                variant="outline"
                className="w-16 h-12 flex items-center justify-center"
                onClick={() => {}}
              >
                <ArrowUp className="w-4 h-4" />
              </Button>
            )}
            {row.map((key) => (
              <Button
                key={key}
                variant="outline"
                className={`h-12 ${
                  key === "Space" ? "w-32" : key === "Symbol" || key === "BS" ? "w-16" : "w-12"
                } text-lg font-medium`}
                onClick={() => handleKeyPress(key)}
              >
                {key === "BS" ? "⌫" : key}
              </Button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
