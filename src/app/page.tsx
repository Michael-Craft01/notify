import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import AddAssignmentModal from "@/components/AddAssignmentModal";
import AssignmentCard from "@/components/AssignmentCard";
import NotificationToggle from "@/components/NotificationToggle";
import { ShieldCheck, MessageSquare, Terminal, LayoutDashboard } from "lucide-react";

export default async function Home() {
  const supabase = await createClient();

  let { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const cookieStore = await cookies();
    const mockUserEmail = cookieStore.get('warden-mock-user')?.value;
    if (mockUserEmail) {
      user = { id: '00000000-0000-0000-0000-000000000000', email: mockUserEmail } as any;
    }
  }

  if (!user) {
    redirect("/login");
  }

  const { data: assignments, error } = await supabase
    .from("assignments")
    .select(`
      *,
      users!created_by (full_name),
      user_progress (status, user_id),
      assignment_pulse_stats (finished_percentage, involvement_percentage)
    `)
    .gte("due_date", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()) // Extra 48h buffer
    .order("due_date", { ascending: true });

  if (error) {
    console.error("Error fetching assignments details:", JSON.stringify(error));
  }

  const allTasks = assignments || [];
  const activeTasks = allTasks.filter((a) => {
    const myProgress = a.user_progress?.find((p: any) => p.user_id === user.id);
    const userStatus = myProgress?.status || 'not_started';
    return userStatus !== 'finished';
  });
  const completedTasks = allTasks.filter((a) => {
    const myProgress = a.user_progress?.find((p: any) => p.user_id === user.id);
    return myProgress?.status === 'finished';
  });
  const overdueCount = activeTasks.filter(a => new Date(a.due_date).getTime() < Date.now()).length;

  return (
    <div className="bg-[var(--color-background)] min-h-screen font-sans selection:bg-[var(--color-primary)]/30">
      {/* Premium Elite Navigation */}
      <nav className="glass sticky top-0 z-[100] border-b border-white/5 h-16">
        <div className="max-w-[1400px] mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-black shadow-glow">
                <Terminal size={18} strokeWidth={2.5} />
              </div>
              <h1 className="text-lg font-extrabold tracking-tight text-white font-outfit uppercase">
                Notify
              </h1>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <div className="flex items-center gap-2 text-[13px] font-bold text-white uppercase tracking-wider">
                <LayoutDashboard size={14} className="text-[var(--color-primary)]" />
                Dashboard
              </div>
              <div className="text-[13px] font-bold text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer flex items-center gap-2 uppercase tracking-wider">
                <MessageSquare size={14} />
                Schedules
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NotificationToggle />
            <div className="h-6 w-px bg-white/10 mx-2 hidden sm:block" />
            <AddAssignmentModal userId={user.id} />
            <div className="hidden sm:flex items-center gap-3 ml-2 pl-4 border-l border-white/5">
              <div className="h-9 w-9 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center text-[12px] font-bold text-neutral-300 shadow-sm">
                {user.email?.[0].toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1100px] mx-auto px-6 py-12">
        <div className="space-y-16">
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: "Active Tasks", value: activeTasks.length, color: "var(--color-primary)" },
              { label: "Completed", value: completedTasks.length, color: "var(--color-text-muted)" },
              { label: "Overdue", value: overdueCount, color: "#ef4444" },
            ].map((stat, i) => (
              <div key={i} className="premium-card rounded-2xl p-6 border border-white/5 bg-white/[0.02]">
                <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                <p className="text-4xl font-black font-outfit" style={{ color: stat.color }}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Section: Active Tasks */}
          <section className="space-y-8">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] font-outfit">Upcoming Schedule</h2>
                <div className="h-2 w-2 rounded-full bg-[var(--color-primary)] shadow-glow animate-pulse" />
              </div>
              <div className="text-[12px] font-bold text-neutral-500 uppercase tracking-widest">
                <span className="text-white">{activeTasks.length}</span> Pending Tasks
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {activeTasks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 py-24 flex flex-col items-center justify-center gap-5 bg-white/[0.01]">
                  <div className="h-14 w-14 rounded-2xl bg-neutral-900 flex items-center justify-center text-neutral-600 border border-white/5 shadow-inner">
                    <ShieldCheck size={28} />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-bold text-neutral-400 uppercase tracking-[0.2em]">Clear Schedule</p>
                    <p className="text-[13px] text-neutral-600 font-medium tracking-wide">All your current tasks have been resolved.</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {activeTasks.map((assignment) => (
                    <AssignmentCard
                      key={assignment.id}
                      assignment={assignment as any}
                      currentUserId={user.id}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Section: Recently Completed */}
          {completedTasks.length > 0 && (
            <section className="space-y-8 opacity-60">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-sm font-black text-neutral-400 uppercase tracking-[0.2em] font-outfit">Recently Completed</h2>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {completedTasks.map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment as any}
                    currentUserId={user.id}
                  />
                ))}
              </div>
            </section>
          )}

        </div>
      </main>


      {/* Elite SaaS Footer */}
      <footer className="max-w-[1100px] mx-auto px-6 py-20 border-t border-white/5 flex items-center justify-between text-neutral-600 text-[11px] font-bold uppercase tracking-[0.2em]">
        <div>© 2024 Notify Intelligent Systems</div>
        <div className="flex items-center gap-8">
          <span className="hover:text-white transition-colors cursor-pointer">Security Center</span>
          <span className="hover:text-white transition-colors cursor-pointer">Network Status</span>
        </div>
      </footer>
    </div>
  );
}
