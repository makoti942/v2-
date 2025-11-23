import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface VolatilitySelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const VOLATILITY_INDICES = [
  { value: 'R_10', label: 'Volatility 10 Index' },
  { value: 'R_25', label: 'Volatility 25 Index' },
  { value: 'R_50', label: 'Volatility 50 Index' },
  { value: 'R_75', label: 'Volatility 75 Index' },
  { value: 'R_100', label: 'Volatility 100 Index' },
  { value: '1HZ10V', label: 'Volatility 10 (1s) Index' },
  { value: '1HZ25V', label: 'Volatility 25 (1s) Index' },
  { value: '1HZ50V', label: 'Volatility 50 (1s) Index' },
  { value: '1HZ75V', label: 'Volatility 75 (1s) Index' },
  { value: '1HZ100V', label: 'Volatility 100 (1s) Index' },
];

export const VolatilitySelector = ({ value, onChange }: VolatilitySelectorProps) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-primary">Select Volatility Index</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full bg-card border-border hover:border-primary transition-colors">
          <SelectValue placeholder="Choose an index..." />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          {VOLATILITY_INDICES.map((index) => (
            <SelectItem 
              key={index.value} 
              value={index.value}
              className="hover:bg-secondary focus:bg-secondary"
            >
              {index.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
