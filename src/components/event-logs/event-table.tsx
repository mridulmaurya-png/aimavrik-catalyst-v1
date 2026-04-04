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
import { cn } from "@/lib/utils"

interface EventLog {
  id: string
  type: string
  source: string
  contact: string
  receivedAt: string
  status: 'processed' | 'queued' | 'failed' | 'ignored'
  outcomeBadge: string
  outcomeDetail?: string
}

const EVENT_LOGS: EventLog[] = [
  {
    id: "evt_8k2n1z",
    type: "checkout_completed",
    source: "Shopify",
    contact: "alex@example.com",
    receivedAt: "2m ago",
    status: "processed",
    outcomeBadge: "matched playbook",
    outcomeDetail: "Triggered 'Cart Recovery'"
  },
  {
    id: "evt_3m9j5x",
    type: "form_submission",
    source: "Website",
    contact: "sarah@chen.design",
    receivedAt: "15m ago",
    status: "processed",
    outcomeBadge: "action executed",
    outcomeDetail: "WhatsApp Intro Sent"
  },
  {
    id: "evt_1p0v4q",
    type: "lead_captured",
    source: "Meta Ads",
    contact: "unknown_392",
    receivedAt: "1h ago",
    status: "ignored",
    outcomeBadge: "duplicate skipped",
    outcomeDetail: "Lead exists in HubSpot"
  },
  {
    id: "evt_7r5u2w",
    type: "payment_failed",
    source: "Stripe",
    contact: "mark@thompson.io",
    receivedAt: "2h ago",
    status: "failed",
    outcomeBadge: "failed validation",
    outcomeDetail: "Invalid payload signature"
  },
  {
    id: "evt_2k8l9o",
    type: "appointment_booked",
    source: "Calendly",
    contact: "elena@vance.com",
    receivedAt: "5h ago",
    status: "processed",
    outcomeBadge: "matched playbook",
    outcomeDetail: "Confirmed: Sales Intro"
  }
];

interface EventTableProps {
  onRowClick: (event: EventLog) => void
}

export function EventTable({ onRowClick }: EventTableProps) {
  return (
    <div className="rounded-xl border border-brand-border bg-brand-bg-secondary overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[120px]">Event ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Outcome</TableHead>
            <TableHead className="text-right">Received At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {EVENT_LOGS.map((event) => (
            <TableRow 
              key={event.id} 
              className="group cursor-pointer hover:bg-white/[0.02]"
              onClick={() => onRowClick(event)}
            >
              <TableCell className="font-mono text-[11px] text-brand-text-tertiary">
                {event.id}
              </TableCell>
              <TableCell className="font-bold text-brand-text-secondary group-hover:text-brand-text-primary transition-colors">
                {event.type}
              </TableCell>
              <TableCell>
                <Badge variant="neutral" className="bg-white/[0.03] text-[10px] border-brand-border/40">
                  {event.source}
                </Badge>
              </TableCell>
              <TableCell className="text-body-sm text-brand-text-secondary">
                {event.contact}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Badge variant={
                    event.status === 'processed' ? 'success' : 
                    event.status === 'failed' ? 'error' : 
                    event.status === 'ignored' ? 'neutral' : 'warning'
                  } className="w-fit text-[10px] px-1.5 py-0 uppercase tracking-tighter">
                    {event.outcomeBadge}
                  </Badge>
                  {event.outcomeDetail && (
                    <span className="text-[11px] text-brand-text-tertiary font-medium">
                      {event.outcomeDetail}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right text-body-sm text-brand-text-tertiary">
                {event.receivedAt}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
