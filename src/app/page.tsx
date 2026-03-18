import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import AddAssignmentModal from "@/components/AddAssignmentModal";
import AssignmentContainer from "@/components/AssignmentContainer";
import NotificationToggle from "@/components/NotificationToggle";
import SettingsModal from "@/components/SettingsModal";
import NotifyAIChat from "@/components/NotifyAIChat";
import { Clock, CheckCircle2, AlertTriangle, TrendingUp, Users } from "lucide-react";
import Image from "next/image";
import JoinClassOverlay from "@/components/JoinClassOverlay";
import NextUpWidget from "@/components/NextUpWidget";

export const dynamic = "force-dynamic";

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

  const { data: userProfile } = await supabase
    .from("users")
    .select("full_name, program_id, role, programs(name)")
    .eq("id", user.id)
    .single();

  const programName = (userProfile as any)?.programs?.name || "your class";

  const { data: assignments } = await supabase
    .from("assignments")
    .select(`*, users!created_by (full_name), user_progress (status, user_id)`)
    .eq("program_id", userProfile?.program_id) // SCOPED FETCHING
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

  const displayName = userProfile?.full_name || user.email?.split("@")[0] || "User";
  const firstName   = displayName.split(" ")[0];
  const initials    = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const productivity = allTasks.length > 0 ? Math.round((done.length / allTasks.length) * 100) : 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const stats = [
    { label: "Upcoming",  value: upcoming.length, icon: Clock },
    { label: "Overdue",   value: overdue.length,  icon: AlertTriangle },
    { label: "Completed", value: done.length,      icon: CheckCircle2 },
    { label: "Efficiency", value: `${productivity}%`, icon: TrendingUp },
  ];

  const { data: schedules } = await supabase
    .from("schedules")
    .select("*")
    .eq("program_id", userProfile?.program_id);

  const { data: overrides } = await supabase
    .from("schedule_overrides")
    .select("*")
    .gte("override_date", new Date().toISOString().split('T')[0]);

  const isRep = userProfile?.role === 'rep' || userProfile?.role === 'admin';

  return (
    <div className="min-h-screen bg-[var(--color-bg)] font-[family-name:var(--font-inter)]">
      {/* ── SAFETY NET OVERLAY ────────────────────────────────────────────── */}
      {!userProfile?.program_id && (
        <JoinClassOverlay userId={user.id} />
      )}

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-[#070707]/80 backdrop-blur-xl border-b border-[var(--color-border)] transition-all">
        <div className="max-w-[1200px] mx-auto px-6 h-[60px] flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2.5 group cursor-pointer">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center overflow-hidden shadow-[0_0_16px_rgba(249,115,22,0.40)] group-hover:shadow-[0_0_24px_rgba(249,115,22,0.60)] transition-shadow">
              <Image src="/favicon.png" alt="Notify Logo" width={32} height={32} className="w-full h-full object-cover" />
            </div>
            <span className="font-[family-name:var(--font-outfit)] font-extrabold text-[15px] tracking-[0.05em] uppercase text-white/95 group-hover:text-white transition-colors">
              Notify
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <NotificationToggle />
            <NotifyAIChat />
            <div className="w-[1px] h-5 bg-[var(--color-border)]" />
            <AddAssignmentModal userId={user.id} />
            <SettingsModal user={{
              id: user.id,
              email: user.email!,
              full_name: userProfile?.full_name || null,
              program_id: userProfile?.program_id || null
            }} />
          </div>
        </div>
      </nav>

      <main className="max-w-[1200px] mx-auto pt-12 px-6 pb-20 flex flex-col gap-12 text-[var(--color-text-main)]">

        {/* ── HERO ──────────────────────────────────────────────────────────── */}
        <section className="animate-fade-up relative px-1 sm:px-0">
          {/* Ambient Background Texture */}
          <div className="absolute -top-32 -left-20 w-72 h-72 bg-orange/20 rounded-full blur-[120px] pointer-events-none opacity-60 sm:opacity-100" />
          <div 
            className="absolute inset-x-0 -top-10 h-40 opacity-[0.03] pointer-events-none overflow-hidden"
            style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
          />
          
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-orange animate-pulse shadow-[0_0_8px_var(--orange)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange/80">Active Pulse</span>
            </div>

            <h1 className="text-4xl sm:text-7xl font-[family-name:var(--font-outfit)] font-black tracking-tighter leading-[0.9] text-white">
              {greeting},<br />
              <span className="bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">
                {firstName}
              </span>
              <span className="text-orange">.</span>
            </h1>

            <p className="text-[15px] sm:text-[18px] text-white/40 max-w-[550px] leading-relaxed font-medium">
              {overdue.length > 0 ? (
                <>
                  Crucial day ahead. You have <span className="text-white font-bold">{overdue.length} overdue</span> tasks demanding focus.
                </>
              ) : (
                <>Your workflow is clean. All tasks are currently on track for your cohort.</>
              )}
            </p>
          </div>
        </section>

        {/* ── NEXT UP (THE WARDEN) ─────────────────────────────────────────── */}
        <NextUpWidget 
          schedules={schedules || []} 
          overrides={overrides || []} 
          isRep={isRep} 
        />

        {/* ── STATS ROW (2x2 Mobile First) ─────────────────────────────────── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-fade-up stagger relative">
          {stats.map((s, i) => (
            <div 
              key={i} 
              className="stat-card group relative p-5 sm:p-6 flex flex-col justify-between overflow-hidden cursor-pointer transition-all active:scale-[0.96] sm:active:scale-100"
            >
              {/* Background Index Texture */}
              <div className="absolute -bottom-2 -right-2 text-7xl font-[family-name:var(--font-outfit)] font-black text-white/[0.02] select-none italic">
                0{i + 1}
              </div>

              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className={`p-2 rounded-xl border border-white/5 transition-colors group-hover:bg-white/5 ${
                  s.label === 'Overdue' && overdue.length > 0 
                  ? 'bg-red-500/10 text-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.1)]' 
                  : s.label === 'Upcoming' && upcoming.length > 0
                  ? 'bg-orange/10 text-orange shadow-[0_0_15px_rgba(249,115,22,0.1)]'
                  : 'bg-white/5 text-white/30'
                }`}>
                  <s.icon size={16} />
                </div>
                <div className="h-1 w-1 rounded-full bg-white/20" />
              </div>

              <div className="relative z-10">
                <div className="text-3xl sm:text-4xl font-[family-name:var(--font-outfit)] font-black tracking-tight text-white leading-none mb-1.5">
                  {s.value}
                </div>
                <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.15em]">
                  {s.label}
                </div>
              </div>

              {/* Enhanced Corner Glow */}
              <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                 <div className="w-1 h-1 rounded-full bg-white/40 shadow-[0_0_10px_#fff]" />
              </div>
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
          <AssignmentContainer 
            title="Overdue" 
            count={overdue.length} 
            assignments={overdue} 
            currentUserId={user.id} 
          />
        )}

        {upcoming.length > 0 && (
          <AssignmentContainer 
            title="Upcoming" 
            count={upcoming.length} 
            assignments={upcoming} 
            currentUserId={user.id} 
          />
        )}

        {done.length > 0 && (
          <AssignmentContainer 
            title="Completed" 
            count={done.length} 
            assignments={done} 
            currentUserId={user.id} 
          />
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
