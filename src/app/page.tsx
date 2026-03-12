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
      user_progress (status, user_id)
    `)
    .gte("due_date", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()) // Extra 48h buffer
    .order("due_date", { ascending: true });

  if (error) {
    console.error("Error fetching assignments details:", JSON.stringify(error));
  }

  const verifiedThreats = assignments?.filter((a) => a.status === "verified") || [];
  const pendingIntelligence = assignments?.filter((a) => a.status === "pending") || [];

  return (
    <div className="bg-[var(--color-background)] min-h-screen font-sans selection:bg-[var(--color-primary)]/30">
      {/* Premium Elite Navigation */}
      <nav className="glass sticky top-0 z-[100] border-b border-white/5 h-14">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5">
              <div className="h-6 w-6 rounded-md bg-[var(--color-primary)] flex items-center justify-center text-black shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                <Terminal size={14} strokeWidth={3} />
              </div>
              <h1 className="text-base font-bold tracking-tight text-white flex items-center">
                Warden
              </h1>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <div className="flex items-center gap-2 h-8 px-3 rounded-md bg-white/5 text-[12px] font-semibold text-white/90">
                <LayoutDashboard size={14} className="text-[var(--color-primary)]" />
                Overview
              </div>
              <div className="text-[12px] font-semibold text-neutral-500 hover:text-neutral-300 transition-colors cursor-not-allowed flex items-center gap-2">
                <MessageSquare size={14} />
                Archive
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationToggle />
            <div className="h-4 w-px bg-white/10 mx-1 hidden sm:block" />
            <AddAssignmentModal userId={user.id} />
            <div className="hidden sm:flex items-center gap-2 ml-2 pl-4 border-l border-white/5">
              <div className="h-8 w-8 rounded-full bg-neutral-800 border border-white/5 flex items-center justify-center text-[11px] font-bold text-neutral-400">
                {user.email?.[0].toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 py-10">
        <div className="space-y-12">

          {/* Section: Active Directives */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-[13px] font-bold text-neutral-400 uppercase tracking-widest">Active Directives</h2>
                <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] animate-pulse" />
              </div>
              <div className="flex items-center gap-2 text-[12px] font-semibold text-neutral-500">
                <span className="text-neutral-200">{verifiedThreats.length}</span>
                Task{verifiedThreats.length !== 1 ? 's' : ''} Identified
              </div>
            </div>

            <div className="grid grid-cols-1 gap-1">
              {verifiedThreats.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/5 py-16 flex flex-col items-center justify-center gap-3 text-center">
                  <div className="h-10 w-10 rounded-full bg-neutral-900 flex items-center justify-center text-neutral-700">
                    <ShieldCheck size={20} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[13px] font-bold text-neutral-500 uppercase tracking-wider">Scanners Clear</p>
                    <p className="text-[12px] text-neutral-600 font-medium">All mission objectives have been resolved.</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {verifiedThreats.map((assignment) => (
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

          {/* Section: Unconfirmed Intelligence */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-[13px] font-bold text-neutral-400 uppercase tracking-widest">Unconfirmed Data</h2>
                <div className="h-4 px-2 rounded bg-neutral-800 text-[10px] font-black text-neutral-500 flex items-center">BETA</div>
              </div>
              <span className="text-[12px] font-semibold text-neutral-500">
                <span className="text-neutral-300">{pendingIntelligence.length}</span> Awaiting Scan
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {pendingIntelligence.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/5 py-12 flex flex-col items-center justify-center gap-2">
                  <p className="text-[12px] font-bold text-neutral-700 uppercase tracking-widest italic">Zero Pending Objectives</p>
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
            </div>
          </section>

        </div>
      </main>

      {/* Elite SaaS Footer */}
      <footer className="max-w-[1100px] mx-auto px-6 py-20 border-t border-white/5 flex items-center justify-between text-neutral-600 text-[11px] font-bold uppercase tracking-widest">
        <div>Warden Unified Access</div>
        <div className="flex items-center gap-6">
          <span className="hover:text-white transition-colors cursor-pointer">Security Protocol</span>
          <span className="hover:text-white transition-colors cursor-pointer">Operative Network</span>
        </div>
      </footer>
    </div>
  );
}
