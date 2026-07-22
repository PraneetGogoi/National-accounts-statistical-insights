import { ReactNode } from "react";
import { BrutalistCard } from "./BrutalistCard";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Database, AlertTriangle, CheckCircle2 } from "lucide-react";

interface ProvenanceData {
  ingestion_timestamp?: string;
  source_file_hash?: string;
  is_anomaly?: boolean;
}

interface StatBlockProps {
  label: string;
  value: ReactNode;
  change?: string;
  icon?: ReactNode;
  delay?: number;
  outlook?: 'growth' | 'decline' | 'neutral';
  provenance?: ProvenanceData;
}

export function StatBlock({ label, value, change, icon, delay = 0, outlook = 'neutral', provenance }: StatBlockProps) {
  return (
    <BrutalistCard delay={delay}>
      {icon && (
        <span className="absolute -top-0.5 -right-0.5 border-l-[3px] border-b-[3px] border-ink bg-paper p-2 flex gap-2">
          {provenance && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-ink hover:text-volt transition-colors">
                    {provenance.is_anomaly ? <AlertTriangle className="h-4 w-4 text-debit" /> : <Database className="h-4 w-4" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-paper border-[3px] border-ink text-ink font-mono rounded-none p-3 shadow-[4px_4px_0_var(--ink)]">
                  <div className="space-y-2 text-xs">
                    <p className="font-bold border-b-2 border-ink pb-1">DATA PROVENANCE</p>
                    <p><span className="opacity-70">Ingested:</span> {provenance.ingestion_timestamp ? new Date(provenance.ingestion_timestamp).toLocaleString() : 'Unknown'}</p>
                    <p><span className="opacity-70">Source Hash:</span> {provenance.source_file_hash ? provenance.source_file_hash.substring(0, 8) : 'Unknown'}</p>
                    <p className="flex items-center gap-1">
                      <span className="opacity-70">Quality Check:</span> 
                      {provenance.is_anomaly ? (
                        <span className="text-debit font-bold flex items-center gap-1"><AlertTriangle className="h-3 w-3"/> Anomalous</span>
                      ) : (
                        <span className="text-credit font-bold flex items-center gap-1"><CheckCircle2 className="h-3 w-3"/> Passed</span>
                      )}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
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
