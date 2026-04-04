import * as React from "react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Mail } from "lucide-react"
import Link from "next/link"

export function PlaybookPerformanceTable() {
  const data = [
    { name: "Abandoned Cart Recovery", entered: 1820, replies: "12%", conv: "8.2%", revenue: "$24,104" },
    { name: "New Lead Instant Follow-up", entered: 4240, replies: "24%", conv: "7.4%", revenue: "$12,380" },
    { name: "Post-Purchase Upsell", entered: 620, replies: "8%", conv: "7.2%", revenue: "$4,810" },
    { name: "Repeat Purchase Reminder", entered: 2104, replies: "15%", conv: "4.0%", revenue: "$6,420" },
  ];

  return (
    <div className="rounded-xl border border-brand-border bg-brand-bg-secondary overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Playbook</TableHead>
            <TableHead>Contacts Entered</TableHead>
            <TableHead>Reply Rate</TableHead>
            <TableHead>Conv. Rate</TableHead>
            <TableHead className="text-right">Revenue Influenced</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.name} className="group">
              <TableCell className="font-bold text-brand-text-primary group-hover:text-brand-primary transition-colors">
                <Link href="/playbooks">
                  {row.name}
                </Link>
              </TableCell>
              <TableCell className="text-body-sm text-brand-text-secondary">{row.entered.toLocaleString()}</TableCell>
              <TableCell className="text-body-sm text-brand-text-secondary">{row.replies}</TableCell>
              <TableCell>
                <Badge variant="info" className="bg-brand-primary/10 text-brand-primary border-brand-primary/20">
                  {row.conv}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-bold text-brand-highlight">{row.revenue}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function ChannelPerformance() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="p-6 rounded-xl border border-brand-border bg-brand-bg-secondary space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-green-500" />
          </div>
          <h4 className="text-body-lg font-bold text-brand-text-primary">WhatsApp Execution</h4>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <p className="text-[10px] text-brand-text-tertiary uppercase font-bold">Total Sends</p>
            <p className="text-heading-4 font-bold">8,412</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-brand-text-tertiary uppercase font-bold">Delivery Rate</p>
            <p className="text-heading-4 font-bold text-functional-success">98.2%</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-brand-text-tertiary uppercase font-bold">Reply Rate</p>
            <p className="text-heading-4 font-bold">14.1%</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-brand-text-tertiary uppercase font-bold">Conv. Rate</p>
            <p className="text-heading-4 font-bold text-brand-primary">6.4%</p>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-xl border border-brand-border bg-brand-bg-secondary space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Mail className="w-5 h-5 text-blue-500" />
          </div>
          <h4 className="text-body-lg font-bold text-brand-text-primary">Email Execution</h4>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <p className="text-[10px] text-brand-text-tertiary uppercase font-bold">Total Sends</p>
            <p className="text-heading-4 font-bold">12,840</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-brand-text-tertiary uppercase font-bold">Delivery Rate</p>
            <p className="text-heading-4 font-bold text-functional-success">99.4%</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-brand-text-tertiary uppercase font-bold">Open Rate</p>
            <p className="text-heading-4 font-bold">32.4%</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-brand-text-tertiary uppercase font-bold">Conv. Rate</p>
            <p className="text-heading-4 font-bold text-brand-primary">4.2%</p>
          </div>
        </div>
      </div>
    </div>
  )
}
