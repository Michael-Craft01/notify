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

      <main className="max-w-[1200px] mx-auto pt-12 px-6 pb-20">

        {/* ── HERO GREETING ───────────────────────────────────────────────── */}
        <div className="animate-fade-up mb-12">
          <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[var(--color-text-dim)] mb-2.5">
            {new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="font-[family-name:var(--font-outfit)] text-[clamp(32px,5vw,52px)] font-extrabold tracking-[-0.025em] leading-[1.1] text-[var(--color-text-main)]">
            {overdue.length > 0
              ? <><span className="text-[#F97316]">{overdue.length} task{overdue.length !== 1 ? 's' : ''}</span>{' '}<span className="text-[var(--color-text-muted)]">past due.</span></>
              : <>{greeting},<br /><span className="text-[var(--color-text-muted)]">{firstName}.</span></>
            }
          </h1>
        </div>

        {/* ── STATS ROW ───────────────────────────────────────────────────── */}
        <div className="animate-fade-up grid grid-cols-2 md:grid-cols-4 gap-3 mb-14">
          {stats.map((s, i) => (
            <div key={i} className="stat-card" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-[var(--color-text-dim)]">{s.label}</span>
                <div className={`h-[26px] w-[26px] rounded-md flex items-center justify-center border ${i === 0 ? 'bg-[#F97316]/10 border-[#F97316]/25' : 'bg-[var(--color-surface-2)] border-[var(--color-border)]'}`}>
                  <s.icon size={12} color={i === 0 ? '#F97316' : 'var(--color-text-dim)'} />
                </div>
              </div>
              <p className={`font-[family-name:var(--font-outfit)] text-[40px] font-black leading-none ${i === 0 ? 'text-[#F97316]' : 'text-[var(--color-text-main)]'}`}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── OVERDUE ─────────────────────────────────────────────────────── */}
        {overdue.length > 0 && (
          <section className="animate-fade-up mb-12">
            <SectionHeader label="Overdue" count={overdue.length} dim />
            <div className="flex flex-col gap-2.5">
              {overdue.map((a) => (
                <AssignmentCard key={a.id} assignment={a as any} currentUserId={user.id} pulse={a.pulse} userStatus={a.myProgress as any} />
              ))}
            </div>
          </section>
        )}

        {/* ── UPCOMING ────────────────────────────────────────────────────── */}
        <section className="animate-fade-up mb-12">
          <SectionHeader label="Upcoming" count={upcoming.length} />
          {upcoming.length === 0 ? (
            <EmptyState label="No upcoming tasks" sub="Add a task to get started." />
          ) : (
            <div className="flex flex-col gap-2.5">
              {upcoming.map((a) => (
                <AssignmentCard key={a.id} assignment={a as any} currentUserId={user.id} pulse={a.pulse} userStatus={a.myProgress as any} />
              ))}
            </div>
          )}
        </section>

        {/* ── COMPLETED ───────────────────────────────────────────────────── */}
        {done.length > 0 && (
          <section className="animate-fade-up opacity-50 hover:opacity-100 transition-opacity duration-300">
            <SectionHeader label="Completed" count={done.length} />
            <div className="flex flex-col gap-2.5">
              {done.map((a) => (
                <AssignmentCard key={a.id} assignment={a as any} currentUserId={user.id} pulse={a.pulse} userStatus="finished" />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--color-border)] px-6 py-6 flex justify-between items-center max-w-[1200px] mx-auto text-[10px] font-bold tracking-[0.14em] uppercase text-[var(--color-text-dim)]">
        <span>© {new Date().getFullYear()} Notify</span>
        {userProfile?.cohort_year && <span>Cohort {userProfile.cohort_year}</span>}
      </footer>
    </div>
  );
}

function SectionHeader({ label, count, dim }: { label: string; count: number; dim?: boolean }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className={`text-[10px] font-extrabold tracking-[0.18em] uppercase ${dim ? 'text-white/30' : 'text-white/50'}`}>
        {label}
      </span>
      <div className="flex-1 h-[1px] bg-[var(--color-border)]" />
      <span className="text-[10px] font-bold text-[var(--color-text-dim)] px-2 py-0.5 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)]">
        {count}
      </span>
    </div>
  );
}

function EmptyState({ label, sub }: { label: string; sub: string }) {
  return (
    <div className="border border-dashed border-[var(--color-border)] rounded-2xl py-14 px-6 flex flex-col items-center gap-2 text-center hover:border-[var(--color-border-hover)] transition-colors">
      <p className="text-xs font-bold tracking-[0.12em] uppercase text-[var(--color-text-dim)]">{label}</p>
      <p className="text-xs text-[var(--color-text-dim)] opacity-70">{sub}</p>
    </div>
  );
}
