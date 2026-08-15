import { createFileRoute, Link, ClientOnly, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Shell, Card, Stat } from "@/components/Layout";
import { RequireAuth } from "@/components/RequireAuth";
import { useAppState, totalEarned } from "@/lib/store";
import { useDisplayUser } from "@/lib/useDisplayUser";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { Brain, Star, Sparkles } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — EARNGEN-AI" },
      { name: "description", content: "Your earnings, active gigs, streak, and proof-of-work in one ERP-style command center." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { state } = useAppState();
  const me = useDisplayUser();
  const navigate = useNavigate();
  const [upskillSkill, setUpskillSkill] = useState("");
  const [customSkill, setCustomSkill] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const displayName = me.name;
  const total = totalEarned(state.income);
  const streak = state.sprint?.completedDays.length ?? 0;
  const sprint = state.sprint;

  // Build daily earning series for last 30 days
  const days: { d: string; v: number }[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const v = state.income.filter((e) => e.date.slice(0, 10) === key).reduce((s, e) => s + e.amount, 0);
    days.push({ d: d.toLocaleDateString("en-IN", { month: "short", day: "numeric" }), v });
  }

  const bySkill: Record<string, number> = {};
  state.income.forEach((e) => { bySkill[e.skill] = (bySkill[e.skill] ?? 0) + e.amount; });
  const skillData = Object.entries(bySkill).map(([name, value]) => ({ name, value }));

  const COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)"];

  return (
    <Shell>
      <RequireAuth>
      <header className="mb-8 fade-up">
        <p className="text-sm text-muted-foreground">Welcome back,</p>
        <h1 className="text-3xl font-semibold tracking-tight">{displayName} 👋</h1>
        <p className="text-muted-foreground mt-1.5 flex items-center gap-2 text-sm">
          <Sparkles className="size-4 text-brand animate-pulse shrink-0" />
          <span>Turn your skills into daily income and build a certified portfolio that top recruiters trust!</span>
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <Stat label="Total Earned" value={`₹${total.toLocaleString("en-IN")}`} sub="+12.4% vs last month" />
        <Stat label="Active Sprint" value={sprint ? `Day ${Math.max(...(sprint.completedDays.length ? sprint.completedDays : [0])) + 1}/7` : "—"} sub={sprint?.gigTitle.slice(0, 28) ?? "Start a sprint"} />
        <Stat label="Verified Proofs" value={String(state.income.length)} sub="Recruiter-ready" />
        <Stat label="Streak" value={`🔥 ${streak} days`} accent sub="Keep going" />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold">Earnings — last 30 days</h2>
              <p className="text-xs text-muted-foreground">Daily INR inflow</p>
            </div>
          </div>
          <div className="h-64">
            <ClientOnly fallback={<div className="h-full w-full animate-pulse bg-muted/40 rounded" />}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={days} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
                  <XAxis dataKey="d" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false} interval={4} />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} formatter={((v: any) => [`₹${Number(v).toLocaleString("en-IN")}`, "Earned"]) as any} />
                  <Line type="monotone" dataKey="v" stroke="var(--color-brand)" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ClientOnly>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold mb-4">By skill</h2>
          <div className="h-48">
            <ClientOnly fallback={<div className="h-full w-full animate-pulse bg-muted/40 rounded" />}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={skillData} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={2}>
                    {skillData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} formatter={((v: any) => `₹${Number(v).toLocaleString("en-IN")}`) as any} />
                </PieChart>
              </ResponsiveContainer>
            </ClientOnly>
          </div>
          <div className="mt-2 space-y-1">
            {skillData.map((s, i) => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span>{s.name}</span>
                </div>
                <span className="font-medium">₹{s.value.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {sprint && (
        <Card className="p-6 mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-brand uppercase tracking-wider">Today's task</p>
              <h2 className="font-semibold mt-1">{sprint.gigTitle}</h2>
            </div>
            <Link to="/sprint" className="text-sm font-semibold text-brand">Open sprint →</Link>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => {
              const done = sprint.completedDays.includes(d);
              return (
                <div key={d} className={"flex-1 h-2 rounded-full " + (done ? "bg-brand" : "bg-muted")} />
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {sprint.completedDays.length}/7 days complete · {Math.round((sprint.completedDays.length / 7) * 100)}% to your ₹1,000 goal 🔥
          </p>
        </Card>
      )}

      {/* ── Upskilling Assessment Card ── */}
      <Card className="p-6 mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="size-10 rounded-xl bg-brand/10 flex items-center justify-center">
            <Brain className="size-5 text-brand" />
          </div>
          <div>
            <p className="text-xs font-semibold text-brand uppercase tracking-wider">Upskilling & Level Up</p>
            <h2 className="font-semibold mt-0.5">Take Assessment for Upskilling</h2>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-6 max-w-2xl text-pretty">
          Choose a specific skill to test your knowledge with a moderate-level AI assessment. Upon successful completion, your verified skill level will be highlighted to potential recruiters on your profile.
        </p>

        <div className="flex flex-col sm:flex-row items-end gap-4 max-w-xl">
          <div className="flex-1 w-full space-y-2">
            <label className="text-xs font-medium text-muted-foreground block">Select Skill</label>
            {isCustom ? (
              <input
                type="text"
                placeholder="Type custom skill..."
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                className="w-full bg-muted/50 ring-1 ring-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
              />
            ) : (
              <select
                value={upskillSkill}
                onChange={(e) => {
                  if (e.target.value === "__custom__") {
                    setIsCustom(true);
                  } else {
                    setUpskillSkill(e.target.value);
                  }
                }}
                className="w-full bg-muted/50 ring-1 ring-border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand"
              >
                <option value="">-- Choose one --</option>
                {(state.skills.length > 0 ? state.skills : ["Python", "Canva", "Content Writing", "Video Editing", "Figma"]).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
                <option value="__custom__">+ Type a custom skill...</option>
              </select>
            )}
          </div>
          <div className="w-full sm:w-auto">
            <button
              onClick={() => {
                const target = isCustom ? customSkill.trim() : upskillSkill;
                if (!target) return;
                navigate({
                  to: "/assessment",
                  search: { skill: target, difficulty: "medium" },
                });
              }}
              disabled={!(isCustom ? customSkill.trim() : upskillSkill)}
              className="w-full bg-brand text-brand-foreground text-sm font-semibold px-5 py-2.5 rounded-lg hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed transition shrink-0"
            >
              Start Moderate Assessment →
            </button>
          </div>
        </div>
        {isCustom && (
          <button
            onClick={() => {
              setIsCustom(false);
              setCustomSkill("");
            }}
            className="text-xs text-brand font-medium mt-2 hover:underline"
          >
            ← Back to dropdown list
          </button>
        )}
      </Card>

      <Card className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Recent ledger</h2>
          <Link to="/income" className="text-sm font-semibold text-brand">Open ledger →</Link>
        </div>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-sm min-w-[400px] px-4 sm:px-0">
            <thead className="text-xs text-muted-foreground border-b border-border">
              <tr>
                <th className="text-left font-medium py-2 pl-4 sm:pl-0">Date</th>
                <th className="text-left font-medium py-2">Project</th>
                <th className="text-left font-medium py-2 hidden sm:table-cell">Client</th>
                <th className="text-left font-medium py-2 hidden sm:table-cell">Skill</th>
                <th className="text-right font-medium py-2 pr-4 sm:pr-0">Amount</th>
              </tr>
            </thead>
            <tbody>
              {state.income.slice(0, 5).map((e) => (
                <tr key={e.id} className="border-b border-border last:border-0">
                  <td className="py-3 text-muted-foreground whitespace-nowrap pl-4 sm:pl-0">{new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                  <td className="py-3 font-medium max-w-[140px] truncate">{e.project}</td>
                  <td className="py-3 text-muted-foreground hidden sm:table-cell">{e.client}</td>
                  <td className="py-3 hidden sm:table-cell"><span className="text-xs px-2 py-0.5 rounded bg-brand/10 text-brand font-medium">{e.skill}</span></td>
                  <td className="py-3 text-right font-semibold whitespace-nowrap pr-4 sm:pr-0">₹{e.amount.toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      </RequireAuth>
    </Shell>
  );
}
