"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, AlertCircle, ArrowRight } from "lucide-react";

interface ColumnMappingProps {
  headers: string[];
  sampleRows: any[];
  onConfirm: (mapping: Record<string, string>) => void;
  onCancel: () => void;
}

const TARGET_FIELDS = [
  { id: 'full_name', label: 'Full Name', required: false },
  { id: 'email', label: 'Email Address', required: false },
  { id: 'phone', label: 'Phone / WhatsApp', required: false },
  { id: 'source', label: 'Source', required: false },
  { id: 'language', label: 'Language', required: false },
  { id: 'region', label: 'Region', required: false },
  { id: 'utm_source', label: 'UTM Source', required: false },
  { id: 'landing_page', label: 'Landing Page', required: false },
];

export function ColumnMapping({ headers, sampleRows, onConfirm, onCancel }: ColumnMappingProps) {
  const [mapping, setMapping] = React.useState<Record<string, string>>({});

  // Auto-map based on string matching
  React.useEffect(() => {
    const autoMap: Record<string, string> = {};
    headers.forEach(header => {
      const normalized = header.toLowerCase().replace(/[\s\-_]+/g, '');
      const match = TARGET_FIELDS.find(f => 
        f.id.replace(/_/g, '') === normalized || 
        f.label.toLowerCase().includes(normalized) ||
        normalized.includes(f.id.replace(/_/g, ''))
      );
      if (match) {
        autoMap[match.id] = header;
      }
    });
    setMapping(autoMap);
  }, [headers]);

  const handleSelectChange = (fieldId: string, csvHeader: string) => {
    setMapping(prev => ({
      ...prev,
      [fieldId]: csvHeader
    }));
  };

  const isIdentifierMapped = !!mapping['email'] || !!mapping['phone'];

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="space-y-1">
        <h3 className="text-body-lg font-bold">Map CSV Columns</h3>
        <p className="text-[11px] text-brand-text-tertiary">Select which column in your file matches each Catalyst field.</p>
      </div>

      <div className="grid gap-3">
        {TARGET_FIELDS.map((field) => (
          <div key={field.id} className="flex items-center gap-4 p-3 rounded-lg border border-brand-border bg-brand-bg-primary/50 group hover:border-brand-primary/30 transition-all">
            <div className="flex-1 min-w-0">
               <div className="flex items-center gap-2">
                 <span className="text-body-sm font-semibold">{field.label}</span>
                 {field.required && <Badge variant="neutral" className="text-[9px] bg-brand-primary/10 text-brand-primary border-brand-primary/20">Required</Badge>}
               </div>
               <p className="text-[10px] text-brand-text-tertiary truncate">
                 {mapping[field.id] ? `Linked to: ${mapping[field.id]}` : 'Not mapped'}
               </p>
            </div>

            <ArrowRight className="w-4 h-4 text-brand-text-tertiary opacity-40" />

            <div className="w-[200px]">
              <select 
                value={mapping[field.id] || "skip"} 
                onChange={(e) => handleSelectChange(field.id, e.target.value)}
                className="w-full h-9 text-xs bg-brand-bg-secondary border border-brand-border rounded-md px-2 focus:outline-none focus:border-brand-primary"
              >
                <option value="skip">Skip field</option>
                {headers.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>

      {!isIdentifierMapped && (
        <div className="p-3 bg-functional-error/10 border border-functional-error/30 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-functional-error mt-0.5" />
          <p className="text-[11px] text-functional-error leading-relaxed">
            <b>Email Address</b> or <b>Phone Number</b> must be mapped to proceed. This is used for contact deduplication and identification.
          </p>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-border/50">
        <Button variant="ghost" onClick={onCancel} className="text-xs h-9">Cancel</Button>
        <Button 
          variant="primary" 
          onClick={() => onConfirm(mapping)} 
          disabled={!isIdentifierMapped}
          className="h-9 px-6 gap-2 text-xs"
        >
          <Check className="w-3.5 h-3.5" />
          Confirm Mapping
        </Button>
      </div>
    </div>
  );
}
