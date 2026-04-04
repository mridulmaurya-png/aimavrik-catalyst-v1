import * as React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Download, CreditCard, CheckCircle2 } from "lucide-react"

export function UsageProgressCard({ label, used, total, unit }: { label: string, used: number, total: number, unit: string }) {
  const percentage = Math.min((used / total) * 100, 100);
  
  return (
    <Card variant="elevated" className="p-6 space-y-4 bg-brand-bg-secondary/50">
      <div className="flex justify-between items-end">
        <p className="text-[11px] text-brand-text-tertiary font-bold uppercase tracking-widest">{label}</p>
        <p className="text-body-sm font-bold text-brand-text-secondary">
          {used.toLocaleString()} / <span className="text-brand-text-tertiary">{total.toLocaleString()}</span> {unit}
        </p>
      </div>
      <div className="h-2 w-full bg-brand-bg-primary border border-brand-border rounded-full overflow-hidden">
        <div 
          className="h-full bg-brand-primary transition-all duration-500" 
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-[10px] text-brand-text-tertiary font-medium">
        {100 - Math.round(percentage)}% of monthly limit remaining
      </p>
    </Card>
  )
}

export function InvoiceTable() {
  const invoices = [
    { id: "INV-2026-003", date: "Mar 01, 2026", amount: "$249.00", status: "Paid" },
    { id: "INV-2026-002", date: "Feb 01, 2026", amount: "$249.00", status: "Paid" },
    { id: "INV-2026-001", date: "Jan 01, 2026", amount: "$249.00", status: "Paid" },
  ];

  return (
    <div className="rounded-xl border border-brand-border bg-brand-bg-secondary overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Invoice ID</TableHead>
            <TableHead>Billing Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id} className="group">
              <TableCell className="font-mono text-body-sm text-brand-text-secondary">{invoice.id}</TableCell>
              <TableCell className="text-body-sm text-brand-text-secondary">{invoice.date}</TableCell>
              <TableCell className="font-bold text-brand-text-primary">{invoice.amount}</TableCell>
              <TableCell>
                <Badge variant="success" className="bg-functional-success/10 text-functional-success border-none">
                  {invoice.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <button 
                  disabled 
                  title="Historical invoices available in production"
                  className="text-brand-text-tertiary opacity-40 cursor-not-allowed p-1"
                >
                  <Download className="w-4 h-4" />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
