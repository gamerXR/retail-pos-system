import { Button } from "@/components/ui/button";

interface NumericKeypadProps {
  onInput: (value: string) => void;
}

export default function NumericKeypad({ onInput }: NumericKeypadProps) {
  const keys = [
    ["7", "8", "9"],
    ["4", "5", "6"],
    ["1", "2", "3"],
    [".", "0", "Back"]
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {keys.flat().map((key) => (
        <Button
          key={key}
          variant="outline"
          className="h-12 text-xl font-semibold"
          onClick={() => onInput(key)}
        >
          {key === "Back" ? "⌫" : key}
        </Button>
      ))}
    </div>
  );
}
