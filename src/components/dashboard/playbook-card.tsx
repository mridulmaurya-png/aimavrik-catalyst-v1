import * as React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Play, Pause, Edit3 } from "lucide-react"
import Link from "next/link"

interface PlaybookCardProps {
  name: string
  status: 'active' | 'paused'
  events: string
  conversions: string
  revenue: string
}

export function PlaybookCard({
  name,
  status,
  events,
  conversions,
  revenue
}: PlaybookCardProps) {
  return (
    <Card variant="elevated" className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h4 className="text-heading-4 font-bold">{name}</h4>
          <Badge variant={status === 'active' ? 'success' : 'neutral'}>
            {status === 'active' ? 'Active' : 'Paused'}
          </Badge>
        </div>
        <Button variant="ghost" className="w-8 h-8 p-0">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 border-t border-brand-border/50 pt-4">
        <div>
          <p className="text-[10px] text-brand-text-tertiary uppercase font-bold tracking-tighter">Events</p>
          <p className="text-body-lg font-semibold">{events}</p>
        </div>
        <div>
          <p className="text-[10px] text-brand-text-tertiary uppercase font-bold tracking-tighter">Conversions</p>
          <p className="text-body-lg font-semibold">{conversions}</p>
        </div>
        <div>
          <p className="text-[10px] text-brand-text-tertiary uppercase font-bold tracking-tighter">Revenue</p>
          <p className="text-body-lg font-semibold text-brand-highlight">{revenue}</p>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Link href="/playbooks" className="flex-1">
          <Button variant="secondary" className="w-full h-9 text-body-sm gap-2">
            <Edit3 className="w-3.5 h-3.5" />
            Edit
          </Button>
        </Link>
        <Link href="/playbooks" className="flex-1">
          <Button variant="ghost" className="w-full h-9 text-body-sm gap-2 bg-white/[0.03]">
            {status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {status === 'active' ? 'Pause' : 'Activate'}
          </Button>
        </Link>
      </div>
    </Card>
  )
}
