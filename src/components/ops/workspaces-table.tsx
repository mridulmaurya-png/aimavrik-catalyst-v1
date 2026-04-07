"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getLifecycleLabel, getLifecycleColor } from "@/lib/config/ops-constants";
import { ChevronRight, Check, AlertCircle, Clock, Plug, Zap } from "lucide-react";

interface WorkspaceRow {
  id: string;
  business_name: string;
  status: string;
  created_at: string;
  updated_at: string;
  owner_email: string;
  onboarding_submitted: boolean;
  integrations_connected: number;
  automations_active: number;
}

export function OpsWorkspacesTable({ workspaces }: { workspaces: WorkspaceRow[] }) {
  return (
    <div className="card-elevated overflow-hidden">
      <table className="table-premium w-full">
        <thead>
          <tr className="border-b border-brand-border">
            <th className="h-11 px-5 text-left align-middle text-[10px] font-bold text-brand-text-tertiary uppercase tracking-widest">Business</th>
            <th className="h-11 px-5 text-left align-middle text-[10px] font-bold text-brand-text-tertiary uppercase tracking-widest">Owner</th>
            <th className="h-11 px-5 text-left align-middle text-[10px] font-bold text-brand-text-tertiary uppercase tracking-widest">Status</th>
            <th className="h-11 px-5 text-center align-middle text-[10px] font-bold text-brand-text-tertiary uppercase tracking-widest">Onboarding</th>
            <th className="h-11 px-5 text-center align-middle text-[10px] font-bold text-brand-text-tertiary uppercase tracking-widest">Integrations</th>
            <th className="h-11 px-5 text-center align-middle text-[10px] font-bold text-brand-text-tertiary uppercase tracking-widest">Automations</th>
            <th className="h-11 px-5 text-right align-middle text-[10px] font-bold text-brand-text-tertiary uppercase tracking-widest">Updated</th>
            <th className="h-11 px-3 w-10"></th>
          </tr>
        </thead>
        <tbody>
          {workspaces.length === 0 && (
            <tr>
              <td colSpan={8} className="p-12 text-center text-brand-text-tertiary text-body-sm">
                No client workspaces yet.
              </td>
            </tr>
          )}
          {workspaces.map((ws) => (
            <tr key={ws.id} className="border-b border-brand-border/40 hover:bg-white/[0.015] transition-colors group">
              <td className="px-5 py-4">
                <Link href={`/ops/workspaces/${ws.id}`} className="group/link">
                  <span className="text-body-sm font-bold text-brand-text-primary group-hover/link:text-brand-primary transition-colors">{ws.business_name}</span>
                  <span className="block text-[10px] text-brand-text-tertiary font-mono mt-0.5">{ws.id.slice(0, 8)}…</span>
                </Link>
              </td>
              <td className="px-5 py-4">
                <span className="text-body-sm text-brand-text-secondary">{ws.owner_email}</span>
              </td>
              <td className="px-5 py-4">
                <Badge variant={getLifecycleColor(ws.status)}>
                  {getLifecycleLabel(ws.status)}
                </Badge>
              </td>
              <td className="px-5 py-4 text-center">
                {ws.onboarding_submitted ? (
                  <Check className="w-4 h-4 text-functional-success mx-auto" />
                ) : (
                  <Clock className="w-4 h-4 text-brand-text-tertiary mx-auto opacity-40" />
                )}
              </td>
              <td className="px-5 py-4 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <Plug className="w-3.5 h-3.5 text-brand-text-tertiary" />
                  <span className="text-body-sm font-bold text-brand-text-primary">{ws.integrations_connected}</span>
                </div>
              </td>
              <td className="px-5 py-4 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-brand-text-tertiary" />
                  <span className="text-body-sm font-bold text-brand-text-primary">{ws.automations_active}</span>
                </div>
              </td>
              <td className="px-5 py-4 text-right">
                <span className="text-[11px] text-brand-text-tertiary">
                  {ws.updated_at ? new Date(ws.updated_at).toLocaleDateString() : "—"}
                </span>
              </td>
              <td className="px-3 py-4">
                <Link href={`/ops/workspaces/${ws.id}`}>
                  <ChevronRight className="w-4 h-4 text-brand-text-tertiary group-hover:text-brand-primary transition-colors" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
