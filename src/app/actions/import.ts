"use server";

import { createClient } from "@/lib/supabase/server";
import { requireWorkspace } from "@/lib/auth/context";
import { processIncomingEvent } from "@/lib/engine/orchestrator";
import { revalidatePath } from "next/cache";

interface ImportRow {
  full_name?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  source?: string;
  notes?: string;
  [key: string]: any;
}

export async function importContacts(rows: ImportRow[]) {
  const { businessId } = await requireWorkspace();
  const supabase = await createClient();

  if (!rows || rows.length === 0) {
    return { success: false, error: "No rows provided" };
  }

  // Cap at 500 rows per import for V1
  const batch = rows.slice(0, 500);
  
  let imported = 0;
  let duplicates = 0;
  let errors = 0;
  const errorDetails: string[] = [];

  for (const row of batch) {
    try {
      // 1. Base Identification normalization
      const email = row.email?.trim().toLowerCase() || undefined;
      const phone = row.phone?.toString().trim() || undefined;

      if (!email && !phone) {
        errors++;
        errorDetails.push(`Row skipped — no identifier: ${row.full_name || 'Unknown'}`);
        continue;
      }

      // 2. Data Enrichment from mapping
      const fullName = row.full_name || row.name || 
        [row.first_name, row.last_name].filter(Boolean).join(' ') || 
        'Unknown Contact';

      // 3. Metadata & Revenue Enrichment
      const payload = {
        business_id: businessId,
        event_type: "csv_import",
        source: row.source || "csv_upload",
        email,
        phone,
        full_name: fullName,
        name: fullName,
        language: row.language,
        region: row.region,
        metadata: {
          import_source: "csv_mapping",
          company: row.company || null,
          lifecycle_stage: row.lifecycle_stage || "lead",
          lead_score: row.lead_score ? parseInt(row.lead_score.toString()) : null,
          opportunity_value: row.opportunity_value ? parseFloat(row.opportunity_value.toString()) : null,
          notes: row.notes || null,
          raw_mapped_row: row
        }
      };

      const result = await processIncomingEvent(businessId, payload, "csv_upload");

      if (result.status === "duplicate") {
        duplicates++;
      } else if (result.status === "error") {
        errors++;
        errorDetails.push(result.message || "Unknown error");
      } else {
        imported++;
      }
    } catch (err: any) {
      errors++;
      errorDetails.push(err.message || "Processing error");
    }
  }

  // Register CSV as an integration source if first import
  const { data: existingIntegration } = await supabase
    .from("integrations")
    .select("id")
    .eq("business_id", businessId)
    .eq("provider", "csv_upload")
    .maybeSingle();

  if (!existingIntegration) {
    await supabase.from("integrations").insert({
      business_id: businessId,
      provider: "csv_upload",
      status: "active"
    });
  }

  // Audit log
  await supabase.from("audit_logs").insert({
    business_id: businessId,
    log_type: "CSV_IMPORT",
    log_data_json: {
      total_rows: batch.length,
      imported,
      duplicates,
      errors,
      error_details: errorDetails.slice(0, 10) // Cap stored errors
    }
  });

  revalidatePath("/contacts");
  revalidatePath("/dashboard");
  revalidatePath("/integrations");
  revalidatePath("/event-logs");

  return {
    success: true,
    total: batch.length,
    imported,
    duplicates,
    errors,
    errorDetails: errorDetails.slice(0, 5)
  };
}
