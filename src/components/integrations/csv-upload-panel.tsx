"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw, Info, ArrowLeft, ArrowRight } from "lucide-react";
import { importContacts } from "@/app/actions/import";
import Papa from "papaparse";
import { ColumnMapping } from "./column-mapping";

type ImportState = "idle" | "parsing" | "mapping" | "importing" | "done" | "error";

interface ImportResult {
  total: number;
  imported: number;
  duplicates: number;
  errors: number;
  errorDetails?: string[];
}

export function CSVUploadPanel() {
  const [state, setState] = React.useState<ImportState>("idle");
  const [result, setResult] = React.useState<ImportResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [csvData, setCsvData] = React.useState<any[]>([]);
  const [headers, setHeaders] = React.useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    setResult(null);

    if (!file.name.endsWith('.csv')) {
      setError("Please upload a CSV file.");
      setState("error");
      return;
    }

    setState("parsing");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length === 0) {
           setError("The file is empty.");
           setState("error");
           return;
        }
        setHeaders(results.meta.fields || []);
        setCsvData(results.data);
        setState("mapping");
      },
      error: (err) => {
        setError(err.message);
        setState("error");
      }
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmMapping = async (mapping: Record<string, string>) => {
    setState("importing");
    
    // Transform data according to mapping
    const mappedData = csvData.map(row => {
      const mappedRow: Record<string, any> = {};
      Object.entries(mapping).forEach(([targetField, sourceHeader]) => {
        if (sourceHeader && sourceHeader !== "skip") {
          mappedRow[targetField] = row[sourceHeader];
        }
      });
      return mappedRow;
    });

    try {
      const importResult = await importContacts(mappedData);
      if (importResult.success) {
        setResult({
          total: importResult.total || 0,
          imported: importResult.imported || 0,
          duplicates: importResult.duplicates || 0,
          errors: importResult.errors || 0,
          errorDetails: importResult.errorDetails
        });
        setState("done");
      } else {
        setError(importResult.error || "Import failed");
        setState("error");
      }
    } catch (err: any) {
      setError(err.message || "Failed to process import");
      setState("error");
    }
  };

  const resetState = () => {
    setState("idle");
    setResult(null);
    setError(null);
    setFileName(null);
    setCsvData([]);
  };

  return (
    <Card variant="elevated" className="p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-2 border-b border-brand-border/30">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2 text-brand-text-primary">
            <FileSpreadsheet className="w-5 h-5 text-brand-primary" />
            <h4 className="text-heading-4 font-bold tracking-tight">Lead Ingestion (CSV)</h4>
          </div>
          <p className="text-body-sm text-brand-text-secondary leading-relaxed">
            Quickly bring your leads into Catalyst. Map your columns to sync contact details, lifecycle stages, and revenue scores instantly.
          </p>
        </div>

        <Badge variant={state === "done" ? "success" : "neutral"} className="px-3 py-1 animate-in fade-in transition-all">
          {state === "mapping" ? "Step 2: Mapping" : "Contact Import"}
        </Badge>
      </div>

      {state === "idle" && (
        <div className="border-2 border-dashed border-brand-border/60 rounded-xl p-12 flex flex-col items-center gap-4 hover:border-brand-primary/40 transition-colors animate-in fade-in duration-500">
          <div className="w-14 h-14 rounded-full bg-brand-bg-secondary border border-brand-border shadow-glow flex items-center justify-center">
            <Upload className="w-6 h-6 text-brand-text-tertiary" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-body-sm font-bold text-brand-text-primary">Upload your lead list</p>
            <p className="text-[11px] text-brand-text-tertiary max-w-[280px]">CSV recommended. Max 500 records per batch for managed processing speed.</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
            id="csv-upload-input"
          />
          <Button
            variant="primary"
            className="h-10 px-8 gap-2 shadow-glow-primary"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4" />
            Choose CSV File
          </Button>
        </div>
      )}

      {state === "parsing" && (
        <div className="py-12 flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 text-brand-primary animate-spin" />
          <p className="text-body-sm font-bold text-brand-text-primary">Preparing file for mapping...</p>
        </div>
      )}

      {state === "mapping" && (
        <ColumnMapping 
            headers={headers} 
            sampleRows={csvData.slice(0, 3)} 
            onConfirm={handleConfirmMapping} 
            onCancel={resetState} 
        />
      )}

      {state === "importing" && (
        <div className="border border-brand-primary/30 rounded-xl p-12 flex flex-col items-center gap-4 bg-brand-primary/5 animate-pulse">
          <RefreshCw className="w-8 h-8 text-brand-primary animate-spin" />
          <div className="text-center space-y-1">
            <p className="text-body-sm font-bold text-brand-text-primary">Activating your revenue system...</p>
            <p className="text-[11px] text-brand-text-tertiary font-medium">Normalizing, deduplicating, and matching playbooks</p>
          </div>
        </div>
      )}

      {state === "done" && result && (
        <div className="border border-functional-success/30 rounded-xl p-8 space-y-6 bg-functional-success/5 animate-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center gap-3 text-functional-success">
            <div className="w-10 h-10 rounded-full bg-functional-success/20 flex items-center justify-center">
                 <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-body-sm font-bold">Import Batch Successful</p>
              <p className="text-[11px] text-brand-text-tertiary uppercase font-bold tracking-widest">{fileName}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 p-4 bg-brand-bg-primary/50 border border-brand-border/40 rounded-lg">
            <div className="text-center space-y-1">
              <p className="text-heading-3 font-bold text-brand-text-primary">{result.total}</p>
              <p className="text-[9px] text-brand-text-tertiary uppercase font-bold tracking-widest">Total</p>
            </div>
            <div className="text-center space-y-1">
              <p className="text-heading-3 font-bold text-functional-success">{result.imported}</p>
              <p className="text-[9px] text-brand-text-tertiary uppercase font-bold tracking-widest">Imported</p>
            </div>
            <div className="text-center space-y-1">
              <p className="text-heading-3 font-bold text-brand-text-secondary">{result.duplicates}</p>
              <p className="text-[9px] text-brand-text-tertiary uppercase font-bold tracking-widest">Deduplicated</p>
            </div>
            <div className="text-center space-y-1">
              <p className="text-heading-3 font-bold text-functional-error">{result.errors}</p>
              <p className="text-[9px] text-brand-text-tertiary uppercase font-bold tracking-widest">Errors</p>
            </div>
          </div>

          {result.errors > 0 && result.errorDetails && result.errorDetails.length > 0 && (
            <div className="p-4 bg-brand-bg-secondary rounded-lg space-y-2 border border-brand-border/30">
               <div className="flex items-center gap-2 text-brand-text-tertiary">
                 <AlertCircle className="w-3.5 h-3.5 text-functional-error" />
                 <span className="text-[10px] font-bold uppercase tracking-widest">Error Log</span>
               </div>
               {result.errorDetails.map((detail, i) => (
                 <p key={i} className="text-[11px] text-brand-text-secondary font-medium">• {detail}</p>
               ))}
            </div>
          )}

          <div className="flex justify-center pt-2">
            <Button variant="ghost" className="h-10 px-8 gap-2 text-brand-primary hover:bg-brand-primary/5" onClick={resetState}>
              Import Another List
            </Button>
          </div>
        </div>
      )}

      {state === "error" && (
        <div className="border border-functional-error/30 rounded-xl p-8 space-y-4 bg-functional-error/5 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3 text-functional-error">
            <AlertCircle className="w-6 h-6" />
            <p className="text-body-sm font-bold">Incompatible File Format</p>
          </div>
          <p className="text-body-sm text-brand-text-secondary leading-relaxed">{error}</p>
          <div className="pt-2">
            <Button variant="secondary" className="h-10 px-8 border-functional-error/20 text-functional-error hover:bg-functional-error/5" onClick={resetState}>
              <ArrowLeft className="w-3.5 h-3.5 mr-2" />
              Try Another File
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
