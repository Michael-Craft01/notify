import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import AddAssignmentModal from "@/components/AddAssignmentModal";
import AssignmentCard from "@/components/AssignmentCard";
import NotificationToggle from "@/components/NotificationToggle";

export default async function Home() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch all future assignments, joined with pulse stats and current user's progress
  const { data: assignments, error } = await supabase
    .from("assignments")
    .select(`
      *,
      users (full_name),
      assignment_pulse_stats (finished_percentage, involvement_percentage),
      user_progress!left (status)
    `)
    .eq("user_progress.user_id", user.id)
    .gte("due_date", new Date().toISOString())
    .order("due_date", { ascending: true });

  if (error) {
    console.error("Error fetching assignments:", error);
  }

  const verifiedThreats = assignments?.filter((a) => a.status === "verified") || [];
  const pendingIntelligence = assignments?.filter((a) => a.status === "pending") || [];

  return (
    <div className="flex flex-col gap-8 pb-20">
      {/* Header section with branding and push toggle */}
      <header className="flex items-center justify-between pt-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white">
            NOTIFY
          </h1>
          <p className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-widest bg-[var(--color-primary)]/10 px-2 py-0.5 rounded inline-block mt-1">
            Deadline Warden v1.0
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NotificationToggle />
          <AddAssignmentModal userId={user.id} />
        </div>
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

        {pendingIntelligence.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--color-surface-hover)] p-8 text-center text-sm text-[var(--color-text-muted)]">
            No intelligence awaiting verification.
          </div>
        ) : (
          pendingIntelligence.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment as any}
              currentUserId={user.id}
            />
          ))
        )}
      </section>

      {/* Manual logging action at bottom for accessibility */}
      <div className="flex justify-center mt-4">
        <AddAssignmentModal userId={user.id} />
      </div>
    </div>
  );
}
