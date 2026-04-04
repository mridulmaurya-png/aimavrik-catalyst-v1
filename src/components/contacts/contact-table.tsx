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
import Link from "next/link"

export function ContactTable({ contacts }: { contacts: any[] }) {
  if (!contacts || contacts.length === 0) {
    return (
      <div className="p-16 border rounded-xl border-dashed border-brand-border flex items-center justify-center bg-brand-bg-secondary/30">
        <p className="text-brand-text-tertiary font-bold tracking-wider uppercase text-sm">No Contacts Found</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-brand-border bg-brand-bg-secondary overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-brand-border/50">
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Playbook</TableHead>
            <TableHead>Revenue</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Last Activity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow key={contact.id} className="group cursor-pointer border-brand-border/30">
              <TableCell>
                <Link href={`/dashboard/contacts/${contact.id}`} className="flex flex-col">
                  <span className="font-bold text-brand-text-primary group-hover:text-brand-primary transition-colors truncate max-w-[150px]">
                    {contact.full_name}
                  </span>
                  <span className="text-[11px] text-brand-text-tertiary truncate max-w-[150px]">{contact.email || contact.phone}</span>
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant="neutral" className="bg-white/[0.03] text-[10px] capitalize">
                  {contact.contact_type}
                </Badge>
              </TableCell>
              <TableCell className="text-body-sm text-brand-text-secondary capitalize">{contact.source || 'Manual'}</TableCell>
              <TableCell>
                <span className="text-body-sm text-brand-text-primary font-medium capitalize">{(contact.stage ?? '').replace('_', ' ')}</span>
              </TableCell>
              <TableCell className="text-body-sm text-brand-text-secondary italic">
                {/* Placeholder mapping until playbook assignments table is strictly queried */}
                {contact.stage === 'new' ? 'Instant Follow-up' : 'Nurture'}
              </TableCell>
              <TableCell className="font-mono text-brand-highlight text-body-sm">
                ${contact.total_revenue?.toLocaleString() || '0'}
              </TableCell>
              <TableCell>
                <Badge variant={
                  contact.stage === 'converted' ? 'info' : 
                  contact.stage === 'engaged' ? 'success' : 'warning'
                } className="min-w-[70px] justify-center">
                  {contact.stage === 'converted' ? 'Completed' : 'Active'}
                </Badge>
              </TableCell>
              <TableCell className="text-right text-body-sm text-brand-text-tertiary">
                {contact.last_active_at ? new Date(contact.last_active_at).toLocaleDateString() : '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
