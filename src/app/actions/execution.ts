"use server";

import { requireWorkspace } from "@/lib/auth/context";
import { runExecutionCycle } from "@/lib/execution/runner";
import { revalidatePath } from "next/cache";

export async function runWorkspaceExecution() {
  const { businessId } = await requireWorkspace();
  
  // Directly run execution loop. Under the hood, runner uses Service Role 
  // and picks up queued tasks. We constrain it to 20 per click for now.
  // Wait, runner.ts doesn't filter by businessId right now. 
  // Let me look at runner.ts again and adapt it so we can execute for a specific business.
  
  // For V1 demo safety, running it globally is fine, but I'll add businessId to be safe.
  try {
    const result = await runExecutionCycle(20, businessId);
    revalidatePath("/"); // Revalidate everything
    return result;
  } catch (error: any) {
    console.error("Execution failed:", error);
    throw new Error(error.message || "Failed to run execution cycle");
  }
}
