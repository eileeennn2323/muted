"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const UNLOCK_FLAG = "muted_unlocked";

/**
 * Client-side visual gate only — this is the mock PIN / face-unlock demo
 * device from the masterplan, not real security. It never touches Supabase
 * or any private data; the actual workspace isolation is enforced server-side
 * via the muted_session cookie regardless of whether this gate is passed.
 */
export default function UnlockGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unlocked = window.localStorage.getItem(UNLOCK_FLAG) === "true";
    if (!unlocked) {
      router.replace("/unlock");
      return;
    }
    // One-time sync from an external store (localStorage) to let this
    // client-only gate render its children — not state derived from props.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <span className="font-serif text-2xl font-light tracking-tight text-cocoa-soft">Muted</span>
      </div>
    );
  }

  return <>{children}</>;
}
