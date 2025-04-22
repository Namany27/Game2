import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CryptoInputProps {
  className?: string;
  value: string;
  onChange: (value: string) => void;
  symbol?: string;
  minValue?: number;
  maxValue?: number;
  presetAmounts?: number[];
}

export function CryptoInput({
  className,
  value,
  onChange,
  symbol = "USDT",
  minValue = 1,
  maxValue = 1000,
  presetAmounts = [10, 50, 100, 500],
}: CryptoInputProps) {
  const [error, setError] = useState<string>("");
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Allow empty string or valid number
    if (newValue === "" || /^\d*\.?\d*$/.test(newValue)) {
      onChange(newValue);
      validateAmount(newValue);
    }
  };
  
  const validateAmount = (amount: string) => {
    const numAmount = parseFloat(amount);
    
    if (amount === "") {
      setError("");
      return;
    }
    
    if (isNaN(numAmount)) {
      setError("Please enter a valid number");
      return;
    }
    
    if (numAmount < minValue) {
      setError(`Minimum amount is ${minValue} ${symbol}`);
      return;
    }
    
    if (maxValue && numAmount > maxValue) {
      setError(`Maximum amount is ${maxValue} ${symbol}`);
      return;
    }
    
    setError("");
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative">
        <Input
          className="pr-16"
          value={value}
          onChange={handleChange}
          placeholder={`Enter amount (min: ${minValue})`}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <span className="text-sm text-muted-foreground">{symbol}</span>
        </div>
      </div>
      
      {error && (
        <p className="text-destructive text-sm">{error}</p>
      )}
      
      <div className="flex flex-wrap gap-2">
        {presetAmounts.map((amount) => (
          <Button
            key={amount}
            variant="outline"
            className="flex-1 min-w-[70px]"
            onClick={() => {
              onChange(amount.toString());
              validateAmount(amount.toString());
            }}
          >
            {amount} {symbol}
          </Button>
        ))}
      </div>
    </div>
  );
}
