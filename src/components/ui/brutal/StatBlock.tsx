import { ReactNode } from "react";
import { BrutalistCard } from "./BrutalistCard";

interface StatBlockProps {
  label: string;
  value: ReactNode;
  change?: string;
  icon?: ReactNode;
  delay?: number;
  outlook?: 'growth' | 'decline' | 'neutral';
}

export function StatBlock({ label, value, change, icon, delay = 0, outlook = 'neutral' }: StatBlockProps) {
  return (
    <BrutalistCard delay={delay}>
      {icon && (
        <span className="absolute -top-0.5 -right-0.5 border-l-[3px] border-b-[3px] border-ink bg-paper p-2">
          {icon}
        </span>
      )}
      <p className="font-numbers text-sm font-semibold opacity-70 mb-2 uppercase">{label}</p>
      <p className="font-heading font-bold text-3xl mb-1">{value}</p>
      {change && (
        <p className={`font-numbers text-xs font-bold ${
          outlook === 'growth' ? 'text-credit' : outlook === 'decline' ? 'text-debit' : 'text-volt'
        }`}>
          {change}
        </p>
      )}
    </BrutalistCard>
  );
}
