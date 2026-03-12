import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import AddAssignmentModal from "@/components/AddAssignmentModal";
import AssignmentCard from "@/components/AssignmentCard";
import NotificationToggle from "@/components/NotificationToggle";
import {
  Terminal,
  LayoutDashboard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

export default async function Home() {
  const supabase = await createClient();

  let {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const cookieStore = await cookies();
    const mockUserEmail = cookieStore.get("notify-mock-user")?.value;
    if (mockUserEmail) {
      user = {
        id: "00000000-0000-0000-0000-000000000000",
        email: mockUserEmail,
      } as any;
    }
  }

  if (!user) {
    redirect("/login");
  }

  // Fetch assignments and user progress
  const { data: assignments, error } = await supabase
    .from("assignments")
    .select(
      `
      *,
      users!created_by (full_name),
      user_progress (status, user_id)
    `
    )
    .gte(
      "due_date",
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    )
    .order("due_date", { ascending: true });

  if (error) {
    console.error("Dashboard fetch error:", JSON.stringify(error));
  }

  // Fetch pulse stats separately to avoid PostgREST view join issue
  const { data: pulseStats } = await supabase
    .from("assignment_pulse_stats")
    .select("*");

  const pulseMap = new Map(
    (pulseStats || []).map((p: any) => [p.assignment_id, p])
  );

  // Merge pulse stats into assignments
  const allTasks = (assignments || []).map((a) => ({
    ...a,
    pulse: pulseMap.get(a.id) || {
      finished_percentage: 0,
      involvement_percentage: 0,
    },
    myProgress:
      a.user_progress?.find((p: any) => p.user_id === user!.id)?.status ||
      "not_started",
  }));

  const activeTasks = allTasks.filter((a) => a.myProgress !== "finished");
  const completedTasks = allTasks.filter((a) => a.myProgress === "finished");
  const overdueTasks = activeTasks.filter(
    (a) => new Date(a.due_date).getTime() < Date.now()
  );
  const urgentTasks = activeTasks.filter((a) => {
    const h = (new Date(a.due_date).getTime() - Date.now()) / 3600000;
    return h > 0 && h < 48;
  });

  // Get user profile
  const { data: userProfile } = await supabase
    .from("users")
    .select("full_name, cohort_year")
    .eq("id", user.id)
    .single();

  const displayName =
    userProfile?.full_name || user.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const stats = [
    {
      label: "Active",
      value: activeTasks.length - overdueTasks.length,
      icon: TrendingUp,
      color: "var(--color-primary)",
      bg: "var(--color-primary-soft)",
      border: "var(--color-primary-border)",
    },
    {
      label: "Overdue",
      value: overdueTasks.length,
      icon: AlertTriangle,
      color: "var(--color-danger)",
      bg: "var(--color-danger-soft)",
      border: "hsla(4, 86%, 58%, 0.2)",
    },
    {
      label: "Completed",
      value: completedTasks.length,
      icon: CheckCircle2,
      color: "var(--color-success)",
      bg: "var(--color-success-soft)",
      border: "hsla(142, 70%, 45%, 0.2)",
    },
    {
      label: "Cohort Size",
      value: pulseStats?.[0]?.total_cohort ?? "—",
      icon: Users,
      color: "var(--color-info)",
      bg: "var(--color-info-soft)",
      border: "hsla(220, 90%, 65%, 0.2)",
    },
  ];

  return (
    <div
      className="min-h-screen font-sans"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* ── Top Navigation ─────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 border-b"
        style={{
          background: 'rgba(7,7,7,0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="max-w-[1300px] mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-3">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{
                  background: 'var(--color-surface-3)',
                  border: '1px solid var(--color-border-hover)',
                }}
              >
                <Terminal size={15} strokeWidth={2.5} style={{ color: 'var(--color-text-main)' }} />
              </div>
              <span
                className="text-base font-extrabold tracking-tight uppercase"
                style={{ fontFamily: 'var(--font-outfit), sans-serif', color: 'var(--color-text-main)' }}
              >
                Notify
              </span>
            </div>

            <div className="hidden md:flex items-center gap-6 text-[13px] font-semibold">
              <div
                className="flex items-center gap-2"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <LayoutDashboard size={14} />
                Dashboard
              </div>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-3">
            <NotificationToggle />
            <div
              className="h-6 w-px mx-1"
              style={{ background: "var(--color-border)" }}
            />
            <AddAssignmentModal userId={user.id} />
            {/* Avatar */}
            <div
              className="h-9 w-9 rounded-full flex items-center justify-center text-[12px] font-black ml-1 border"
              style={{
                background: "var(--color-surface-2)",
                borderColor: "var(--color-border-hover)",
                color: "var(--color-text-muted)",
              }}
              title={displayName}
            >
              {initials}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1300px] mx-auto px-6 py-10 space-y-10">
        {/* ── Greeting ─────────────────────────────────── */}
        <div className="animate-fade-up">
          <p
            className="text-[13px] font-semibold mb-1"
            style={{ color: "var(--color-text-dim)" }}
          >
            {new Date().toLocaleDateString([], {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1
            className="text-3xl font-extrabold tracking-tight"
            style={{ fontFamily: "var(--font-outfit), sans-serif" }}
          >
            {overdueTasks.length > 0 ? (
              <>
                <span style={{ color: "var(--color-danger)" }}>
                  {overdueTasks.length} overdue
                </span>{" "}
                task
                {overdueTasks.length !== 1 ? "s" : ""} need
                {overdueTasks.length === 1 ? "s" : ""} attention
              </>
            ) : urgentTasks.length > 0 ? (
              <>
                <span style={{ color: "var(--color-warning)" }}>
                  {urgentTasks.length} task
                  {urgentTasks.length !== 1 ? "s" : ""}
                </span>{" "}
                due within 48 hours
              </>
            ) : (
              <>
                Good{" "}
                {new Date().getHours() < 12
                  ? "morning"
                  : new Date().getHours() < 18
                  ? "afternoon"
                  : "evening"}
                , {displayName.split(" ")[0]}
              </>
            )}
          </h1>
        </div>

        {/* ── Stats Grid ───────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="stat-card animate-fade-up"
              style={{ animationDelay: `${i * 0.06}s`, opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-4">
                <span
                  className="text-[11px] font-bold uppercase tracking-[0.15em]"
                  style={{ color: 'var(--color-text-dim)' }}
                >
                  {stat.label}
                </span>
                <div
                  className="h-7 w-7 rounded-lg flex items-center justify-center"
                  style={{ background: stat.bg }}
                >
                  <stat.icon size={13} style={{ color: stat.color }} />
                </div>
              </div>
              <p
                className="text-4xl font-black"
                style={{
                  color: stat.color,
                  fontFamily: 'var(--font-outfit), sans-serif',
                }}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Overdue Section ──────────────────────────── */}
        {overdueTasks.length > 0 && (
          <section className="space-y-4 animate-fade-up">
            <div className="flex items-center gap-3">
              <div
                className="status-dot animate-pulse"
                style={{ background: "var(--color-danger)" }}
              />
              <h2
                className="text-[13px] font-black uppercase tracking-[0.15em]"
                style={{ color: "var(--color-danger)" }}
              >
                Overdue
              </h2>
              <div
                className="flex-1 h-px"
                style={{ background: "var(--color-danger-soft)" }}
              />
              <span
                className="badge"
                style={{
                  background: "var(--color-danger-soft)",
                  color: "var(--color-danger)",
                  border: "1px solid hsla(4, 86%, 58%, 0.2)",
                }}
              >
                {overdueTasks.length} tasks
              </span>
            </div>
            <div className="space-y-3">
              {overdueTasks.map((assignment, i) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment as any}
                  currentUserId={user.id}
                  pulse={assignment.pulse}
                  userStatus={assignment.myProgress as any}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Active Tasks ─────────────────────────────── */}
        <section className="space-y-4 animate-fade-up">
          <div className="flex items-center gap-3">
            <div
              className="status-dot"
              style={{ background: "var(--color-primary)" }}
            />
            <h2
              className="text-[13px] font-black uppercase tracking-[0.15em]"
              style={{ color: "var(--color-text-muted)" }}
            >
              Upcoming Schedule
            </h2>
            <div
              className="flex-1 h-px"
              style={{ background: "var(--color-border)" }}
            />
            <span
              className="badge"
              style={{
                background: "var(--color-primary-soft)",
                color: "var(--color-primary)",
                border: "1px solid var(--color-primary-border)",
              }}
            >
              {activeTasks.filter(a => new Date(a.due_date).getTime() >= Date.now()).length} tasks
            </span>
          </div>

          {activeTasks.filter(a => new Date(a.due_date).getTime() >= Date.now()).length === 0 ? (
            <div
              className="rounded-2xl border border-dashed py-20 flex flex-col items-center gap-4"
              style={{ borderColor: "var(--color-border)" }}
            >
              <div
                className="h-14 w-14 rounded-2xl flex items-center justify-center"
                style={{ background: "var(--color-surface-2)" }}
              >
                <Zap
                  size={26}
                  style={{ color: "var(--color-text-dim)" }}
                />
              </div>
              <div className="text-center">
                <p
                  className="text-sm font-bold uppercase tracking-[0.15em] mb-1"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  All clear
                </p>
                <p
                  className="text-[13px]"
                  style={{ color: "var(--color-text-dim)" }}
                >
                  No upcoming tasks. Add one to get started.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 stagger">
              {activeTasks
                .filter(a => new Date(a.due_date).getTime() >= Date.now())
                .map((assignment, i) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment as any}
                  currentUserId={user.id}
                  pulse={assignment.pulse}
                  userStatus={assignment.myProgress as any}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Completed Tasks ──────────────────────────── */}
        {completedTasks.length > 0 && (
          <section className="space-y-4 animate-fade-up" style={{ opacity: 0.6 }}>
            <div className="flex items-center gap-3">
              <CheckCircle2 size={14} style={{ color: "var(--color-success)" }} />
              <h2
                className="text-[13px] font-black uppercase tracking-[0.15em]"
                style={{ color: "var(--color-text-dim)" }}
              >
                Recently Completed
              </h2>
              <div
                className="flex-1 h-px"
                style={{ background: "var(--color-border)" }}
              />
            </div>
            <div className="space-y-3">
              {completedTasks.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment as any}
                  currentUserId={user.id}
                  pulse={assignment.pulse}
                  userStatus="finished"
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* ── Footer ───────────────────────────────────── */}
      <footer
        className="max-w-[1300px] mx-auto px-6 py-8 mt-8 border-t flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.15em]"
        style={{
          borderColor: "var(--color-border)",
          color: "var(--color-text-dim)",
        }}
      >
        <span>© {new Date().getFullYear()} Notify Intelligent Systems</span>
        {userProfile?.cohort_year && (
          <span>Cohort {userProfile.cohort_year}</span>
        )}
      </footer>
    </div>
  );
}
