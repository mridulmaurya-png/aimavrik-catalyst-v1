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
          <TableRow>
            <TableCell colSpan={5} className="text-center py-8 text-brand-text-tertiary text-body-sm">
              No invoices yet. Billing history will appear here once active.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}
