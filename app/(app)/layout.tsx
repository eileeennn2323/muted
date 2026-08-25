import AppShell from "@/components/AppShell";
import UnlockGate from "@/components/UnlockGate";
import { ensureWorkspaceSeeded, getWorkspaceId } from "@/lib/workspace";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const workspaceId = await getWorkspaceId();

  if (workspaceId) {
    // Best-effort: if Supabase isn't configured yet (fresh clone, no .env.local)
    // or this is the very first request before the session cookie has fully
    // propagated, fall through and let pages render without seeded data
    // rather than breaking the whole shell.
    await ensureWorkspaceSeeded(workspaceId).catch((error) => {
      console.error("Failed to ensure workspace seeded:", error);
    });
  }

  return (
    <UnlockGate>
      <AppShell>{children}</AppShell>
    </UnlockGate>
  );
}
