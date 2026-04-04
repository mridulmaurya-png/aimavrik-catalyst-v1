"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Flag, ShieldAlert, CheckCircle2 } from "lucide-react";
import { toggleIntervention } from "@/app/actions/contacts";

interface InterventionButtonProps {
  contactId: string;
  isFlagged: boolean;
}

export function InterventionButton({ contactId, isFlagged }: InterventionButtonProps) {
  const [loading, setLoading] = useState(false);
  const [flagged, setFlagged] = useState(isFlagged);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const newState = !flagged;
      await toggleIntervention(contactId, newState);
      setFlagged(newState);
    } catch (e) {
      console.error("Failed to toggle intervention:", e);
    } finally {
      setLoading(false);
    }
  };

  if (flagged) {
    return (
      <Button 
        variant="ghost" 
        onClick={handleToggle}
        disabled={loading}
        className="h-11 border border-functional-error/50 bg-functional-error/10 text-functional-error gap-2 hover:bg-functional-error/20"
      >
        <ShieldAlert className="w-4 h-4" />
        {loading ? "Resolving..." : "Mark Resolved"}
      </Button>
    );
  }

  return (
    <Button 
      variant="ghost" 
      onClick={handleToggle}
      disabled={loading}
      className="h-11 bg-white/[0.02] border border-brand-border gap-2 hover:bg-white/[0.05]"
    >
      <Flag className="w-4 h-4" />
      {loading ? "Flagging..." : "Flag for review"}
    </Button>
  );
}
