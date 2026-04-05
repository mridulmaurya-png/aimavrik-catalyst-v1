"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, RefreshCw, CheckCircle2 } from "lucide-react";
import { runWorkspaceExecution } from "@/app/actions/execution";
import { useRouter } from "next/navigation";

export function ExecutionTrigger({ queuedCount, businessStatus }: { queuedCount: number, businessStatus?: string }) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ processed: number } | null>(null);
  const router = useRouter();

  const isAllowed = businessStatus === "active";

  if (queuedCount === 0 && !result) return null;

  const handleRun = async () => {
    setRunning(true);
    setResult(null);
    try {
      const res = await runWorkspaceExecution();
      setResult({ processed: res.actions_processed });
      router.refresh(); // Refresh the page to show latest statuses
    } catch (e) {
      console.error(e);
    } finally {
      setRunning(false);
      setTimeout(() => setResult(null), 5000);
    }
  };

  if (result) {
    return (
      <Button variant="ghost" className="gap-2 shrink-0 border border-brand-primary/20 bg-brand-primary/5 text-brand-primary cursor-default h-9 text-xs">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Processed {result.processed} tasks
      </Button>
    );
  }

  return (
    <div title={!isAllowed ? "Workspace must be Active to run orchestration" : undefined}>
      <Button 
        variant="primary" 
        onClick={handleRun} 
        disabled={running || !isAllowed}
        className={`gap-2 shrink-0 h-9 text-xs animate-in fade-in duration-500 ${!isAllowed ? 'opacity-40 grayscale cursor-not-allowed' : 'shadow-glow-primary'}`}
      >
        {running ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
        {running ? "Processing Engine..." : isAllowed ? `Run Queue (${queuedCount})` : "Awaiting Activation"}
      </Button>
    </div>
  );
}
