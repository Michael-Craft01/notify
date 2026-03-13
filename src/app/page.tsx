import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import AddAssignmentModal from "@/components/AddAssignmentModal";
import AssignmentCard from "@/components/AssignmentCard";
import NotificationToggle from "@/components/NotificationToggle";
import { Clock, CheckCircle2, AlertTriangle, TrendingUp, Users } from "lucide-react";
import Image from "next/image";

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
            <div className="h-8 w-8 rounded-lg flex items-center justify-center overflow-hidden shadow-[0_0_16px_rgba(249,115,22,0.40)] group-hover:shadow-[0_0_24px_rgba(249,115,22,0.60)] transition-shadow">
              {/* Using the uploaded logo for better branding instead of the Terminal icon */}
              <Image src="/favicon.png" alt="Notify Logo" width={32} height={32} className="w-full h-full object-cover" />
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

      <main className="max-w-[1200px] mx-auto pt-12 px-6 pb-20 flex flex-col gap-12 text-[var(--color-text-main)]">

        {/* ── HERO ──────────────────────────────────────────────────────────── */}
        <section className="animate-fade-up">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2 text-white">
            {greeting}, {firstName}
          </h1>
          <p className="text-[15px] text-[var(--color-text-muted)] max-w-[600px] leading-relaxed">
            Here&apos;s what&apos;s happening with your coursework.
            {overdue.length > 0 ? ` You have ${overdue.length} overdue tasks to catch up on.` : " You're all caught up on overdue tasks!"}
          </p>
        </section>

        {/* ── STATS ROW ─────────────────────────────────────────────────────── */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 animate-fade-up stagger">
          {stats.map((s, i) => (
            <div key={i} className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all hover:border-[var(--color-border-hover)]">
              <div className="flex items-center gap-2 mb-3">
                <s.icon size={15} className="text-[var(--color-text-muted)]" />
                <span className="text-[12px] font-bold uppercase tracking-wider text-[var(--color-text-dim)]">{s.label}</span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{s.value}</div>
            </div>
          ))}
        </section>

        {/* ── TASKS ─────────────────────────────────────────────────────────── */}
        {allTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 mb-6 rounded-2xl flex items-center justify-center bg-[var(--color-surface-2)] border border-[var(--color-border)]">
              <CheckCircle2 size={24} className="text-[var(--color-text-muted)]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">You&apos;re all caught up!</h2>
            <p className="text-[14px] text-[var(--color-text-dim)] max-w-[280px]">
              There are no tasks pending or completed right now. Add a new task to get started.
            </p>
          </div>
        )}

        {overdue.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-white leading-tight">Overdue</h2>
            <p className="text-sm font-medium text-white mb-6 leading-tight">{overdue.length}</p>
            <div className="flex flex-col gap-4">
              {overdue.map((a) => (
                <AssignmentCard key={a.id} assignment={a as any} pulse={a.pulse} currentUserId={user.id} userStatus={a.myProgress as any} />
              ))}
            </div>
          </section>
        )}

        {upcoming.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-white leading-tight">Upcoming</h2>
            <p className="text-sm font-medium text-white mb-6 leading-tight">{upcoming.length}</p>
            <div className="flex flex-col gap-4">
              {upcoming.map((a) => (
                <AssignmentCard key={a.id} assignment={a as any} pulse={a.pulse} currentUserId={user.id} userStatus={a.myProgress as any} />
              ))}
            </div>
          </section>
        )}

        {done.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-white leading-tight">Completed</h2>
            <p className="text-sm font-medium text-white mb-6 leading-tight">{done.length}</p>
            <div className="flex flex-col gap-4">
              {done.map((a) => (
                <AssignmentCard key={a.id} assignment={a as any} pulse={a.pulse} currentUserId={user.id} userStatus="finished" />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--color-border)] py-8 mt-auto">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/favicon.png" alt="Notify Logo" width={16} height={16} className="w-4 h-4 object-cover rounded-sm" />
            <span className="font-[family-name:var(--font-outfit)] font-bold text-[13px] tracking-wider uppercase text-white/80">Notify</span>
          </div>
          <p className="text-[12px] text-[var(--color-text-dim)]">
            &copy; {new Date().getFullYear()} Notify Dashboard. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
