import { FilterChips } from "@/components/contacts/filter-chips";
import { ContactTable } from "@/components/contacts/contact-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, ShieldAlert } from "lucide-react";
import { requireWorkspace } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";

export default async function ContactsPage() {
  const { businessId } = await requireWorkspace();
  const supabase = await createClient();

  const { data: contacts, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("business_id", businessId)
    .order("last_active_at", { ascending: false });

  if (error) {
    return (
      <div className="p-12 text-center">
        <ShieldAlert className="w-12 h-12 text-functional-error mx-auto opacity-20" />
        <h2 className="text-heading-3 mt-4 font-bold">Failed to load contacts</h2>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-heading-1 font-bold tracking-tight">Contacts</h1>
          <p className="text-brand-text-secondary text-body-sm">
            Track every lead and customer moving through your revenue system.
          </p>
        </div>
        <Button disabled title="Manual contact addition available in production" className="gap-2 h-11 px-6 opacity-50 cursor-not-allowed">
          <Plus className="w-5 h-5" />
          Add contact
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-tertiary group-focus-within:text-brand-primary opacity-50 transition-colors" />
            <Input 
              disabled
              title="Global search available in production release"
              className="pl-10 h-11 bg-brand-bg-secondary opacity-50 cursor-not-allowed" 
              placeholder="Global search available in production" 
            />
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" disabled className="h-11 gap-2 bg-brand-bg-secondary border border-brand-border px-4 opacity-50 cursor-not-allowed" title="Filters available in production">
              <Filter className="w-4 h-4" />
              More Filters
            </Button>
          </div>
        </div>
        
        <div className="opacity-40 grayscale-[50%] pointer-events-none">
          <FilterChips />
        </div>
      </div>

      <ContactTable contacts={contacts || []} />
    </div>
  );
}
