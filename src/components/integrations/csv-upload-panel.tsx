"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw, Info } from "lucide-react";
import { importContacts } from "@/app/actions/import";

type ImportState = "idle" | "parsing" | "importing" | "done" | "error";

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
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): Record<string, string>[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/["\s]+/g, '_'));
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim().replace(/^"|"$/g, ''));
      if (values.length === 0 || (values.length === 1 && !values[0])) continue;
      
      const row: Record<string, string> = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });
      rows.push(row);
    }
    return rows;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    setResult(null);

    // Validate file type
    const validTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ];
    
    if (!file.name.endsWith('.csv') && !validTypes.includes(file.type)) {
      setError("Please upload a CSV file. Excel (.xlsx) support coming soon.");
      setState("error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File too large. Maximum 5MB per import.");
      setState("error");
      return;
    }

    setState("parsing");

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        setError("No valid rows found. Ensure your CSV has a header row and at least one data row.");
        setState("error");
        return;
      }

      // Validate that at least email or phone column exists
      const firstRow = rows[0];
      const hasEmail = 'email' in firstRow;
      const hasPhone = 'phone' in firstRow;
      
      if (!hasEmail && !hasPhone) {
        setError("CSV must contain at least an 'email' or 'phone' column header.");
        setState("error");
        return;
      }

      setState("importing");

      const importResult = await importContacts(rows);

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
      setError(err.message || "Failed to process file");
      setState("error");
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetState = () => {
    setState("idle");
    setResult(null);
    setError(null);
    setFileName(null);
  };

  return (
    <Card variant="elevated" className="p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2 text-brand-text-primary">
            <FileSpreadsheet className="w-5 h-5 text-brand-primary" />
            <h4 className="text-heading-4 font-bold tracking-tight">CSV / Excel Import</h4>
          </div>
          <p className="text-body-sm text-brand-text-secondary leading-relaxed">
            Upload a CSV file containing your contacts. Each row automatically enters the lead processing pipeline — deduplication, normalization, and playbook matching happen instantly.
          </p>
          <div className="flex items-center gap-2 text-[11px] text-brand-text-tertiary font-medium pt-1">
            <Info className="w-3.5 h-3.5" />
            Required columns: <code className="bg-brand-bg-secondary px-1.5 py-0.5 rounded text-brand-primary">email</code> or <code className="bg-brand-bg-secondary px-1.5 py-0.5 rounded text-brand-primary">phone</code>. Optional: <code className="bg-brand-bg-secondary px-1.5 py-0.5 rounded text-brand-text-tertiary">full_name</code>, <code className="bg-brand-bg-secondary px-1.5 py-0.5 rounded text-brand-text-tertiary">source</code>, <code className="bg-brand-bg-secondary px-1.5 py-0.5 rounded text-brand-text-tertiary">notes</code>
          </div>
        </div>

        <Badge variant="neutral" className="px-3 py-1">
          Fallback Source
        </Badge>
      </div>

      {/* Upload Area */}
      {state === "idle" && (
        <div className="border-2 border-dashed border-brand-border/60 rounded-xl p-8 flex flex-col items-center gap-4 hover:border-brand-primary/40 transition-colors">
          <div className="w-14 h-14 rounded-full bg-brand-bg-secondary border border-brand-border flex items-center justify-center">
            <Upload className="w-6 h-6 text-brand-text-tertiary" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-body-sm font-bold text-brand-text-primary">Drop a CSV file here, or click to browse</p>
            <p className="text-[11px] text-brand-text-tertiary">Max 500 contacts per import · 5MB limit</p>
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
            variant="secondary"
            className="h-10 px-6 gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4" />
            Select CSV File
          </Button>
        </div>
      )}

      {/* Parsing State */}
      {state === "parsing" && (
        <div className="border border-brand-border rounded-xl p-8 flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 text-brand-primary animate-spin" />
          <p className="text-body-sm font-bold text-brand-text-primary">Parsing {fileName}...</p>
        </div>
      )}

      {/* Importing State */}
      {state === "importing" && (
        <div className="border border-brand-primary/30 rounded-xl p-8 flex flex-col items-center gap-3 bg-brand-primary/5">
          <RefreshCw className="w-6 h-6 text-brand-primary animate-spin" />
          <p className="text-body-sm font-bold text-brand-text-primary">Processing contacts through pipeline...</p>
          <p className="text-[11px] text-brand-text-tertiary">Normalizing, deduplicating, and matching playbooks</p>
        </div>
      )}

      {/* Success State */}
      {state === "done" && result && (
        <div className="border border-functional-success/30 rounded-xl p-6 space-y-4 bg-functional-success/5">
          <div className="flex items-center gap-2 text-functional-success">
            <CheckCircle2 className="w-5 h-5" />
            <p className="text-body-sm font-bold">Import Complete</p>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-heading-4 font-bold text-brand-text-primary">{result.total}</p>
              <p className="text-[10px] text-brand-text-tertiary uppercase font-bold">Total Rows</p>
            </div>
            <div className="text-center">
              <p className="text-heading-4 font-bold text-functional-success">{result.imported}</p>
              <p className="text-[10px] text-brand-text-tertiary uppercase font-bold">Imported</p>
            </div>
            <div className="text-center">
              <p className="text-heading-4 font-bold text-brand-text-secondary">{result.duplicates}</p>
              <p className="text-[10px] text-brand-text-tertiary uppercase font-bold">Duplicates</p>
            </div>
            <div className="text-center">
              <p className="text-heading-4 font-bold text-functional-error">{result.errors}</p>
              <p className="text-[10px] text-brand-text-tertiary uppercase font-bold">Errors</p>
            </div>
          </div>
          {result.errorDetails && result.errorDetails.length > 0 && (
            <div className="text-[11px] text-brand-text-tertiary space-y-1 border-t border-brand-border/30 pt-3">
              {result.errorDetails.map((detail, i) => (
                <p key={i}>• {detail}</p>
              ))}
            </div>
          )}
          <Button variant="ghost" className="h-9 gap-2 text-brand-primary" onClick={resetState}>
            Import More
          </Button>
        </div>
      )}

      {/* Error State */}
      {state === "error" && (
        <div className="border border-functional-error/30 rounded-xl p-6 space-y-3 bg-functional-error/5">
          <div className="flex items-center gap-2 text-functional-error">
            <AlertCircle className="w-5 h-5" />
            <p className="text-body-sm font-bold">Import Failed</p>
          </div>
          <p className="text-body-sm text-brand-text-secondary">{error}</p>
          <Button variant="ghost" className="h-9 gap-2 text-brand-primary" onClick={resetState}>
            Try Again
          </Button>
        </div>
      )}
    </Card>
  );
}
