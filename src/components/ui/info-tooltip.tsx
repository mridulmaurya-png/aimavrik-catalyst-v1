import { Info } from "lucide-react";
import React from "react";

export function InfoTooltip({ title, meaning, why, example }: { title: string, meaning: string, why: string, example?: string }) {
  return (
    <div className="relative group inline-block ml-1 align-middle">
      <Info className="w-3.5 h-3.5 text-brand-text-tertiary group-hover:text-brand-primary transition-colors cursor-help" />
      <div className="absolute z-[100] bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-brand-surface border border-brand-primary/20 rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all text-left">
         <p className="text-[12px] font-bold text-brand-text-primary mb-1">{title}</p>
         <p className="text-[11px] text-brand-text-secondary leading-relaxed mb-2">{meaning}</p>
         
         <div className="bg-brand-primary/5 p-2 rounded border border-brand-primary/10 mb-2">
            <p className="text-[10px] text-brand-primary font-bold mb-0.5 uppercase tracking-wider">Why it matters</p>
            <p className="text-[11px] text-brand-text-primary leading-relaxed">{why}</p>
         </div>
         
         {example && (
           <div className="pl-2 border-l-2 border-brand-border">
             <p className="text-[10px] text-brand-text-tertiary font-bold mb-0.5 uppercase tracking-wider">Example</p>
             <p className="text-[11px] text-brand-text-secondary italic">"{example}"</p>
           </div>
         )}
      </div>
    </div>
  );
}
