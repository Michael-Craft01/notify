import { BellRing } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import AssignmentCard from "@/components/AssignmentCard";
import AddAssignmentModal from "@/components/AddAssignmentModal";

export default async function Home() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch all future assignments, ordered by urgency
  const { data: assignments, error } = await supabase
    .from("assignments")
    .select("*, users (full_name)")
    .gte("due_date", new Date().toISOString())
    .order("due_date", { ascending: true });

  if (error) {
    console.error("Failed to fetch assignments:", error);
  }

  const verifiedThreats = assignments?.filter((a) => a.status === "verified") || [];
  const pendingIntel = assignments?.filter((a) => a.status === "pending") || [];

  return (
    <main className="flex min-h-screen flex-col bg-[var(--color-background)] p-6 pb-24 relative">
      <header className="flex items-center justify-between pb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-primary)]">Notify</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Deadline Warden</p>
        </div>
        <button className="rounded-full bg-[var(--color-surface-hover)] p-2 text-[var(--color-text-main)] transition-colors hover:bg-[var(--color-primary-light)]">
          <BellRing size={20} />
        </button>
      </header>

      <section className="mt-4 flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-[var(--color-text-main)]">Verified Threats</h2>

        {verifiedThreats.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--color-surface-hover)] p-8 text-center text-sm text-[var(--color-text-muted)]">
            No immediate verified threats on the horizon.
          </div>
        ) : (
          verifiedThreats.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment as any}
              currentUserId={user.id}
            />
          ))
        )}

        <h2 className="mt-6 text-lg font-semibold text-[var(--color-text-main)]">Pending Intelligence</h2>

        {pendingIntel.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--color-surface-hover)] p-8 text-center text-sm text-[var(--color-text-muted)]">
            No intelligence awaiting verification.
          </div>
        ) : (
          pendingIntel.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment as any}
              currentUserId={user.id}
            />
          ))
        )}
      </section>

      {/* Fixed bottom logging action */}
      <AddAssignmentModal userId={user.id} />
    </main>
  );
}
