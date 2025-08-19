"use client";
import { useEffect } from "react";

export default function ClientProgressSync({ initialSlugs }: { initialSlugs: string[] }) {
  useEffect(() => {
    // seed localStorage from server data
    try {
      const key = "completed_lessons";
      const existing = typeof window !== "undefined" ? window.localStorage.getItem(key) || "" : "";
      const set = new Set(existing ? existing.split(",") : []);
      for (const s of initialSlugs) set.add(s);
      if (typeof window !== "undefined") window.localStorage.setItem(key, Array.from(set).join(","));
    } catch {}
    // listen for lesson-completed events and trigger a soft refresh
    function onCompleted() {
      try {
        if (typeof window !== "undefined") {
          // Soft update by replacing state to re-render on client navigations
          // On full SSR reload, server already computed the set
          const ev = new Event("progress-updated");
          window.dispatchEvent(ev);
        }
      } catch {}
    }
    window.addEventListener("lesson-completed", onCompleted as EventListener);
    return () => window.removeEventListener("lesson-completed", onCompleted as EventListener);
  }, [initialSlugs]);
  return null;
}


