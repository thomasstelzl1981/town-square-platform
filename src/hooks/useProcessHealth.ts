import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProcessHealthLog {
  id: string;
  system: "tlc" | "slc";
  run_date: string;
  tenant_id: string | null;
  cases_checked: number;
  issues_found: number;
  events_created: number;
  ai_summary: string | null;
  details: any;
  status: "success" | "error" | "skipped";
  error_message: string | null;
  created_at: string;
}

export function useProcessHealth(limit = 20) {
  return useQuery({
    queryKey: ["process-health-log", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("process_health_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as ProcessHealthLog[];
    },
  });
}

export function useLatestHealthBySystem() {
  return useQuery({
    queryKey: ["process-health-latest"],
    queryFn: async () => {
      // Get latest TLC run
      const { data: tlcData } = await supabase
        .from("process_health_log")
        .select("*")
        .eq("system", "tlc")
        .order("created_at", { ascending: false })
        .limit(1);

      // Get latest SLC run
      const { data: slcData } = await supabase
        .from("process_health_log")
        .select("*")
        .eq("system", "slc")
        .order("created_at", { ascending: false })
        .limit(1);

      return {
        tlc: (tlcData?.[0] || null) as ProcessHealthLog | null,
        slc: (slcData?.[0] || null) as ProcessHealthLog | null,
      };
    },
  });
}
