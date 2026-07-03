"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Re-fetches the (server-rendered) feed whenever checkins change, instead
 * of duplicating the joined feed query on the client.
 */
export function FeedRealtimeRefresher() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("checkins-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "checkins" },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
