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
    <div style={{ minHeight: "100vh", background: "var(--color-bg)", fontFamily: "var(--font-inter)" }}>

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(7,7,7,0.80)",
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid var(--color-border)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              height: 32, width: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, #F97316, #EA580C)',
              boxShadow: '0 0 16px rgba(249,115,22,0.40)',
            }}>
              <Terminal size={14} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontFamily: 'var(--font-outfit)', fontWeight: 800, fontSize: 15, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.95)' }}>
              Notify
            </span>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <NotificationToggle />
            <div style={{ width: 1, height: 20, background: "var(--color-border)" }} />
            <AddAssignmentModal userId={user.id} />
            <div style={{
              height: 34, width: 34, borderRadius: "50%", border: "1px solid var(--color-border-hover)",
              background: "var(--color-surface-2)", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 800, letterSpacing: "0.04em", color: "var(--color-text-muted)",
            }} title={displayName}>
              {initials}
            </div>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* ── HERO GREETING ───────────────────────────────────────────────── */}
        <div className="animate-fade-up" style={{ marginBottom: 48 }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--color-text-dim)", marginBottom: 10 }}>
            {new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 style={{ fontFamily: 'var(--font-outfit)', fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.1, color: 'var(--color-text-main)' }}>
            {overdue.length > 0
              ? <><span style={{ color: '#F97316' }}>{overdue.length} task{overdue.length !== 1 ? 's' : ''}</span>{' '}<span style={{ color: 'var(--color-text-muted)' }}>past due.</span></>
              : <>{greeting},<br /><span style={{ color: 'var(--color-text-muted)' }}>{firstName}.</span></>
            }
          </h1>
        </div>

        {/* ── STATS ROW ───────────────────────────────────────────────────── */}
        <div className="animate-fade-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 56 }}>
          {stats.map((s, i) => (
            <div key={i} className="stat-card" style={{ animationDelay: `${i * 50}ms` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--color-text-dim)' }}>{s.label}</span>
                <div style={{
                  height: 26, width: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: i === 0 ? 'rgba(249,115,22,0.12)' : 'var(--color-surface-2)',
                  border: `1px solid ${i === 0 ? 'rgba(249,115,22,0.25)' : 'var(--color-border)'}`,
                }}>
                  <s.icon size={12} color={i === 0 ? '#F97316' : 'var(--color-text-dim)'} />
                </div>
              </div>
              <p style={{
                fontFamily: 'var(--font-outfit)', fontSize: 40, fontWeight: 900, lineHeight: 1,
                color: i === 0 ? '#F97316' : 'var(--color-text-main)',
              }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── OVERDUE ─────────────────────────────────────────────────────── */}
        {overdue.length > 0 && (
          <section className="animate-fade-up" style={{ marginBottom: 48 }}>
            <SectionHeader label="Overdue" count={overdue.length} dim />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {overdue.map((a) => (
                <AssignmentCard key={a.id} assignment={a as any} currentUserId={user.id} pulse={a.pulse} userStatus={a.myProgress as any} />
              ))}
            </div>
          </section>
        )}

        {/* ── UPCOMING ────────────────────────────────────────────────────── */}
        <section className="animate-fade-up" style={{ marginBottom: 48 }}>
          <SectionHeader label="Upcoming" count={upcoming.length} />
          {upcoming.length === 0 ? (
            <EmptyState label="No upcoming tasks" sub="Add a task to get started." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {upcoming.map((a) => (
                <AssignmentCard key={a.id} assignment={a as any} currentUserId={user.id} pulse={a.pulse} userStatus={a.myProgress as any} />
              ))}
            </div>
          )}
        </section>

        {/* ── COMPLETED ───────────────────────────────────────────────────── */}
        {done.length > 0 && (
          <section className="animate-fade-up" style={{ opacity: 0.5 }}>
            <SectionHeader label="Completed" count={done.length} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {done.map((a) => (
                <AssignmentCard key={a.id} assignment={a as any} currentUserId={user.id} pulse={a.pulse} userStatus="finished" />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: "1px solid var(--color-border)", padding: "24px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        maxWidth: 1200, margin: "0 auto",
        fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase",
        color: "var(--color-text-dim)",
      }}>
        <span>© {new Date().getFullYear()} Notify</span>
        {userProfile?.cohort_year && <span>Cohort {userProfile.cohort_year}</span>}
      </footer>
    </div>
  );
}

function SectionHeader({ label, count, dim }: { label: string; count: number; dim?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
      <span style={{
        fontSize: 10, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase",
        color: dim ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.50)",
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
      <span style={{
        fontSize: 10, fontWeight: 700,
        color: "var(--color-text-dim)",
        padding: "2px 8px", borderRadius: 99,
        background: "var(--color-surface-2)",
        border: "1px solid var(--color-border)",
      }}>
        {count}
      </span>
    </div>
  );
}

function EmptyState({ label, sub }: { label: string; sub: string }) {
  return (
    <div style={{
      border: "1px dashed var(--color-border)", borderRadius: 16,
      padding: "56px 24px", display: "flex", flexDirection: "column",
      alignItems: "center", gap: 8, textAlign: "center",
    }}>
      <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-dim)" }}>{label}</p>
      <p style={{ fontSize: 12, color: "var(--color-text-dim)", opacity: 0.7 }}>{sub}</p>
    </div>
  );
}
