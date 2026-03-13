import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import AddAssignmentModal from "@/components/AddAssignmentModal";
import AssignmentCard from "@/components/AssignmentCard";
import NotificationToggle from "@/components/NotificationToggle";
import { Terminal, Clock, CheckCircle2, AlertTriangle, TrendingUp, Users } from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  let { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const cookieStore = await cookies();
    const mockUserEmail = cookieStore.get("notify-mock-user")?.value;
    if (mockUserEmail) {
      user = { id: "00000000-0000-0000-0000-000000000000", email: mockUserEmail } as any;
    }
  }
  if (!user) redirect("/login");

  const { data: assignments } = await supabase
    .from("assignments")
    .select(`*, users!created_by (full_name), user_progress (status, user_id)`)
    .gte("due_date", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order("due_date", { ascending: true });

  const { data: pulseStats } = await supabase.from("assignment_pulse_stats").select("*");
  const pulseMap = new Map((pulseStats || []).map((p: any) => [p.assignment_id, p]));

  const allTasks = (assignments || []).map((a) => ({
    ...a,
    pulse: pulseMap.get(a.id) || { finished_percentage: 0, involvement_percentage: 0 },
    myProgress: a.user_progress?.find((p: any) => p.user_id === user!.id)?.status || "not_started",
  }));

  const now = Date.now();
  const upcoming = allTasks.filter((a) => a.myProgress !== "finished" && new Date(a.due_date).getTime() >= now);
  const overdue  = allTasks.filter((a) => a.myProgress !== "finished" && new Date(a.due_date).getTime() < now);
  const done     = allTasks.filter((a) => a.myProgress === "finished");

  const { data: userProfile } = await supabase
    .from("users").select("full_name, cohort_year").eq("id", user.id).single();

  const displayName = userProfile?.full_name || user.email?.split("@")[0] || "User";
  const firstName   = displayName.split(" ")[0];
  const initials    = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const stats = [
    { label: "Upcoming",  value: upcoming.length, icon: Clock },
    { label: "Overdue",   value: overdue.length,  icon: AlertTriangle },
    { label: "Completed", value: done.length,      icon: CheckCircle2 },
    { label: "Cohort",    value: pulseStats?.[0]?.total_cohort ?? "—", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg)] font-[family-name:var(--font-inter)]">

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-[#070707]/80 backdrop-blur-xl border-b border-[var(--color-border)] transition-all">
        <div className="max-w-[1200px] mx-auto px-6 h-[60px] flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2.5 group cursor-pointer">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#F97316] to-[#EA580C] shadow-[0_0_16px_rgba(249,115,22,0.40)] group-hover:shadow-[0_0_24px_rgba(249,115,22,0.60)] transition-shadow">
              <Terminal size={14} color="#fff" strokeWidth={2.5} />
            </div>
            <span className="font-[family-name:var(--font-outfit)] font-extrabold text-[15px] tracking-[0.05em] uppercase text-white/95 group-hover:text-white transition-colors">
              Notify
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <NotificationToggle />
            <div className="w-[1px] h-5 bg-[var(--color-border)]" />
            <AddAssignmentModal userId={user.id} />
            <div 
              className="h-[34px] w-[34px] rounded-full border border-[var(--color-border-hover)] bg-[var(--color-surface-2)] flex items-center justify-center text-[11px] font-extrabold tracking-[0.04em] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-3)] hover:text-[var(--color-text-main)] transition-colors cursor-pointer"
              title={displayName}
            >
              {initials}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1200px] mx-auto pt-12 px-6 pb-20 flex flex-col gap-6 text-[var(--color-text-main)]">
        <section>
          <div className="text-base font-semibold mb-1">Overdue</div>
          <div className="text-sm mb-2">{overdue.length}</div>
          <div className="flex flex-col gap-2">
            {overdue.map((a) => (
              <AssignmentCard key={a.id} assignment={a as any} currentUserId={user.id} userStatus={a.myProgress as any} />
            ))}
          </div>
        </section>

        <section>
          <div className="text-base font-semibold mb-1">Upcoming</div>
          <div className="text-sm mb-2">{upcoming.length}</div>
          <div className="flex flex-col gap-2">
            {upcoming.map((a) => (
              <AssignmentCard key={a.id} assignment={a as any} currentUserId={user.id} userStatus={a.myProgress as any} />
            ))}
          </div>
        </section>

        <section>
          <div className="text-base font-semibold mb-1">Completed</div>
          <div className="text-sm mb-2">{done.length}</div>
          <div className="flex flex-col gap-2">
            {done.map((a) => (
              <AssignmentCard key={a.id} assignment={a as any} currentUserId={user.id} userStatus="finished" />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
